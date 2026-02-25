import { supabase } from '../lib/supabase';

export async function getAllTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getTagsByPostId(postId) {
  const { data, error } = await supabase
    .from('post_tags')
    .select('tag_id, tags(id, name)')
    .eq('post_id', postId);

  if (error) throw error;
  return (data || []).map(pt => pt.tags);
}

export async function addTagToPost(postId, tagName) {
  const normalizedName = tagName.toLowerCase().trim();

  // Find or create the tag
  let { data: existingTag } = await supabase
    .from('tags')
    .select('id')
    .eq('name', normalizedName)
    .maybeSingle();

  let tagId;
  if (existingTag) {
    tagId = existingTag.id;
  } else {
    const { data: newTag, error: createError } = await supabase
      .from('tags')
      .insert({ name: normalizedName })
      .select()
      .single();

    if (createError) throw createError;
    tagId = newTag.id;
  }

  // Link tag to post
  const { error: linkError } = await supabase
    .from('post_tags')
    .upsert(
      { post_id: postId, tag_id: tagId },
      { onConflict: 'post_id,tag_id' }
    );

  if (linkError) throw linkError;
  return { id: tagId, name: normalizedName };
}

export async function removeTagFromPost(postId, tagId) {
  const { error } = await supabase
    .from('post_tags')
    .delete()
    .eq('post_id', postId)
    .eq('tag_id', tagId);

  if (error) throw error;
  return true;
}

export async function getPostsByTag(tagName) {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, post_tags(post_id, posts(id, title, score, comments_count, created_at, profiles(username), categories(name, slug)))')
    .eq('name', tagName.toLowerCase())
    .single();

  if (error) throw error;
  return (data?.post_tags || []).map(pt => pt.posts);
}
