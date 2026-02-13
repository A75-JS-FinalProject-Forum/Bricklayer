import { supabase } from '../lib/supabase';

// CREATE a new post
export async function createPost({ author_id, category_id, title, content }) {

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
    .select('*')
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
    .select('*')
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
    .single();

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
