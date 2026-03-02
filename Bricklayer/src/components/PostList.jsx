import { useEffect, useState } from 'react'
import { getPosts } from '../services/postService'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import PostCard from './PostCard'

const SORT_OPTIONS = [
    { value: 'created_at', label: 'Newest' },
    { value: 'comments_count', label: 'Most Discussed' },
    { value: 'score', label: 'Top Rated' },
];

export default function PostList() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sortBy, setSortBy] = useState('created_at')
    const [categories, setCategories] = useState([])
    const [categoryId, setCategoryId] = useState(null)

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');
            setCategories(data || []);
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const posts = await getPosts(sortBy, categoryId);
                setPosts(posts || []);
            } catch {
                setError('Failed to load posts.');
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [sortBy, categoryId])

    if (loading) {
        return <div className="loading-text">Loading posts...</div>
    }

    if (error) {
        return <div className="error-inline">{error}</div>;
    }
    if (posts.length === 0) {
        return <div>No posts found.</div>;
    }
    return (
        <div className="post-list">
            <div className="sort-controls">
                {SORT_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`sort-btn${sortBy === opt.value ? ' active' : ''}`}
                    >
                        {opt.label}
                    </button>
                ))}
                <select
                    value={categoryId || ''}
                    onChange={e => setCategoryId(e.target.value || null)}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
            {posts.map(post => (
                <PostCard key={post.id} post={post} user={user} />
            ))}
        </div>
    );
}
