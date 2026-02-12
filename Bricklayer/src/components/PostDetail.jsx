import { useParams } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import CommentNode from './CommentNode'
import { buildCommentTree } from '../utils/commentTree'

export default function PostDetail() {

    const { id } = useParams()

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentsError, setCommentsError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch {
                setUser(null);
            }
        };
        loadUser();
    }, [])

    // ...buildCommentTree moved to utils/commentTree.js...


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: postData, error: postError } = await supabase
                    .from('posts')
                    .select(`
                        id,
                        title,
                        content,
                        score,
                        created_at,
                        profiles (username)
                    `)
                    .eq('id', id)
                    .eq('is_deleted', false)
                    .single();
                if (postError) throw postError;
                setPost(postData);
            } catch {
                setError('Failed to load post.');
                setPost(null);
            } finally {
                setLoading(false);
            }
            fetchComments();
        };
        fetchData();
    }, [id, fetchComments])

    // ...CommentNode extracted to its own file...
    const fetchComments = useCallback(async () => {
        setCommentsLoading(true);
        setCommentsError(null);
        try {
            const { data, error: commentsErr } = await supabase
                .from('comments')
                .select(`
                id,
                content,
                score,
                parent_id,
                created_at,
                profiles (username)
            `)
                .eq('post_id', id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });
            if (commentsErr) throw commentsErr;
            const tree = buildCommentTree(data || []);
            setComments(tree);
        } catch {
            setCommentsError('Failed to load comments.');
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, [id]);

    if (loading) {
        return <div>Loading post...</div>
    }

    if (!post) {
        return <div>{error || 'Post not found'}</div>
    }



    return (
        <div>
            <h2>{post.title}</h2>
            <p>by {post.profiles?.username || 'Unknown author'}</p>
            <p>{post.content}</p>
            <p>⭐ {post.score}</p>
            <hr />
            <h3>Comments</h3>
            {commentsLoading ? (
                <div>Loading comments...</div>
            ) : commentsError ? (
                <div style={{ color: 'red' }}>{commentsError}</div>
            ) : comments.length === 0 ? (
                <div>No comments yet.</div>
            ) : (
                comments.map(comment => (
                    <CommentNode
                        key={comment.id}
                        comment={comment}
                        postId={id}
                        refreshComments={fetchComments}
                        user={user}
                    />
                ))
            )}
        </div>
    )
}
