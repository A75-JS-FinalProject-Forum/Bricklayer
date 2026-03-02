-- ============================================================
-- Badges System for Bricklayer Forum
-- ============================================================
-- Run this in Supabase SQL Editor (after reputation.sql).
--
-- Components:
--   1. badges table — badge definitions with criteria
--   2. user_badges table — junction table for awarded badges
--   3. Seed data — 8 default badges
--   4. check_and_award_badges(target_user_id) — checks criteria and awards badges
--   5. award_badges_on_change() — trigger function
--   6. Triggers on posts, comments, profiles
-- ============================================================

-- 1. Table: badges
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria_type TEXT NOT NULL,  -- 'posts_count', 'comments_count', 'reputation'
  criteria_value INTEGER NOT NULL
);

-- 2. Table: user_badges (junction)
CREATE TABLE user_badges (
  user_id UUID REFERENCES profiles(id),
  badge_id UUID REFERENCES badges(id),
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- 3. Seed data: default badge definitions
INSERT INTO badges (name, description, icon_url, criteria_type, criteria_value) VALUES
  ('First Post',         'Created your first post',   NULL, 'posts_count',    1),
  ('Contributor',        'Created 5 posts',           NULL, 'posts_count',    5),
  ('Prolific Writer',    'Created 10 posts',          NULL, 'posts_count',   10),
  ('Commentator',        'Left 5 comments',           NULL, 'comments_count', 5),
  ('Discussion Leader',  'Left 20 comments',          NULL, 'comments_count', 20),
  ('Rising Star',        'Reached 10 reputation',     NULL, 'reputation',    10),
  ('Trusted Member',     'Reached 50 reputation',     NULL, 'reputation',    50),
  ('Legend',             'Reached 100 reputation',     NULL, 'reputation',   100);

-- 4. Function: check_and_award_badges
--    Queries user stats, compares against badge criteria,
--    and inserts any newly earned badges.
CREATE OR REPLACE FUNCTION check_and_award_badges(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  user_posts_count INTEGER;
  user_comments_count INTEGER;
  user_reputation INTEGER;
  badge_row RECORD;
  current_value INTEGER;
BEGIN
  -- Get user stats
  SELECT COUNT(*)::INTEGER INTO user_posts_count
  FROM posts
  WHERE author_id = target_user_id AND NOT is_deleted;

  SELECT COUNT(*)::INTEGER INTO user_comments_count
  FROM comments
  WHERE author_id = target_user_id AND NOT is_deleted;

  SELECT COALESCE(reputation, 0) INTO user_reputation
  FROM profiles
  WHERE id = target_user_id;

  -- Check each badge
  FOR badge_row IN SELECT * FROM badges LOOP
    -- Determine the current value for this criteria type
    CASE badge_row.criteria_type
      WHEN 'posts_count' THEN current_value := user_posts_count;
      WHEN 'comments_count' THEN current_value := user_comments_count;
      WHEN 'reputation' THEN current_value := user_reputation;
      ELSE current_value := 0;
    END CASE;

    -- Award badge if criteria met and not already awarded
    IF current_value >= badge_row.criteria_value THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (target_user_id, badge_row.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger function: award_badges_on_change
--    Called after inserts on posts/comments and after reputation updates.
CREATE OR REPLACE FUNCTION award_badges_on_change()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Determine the target user based on which table fired the trigger
  IF TG_TABLE_NAME = 'posts' THEN
    target_user_id := NEW.author_id;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    target_user_id := NEW.author_id;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    target_user_id := NEW.id;
  END IF;

  IF target_user_id IS NOT NULL THEN
    PERFORM check_and_award_badges(target_user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Triggers

-- Award badges when a new post is created
DROP TRIGGER IF EXISTS badges_on_post_insert ON posts;
CREATE TRIGGER badges_on_post_insert
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION award_badges_on_change();

-- Award badges when a new comment is created
DROP TRIGGER IF EXISTS badges_on_comment_insert ON comments;
CREATE TRIGGER badges_on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION award_badges_on_change();

-- Award badges when reputation changes on profiles
DROP TRIGGER IF EXISTS badges_on_reputation_update ON profiles;
CREATE TRIGGER badges_on_reputation_update
  AFTER UPDATE OF reputation ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_badges_on_change();

-- 7. Backfill: check and award badges for ALL existing users
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR uid IN SELECT id FROM profiles LOOP
    PERFORM check_and_award_badges(uid);
  END LOOP;
END;
$$;
