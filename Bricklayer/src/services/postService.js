import { supabase } from '../lib/supabase';

// Get total post count
export async function getTotalPosts() {

  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true });
    
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
export async function getPosts() {

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username), categories(name, slug)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

// READ a single post by ID
export async function getPostById(id) {

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(username)')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// UPDATE a post by ID
export async function updatePost(id, updates) {

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
export async function deletePost(id) {

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
  
  return true;
}
