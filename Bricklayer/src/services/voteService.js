import { supabase } from '../lib/supabase';

export async function castPostVote(userId, postId, voteType) {
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      { user_id: userId, post_id: postId, comment_id: null, vote_type: voteType },
      { onConflict: 'user_id,post_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function castCommentVote(userId, commentId, voteType) {
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      { user_id: userId, post_id: null, comment_id: commentId, vote_type: voteType },
      { onConflict: 'user_id,comment_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removePostVote(userId, postId) {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
  return true;
}

export async function removeCommentVote(userId, commentId) {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('user_id', userId)
    .eq('comment_id', commentId);

  if (error) throw error;
  return true;
}

export async function getUserPostVote(userId, postId) {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUserCommentVote(userId, commentId) {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
