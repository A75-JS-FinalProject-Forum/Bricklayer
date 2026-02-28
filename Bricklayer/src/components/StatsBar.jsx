import { useEffect, useState } from 'react';
import { getTotalUsers } from '../services/userService';
import { getTotalPosts } from '../services/postService';
import { getTotalComments } from '../services/commentService';

export default function StatsBar() {

    const [users, setUsers] = useState(null);
    const [posts, setPosts] = useState(null);
    const [comments, setComments] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [u, p, c] = await Promise.all([
                    getTotalUsers(),
                    getTotalPosts(),
                    getTotalComments()
                ]);
                setUsers(u);
                setPosts(p);
                setComments(c);
            } catch {
                setError('Failed to load statistics.');
            }
        }
        fetchStats();
    }, []);

    return (
        <section>
            <h3>Statistics</h3>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <ul>
                <li>Total Users: {users !== null ? users : '...'}</li>
                <li>Total Posts: {posts !== null ? posts : '...'}</li>
                <li>Total Comments: {comments !== null ? comments : '...'}</li>
            </ul>
        </section>
    );
}
