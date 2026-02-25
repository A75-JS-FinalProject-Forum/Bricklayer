import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { castPostVote, removePostVote, getUserPostVote } from '../services/voteService';

export default function PostCard({ post, user }) {
    const [userVote, setUserVote] = useState(null);
    const [displayScore, setDisplayScore] = useState(post.score);

    useEffect(() => {
        if (!user || !post.id) return;
        getUserPostVote(user.id, post.id)
            .then(vote => setUserVote(vote?.vote_type || null))
            .catch(() => setUserVote(null));
    }, [user, post.id]);

    const handleVote = async (e, voteType) => {
        e.preventDefault();
        if (!user) return;
        try {
            if (userVote === voteType) {
                await removePostVote(user.id, post.id);
                setDisplayScore(prev => prev - voteType);
                setUserVote(null);
            } else {
                await castPostVote(user.id, post.id, voteType);
                const scoreDelta = userVote ? voteType - userVote : voteType;
                setDisplayScore(prev => prev + scoreDelta);
                setUserVote(voteType);
            }
        } catch (err) {
            console.error('Vote failed:', err);
        }
    };

    return (
        <div className="post-card">
            <h3>
                <Link to={`/posts/${post.id}`}>
                    {post.title}
                </Link>
            </h3>
            <p>
                by {post.profiles?.username || 'Unknown author'}
                {post.categories && (
                    <> in {post.categories.name}</>
                )}
            </p>
            {post.tags && post.tags.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                    {post.tags.map(tag => (
                        <Link
                            key={tag.id}
                            to={`/tags/${tag.name}`}
                            style={{
                                display: 'inline-block',
                                background: '#e0e0e0',
                                borderRadius: 12,
                                padding: '1px 8px',
                                marginRight: 4,
                                fontSize: 12,
                                textDecoration: 'none',
                                color: '#333'
                            }}
                        >
                            {tag.name}
                        </Link>
                    ))}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                    onClick={(e) => handleVote(e, 1)}
                    disabled={!user}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: user ? 'pointer' : 'default',
                        fontSize: 14,
                        opacity: userVote === 1 ? 1 : 0.4,
                        padding: '0 2px'
                    }}
                >
                    ▲
                </button>
                <span style={{ fontWeight: 'bold', minWidth: 16, textAlign: 'center' }}>
                    {displayScore}
                </span>
                <button
                    onClick={(e) => handleVote(e, -1)}
                    disabled={!user}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: user ? 'pointer' : 'default',
                        fontSize: 14,
                        opacity: userVote === -1 ? 1 : 0.4,
                        padding: '0 2px'
                    }}
                >
                    ▼
                </button>
                <span style={{ marginLeft: 8 }}>| 💬 {post.comments_count}</span>
            </div>
        </div>
    );
}
