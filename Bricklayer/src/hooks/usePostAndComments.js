import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function usePost(postId) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchPost() {
            setLoading(true);
            setError(null);
            try {
                const { data, error: postError } = await supabase
                    .from('posts')
                    .select(`id, title, content, score, created_at, profiles (username)`)
                    .eq('id', postId)
                    .eq('is_deleted', false)
                    .single();
                if (postError) throw postError;
                setPost(data);
            } catch {
                setError('Failed to load post.');
                setPost(null);
            } finally {
                setLoading(false);
            }
        }
        fetchPost();
    }, [postId]);

    return { post, loading, error };
}

export function useComments(postId) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchComments() {
            setLoading(true);
            setError(null);
            try {
                const { data, error: commentsErr } = await supabase
                    .from('comments')
                    .select(`id, content, score, parent_id, created_at, profiles (username)`)
                    .eq('post_id', postId)
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: true });
                if (commentsErr) throw commentsErr;
                setComments(data || []);
            } catch {
                setError('Failed to load comments.');
                setComments([]);
            } finally {
                setLoading(false);
            }
        }
        fetchComments();
    }, [postId]);

    return { comments, loading, error, setComments };
}
