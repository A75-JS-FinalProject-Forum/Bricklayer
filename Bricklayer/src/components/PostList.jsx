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
        return <div>Loading posts...</div>
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }
    if (posts.length === 0) {
        return <div>No posts found.</div>;
    }
    return (
        <div className="post-list">
            <div className="sort-controls" style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                {SORT_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        style={{
                            padding: '6px 14px',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            background: sortBy === opt.value ? '#333' : '#fff',
                            color: sortBy === opt.value ? '#fff' : '#333',
                            cursor: 'pointer',
                            fontWeight: sortBy === opt.value ? 'bold' : 'normal',
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
                <select
                    value={categoryId || ''}
                    onChange={e => setCategoryId(e.target.value || null)}
                    style={{
                        padding: '6px 10px',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
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
