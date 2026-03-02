import { supabase } from '../lib/supabase';

// Get total post count
export async function getTotalPosts() {

  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false);

  if (error) throw new Error(error.message);
  return count;

}

// Validate post data (title and content length)
export function validatePost({ title, content }) {

  if (!title || title.length < 16 || title.length > 64) {
    return 'Title must be between 16 and 64 characters.';
  }

  if (!content || content.length < 32 || content.length > 8192) {
    return 'Content must be between 32 and 8192 characters.';
  }

  return null;
}

// CREATE a new post
export async function createPost({ author_id, category_id, title, content }) {

  const validationError = validatePost({ title, content });

  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([
      { author_id, category_id, title, content }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// READ all posts
export async function getPosts(sortBy = 'created_at', categoryId = null) {
  const validSorts = ['created_at', 'comments_count', 'score'];
  const orderColumn = validSorts.includes(sortBy) ? sortBy : 'created_at';

  let query = supabase
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(username), categories(name, slug)')
    .eq('is_deleted', false);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order(orderColumn, { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

// READ a single post by ID
export async function getPostById(id) {

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(username), categories(name, slug)')
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// UPDATE a post by ID
export async function updatePost(id, updates, { asAdmin = false } = {}) {

  if (asAdmin) {
    const { error } = await supabase.rpc('admin_update_post', {
      target_id: id,
      new_title: updates.title,
      new_content: updates.content,
    });
    if (error) throw error;
    return await getPostById(id);
  }

  const { data, error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// DELETE a post by ID
export async function deletePost(id, { asAdmin = false } = {}) {

  if (asAdmin) {
    const { error } = await supabase.rpc('admin_delete_post', { target_id: id });
    if (error) throw error;
    return true;
  }

  const { error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    throw error;
  }

  return true;
}
