-- Admin moderation RPC functions (SECURITY DEFINER bypasses all RLS)
-- Run this in Supabase SQL Editor
--
-- These functions bypass RLS entirely for admin moderation actions.
-- Each function checks admin status internally before performing the operation.

-- Drop old versions (if any) to avoid parameter-type conflicts
DROP FUNCTION IF EXISTS admin_delete_post(UUID);
DROP FUNCTION IF EXISTS admin_update_post(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_delete_comment(UUID);
DROP FUNCTION IF EXISTS admin_update_comment(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_delete_post(BIGINT);
DROP FUNCTION IF EXISTS admin_update_post(BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_delete_comment(BIGINT);
DROP FUNCTION IF EXISTS admin_update_comment(BIGINT, TEXT);

-- ============================================================
-- Admin soft-delete a post
-- ============================================================
CREATE OR REPLACE FUNCTION admin_delete_post(target_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE posts SET is_deleted = true WHERE id = target_id;
END;
$$;

-- ============================================================
-- Admin update a post (title + content)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_post(target_id BIGINT, new_title TEXT, new_content TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE posts
  SET title = new_title, content = new_content, updated_at = now()
  WHERE id = target_id;
END;
$$;

-- ============================================================
-- Admin soft-delete a comment
-- ============================================================
CREATE OR REPLACE FUNCTION admin_delete_comment(target_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE comments SET is_deleted = true WHERE id = target_id;
END;
$$;

-- ============================================================
-- Admin update a comment (content)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_comment(target_id BIGINT, new_content TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  UPDATE comments SET content = new_content WHERE id = target_id;
END;
$$;
