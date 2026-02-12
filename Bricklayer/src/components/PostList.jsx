import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'
import PostCard from './PostCard'

export default function PostList() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: postsError } = await supabase
                    .from('posts')
                    .select(`
                        id,
                        title,
                        score,
                        comments_count,
                        created_at,
                        profiles (username),
                        categories (name, slug)
                    `)
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: false })
                    .limit(20);
                if (postsError) throw postsError;
                setPosts(data || []);
            } catch {
                setError('Failed to load posts.');
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [])

    if (loading) {
        return <div>Loading posts...</div>
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }
    if (posts.length === 0) {
        return <div>No posts found.</div>;
    }
    return (
        <div>
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
