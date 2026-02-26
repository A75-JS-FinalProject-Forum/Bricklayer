import { supabase } from '../lib/supabase';

// Get total comment count
export async function getTotalComments() {

    const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true });
    
        if (error) throw new Error(error.message);

    return count;

}

// Create a new comment
export const createComment = async (post_id, parent_id, author_id, content) => {

    const { data, error } = await supabase
        .from('comments')
        .insert([
            {
                content,
                post_id,
                parent_id: null,
                author_id,
                score: 0,
                is_deleted: false,
            },
        ])
        .select();

    if (error) throw error;

    return data?.[0];
}

// Update a comment's content
export const updateComment = async (id, content) => {

    const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select();

    if (error) throw error;

    return data?.[0];
}

// Soft delete a comment
export const deleteComment = async (id) => {

    const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', id);

    if (error) throw error;

    return true;
}

// Get all comments for a post, joined with profiles
export const getCommentsByPostId = async (postId) => {

    const { data, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            score,
            parent_id,
            created_at,
            is_deleted,
            author_id,
            profiles (username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}