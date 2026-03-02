-- ============================================================
-- Reputation Auto-Calculation for Bricklayer Forum
-- ============================================================
-- Run this in Supabase SQL Editor.
--
-- Formula:
--   reputation = (number of non-deleted posts)
--              + (sum of scores on user's non-deleted posts)
--              + (sum of scores on user's non-deleted comments)
--
-- Components:
--   1. recalculate_reputation(target_user_id) — recomputes and updates profiles.reputation
--   2. update_reputation_on_vote() — trigger function called after vote changes
--   3. reputation_vote_trigger — trigger on votes table (AFTER INSERT OR DELETE)
--   4. Backfill script — one-time update for all existing users
-- ============================================================

-- 1. Function: recalculate_reputation
--    Sums post count + post scores + comment scores for a user,
--    then updates their profiles.reputation.
CREATE OR REPLACE FUNCTION recalculate_reputation(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  new_reputation INTEGER;
BEGIN
  SELECT COALESCE(
    (SELECT COUNT(*)::INTEGER FROM posts WHERE author_id = target_user_id AND NOT is_deleted)
    + (SELECT COALESCE(SUM(score), 0)::INTEGER FROM posts WHERE author_id = target_user_id AND NOT is_deleted)
    + (SELECT COALESCE(SUM(score), 0)::INTEGER FROM comments WHERE author_id = target_user_id AND NOT is_deleted),
    0
  ) INTO new_reputation;

  UPDATE profiles
  SET reputation = new_reputation
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger function: update_reputation_on_vote
--    Finds the author of the voted post or comment,
--    then calls recalculate_reputation for that author.
CREATE OR REPLACE FUNCTION update_reputation_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_author_id UUID;
  vote_row RECORD;
BEGIN
  -- Use NEW for INSERT, OLD for DELETE
  IF TG_OP = 'DELETE' THEN
    vote_row := OLD;
  ELSE
    vote_row := NEW;
  END IF;

  -- Find the author of the voted content
  IF vote_row.post_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id
    FROM posts
    WHERE id = vote_row.post_id;
  ELSIF vote_row.comment_id IS NOT NULL THEN
    SELECT author_id INTO target_author_id
    FROM comments
    WHERE id = vote_row.comment_id;
  END IF;

  -- Recalculate reputation if we found an author
  IF target_author_id IS NOT NULL THEN
    PERFORM recalculate_reputation(target_author_id);
  END IF;

  RETURN vote_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger: reputation_vote_trigger
--    Fires after any vote is inserted, updated, or deleted.
--    UPDATE is needed because upsert (changing a vote) triggers UPDATE, not INSERT.
DROP TRIGGER IF EXISTS reputation_vote_trigger ON votes;
CREATE TRIGGER reputation_vote_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_vote();

-- 4. Backfill: recalculate reputation for ALL existing users
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR uid IN SELECT id FROM profiles LOOP
    PERFORM recalculate_reputation(uid);
  END LOOP;
END;
$$;
