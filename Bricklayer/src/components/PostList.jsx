import { useEffect, useState } from 'react'
import { getPosts } from '../services/postService'
import { useAuth } from '../context/useAuth'
import PostCard from './PostCard'

export default function PostList() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const posts = await getPosts();
                setPosts(posts || []);
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
                <PostCard key={post.id} post={post} user={user} />
            ))}
        </div>
    );
}
