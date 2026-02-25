import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPostsByTag } from '../services/tagService';
import { useAuth } from '../context/useAuth';
import PostCard from '../components/PostCard';

export default function TagPage() {
    const { name } = useParams();
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getPostsByTag(name);
                setPosts(data || []);
            } catch {
                setError('Failed to load posts for this tag.');
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [name]);

    if (loading) return <div>Loading posts tagged "{name}"...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div>
            <h2>Posts tagged: {name}</h2>
            {posts.length === 0 ? (
                <p>No posts found with this tag.</p>
            ) : (
                posts.map(post => (
                    <PostCard key={post.id} post={post} user={user} />
                ))
            )}
        </div>
    );
}
