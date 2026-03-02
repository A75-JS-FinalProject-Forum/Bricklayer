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
                by {post.profiles?.username ? <Link to={`/profile/${post.profiles.username}`} className="author-link">{post.profiles.username}</Link> : 'Unknown author'}
                {post.categories && (
                    <> in {post.categories.name}</>
                )}
            </p>
            {post.tags && post.tags.length > 0 && (
                <div className="tags-display">
                    {post.tags.map(tag => (
                        <Link
                            key={tag.id}
                            to={`/tags/${tag.name}`}
                            className="tag-chip"
                        >
                            {tag.name}
                        </Link>
                    ))}
                </div>
            )}
            <div className="vote-controls--sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                    onClick={(e) => handleVote(e, 1)}
                    disabled={!user}
                    className={`vote-btn vote-btn--md${userVote === 1 ? ' active' : ''}`}
                >
                    ▲
                </button>
                <span className="vote-score--md">
                    {displayScore}
                </span>
                <button
                    onClick={(e) => handleVote(e, -1)}
                    disabled={!user}
                    className={`vote-btn vote-btn--md${userVote === -1 ? ' active' : ''}`}
                >
                    ▼
                </button>
                <span style={{ marginLeft: 8 }}>| {post.comments_count} comments</span>
            </div>
        </div>
    );
}
