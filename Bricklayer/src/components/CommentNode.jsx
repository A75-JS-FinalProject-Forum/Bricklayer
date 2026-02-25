import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { castCommentVote, removeCommentVote, getUserCommentVote } from '../services/voteService';

export default function CommentNode({ comment, postId, depth = 0, refreshComments, user }) {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [userVote, setUserVote] = useState(null);
    const [displayScore, setDisplayScore] = useState(comment.score);

    useEffect(() => {
        if (!user || !comment.id) return;
        getUserCommentVote(user.id, comment.id)
            .then(vote => setUserVote(vote?.vote_type || null))
            .catch(() => setUserVote(null));
    }, [user, comment.id]);

    const handleVote = async (voteType) => {
        if (!user) return;
        try {
            if (userVote === voteType) {
                await removeCommentVote(user.id, comment.id);
                setDisplayScore(prev => prev - voteType);
                setUserVote(null);
            } else {
                await castCommentVote(user.id, comment.id, voteType);
                const scoreDelta = userVote ? voteType - userVote : voteType;
                setDisplayScore(prev => prev + scoreDelta);
                setUserVote(voteType);
            }
        } catch (err) {
            console.error('Comment vote failed:', err);
        }
    };

    const handleReply = async () => {
        if (!user) {
            setError('You must be logged in to reply.');
            return;
        }
        if (!replyText.trim()) {
            setError('Reply cannot be empty.');
            return;
        }
        if (replyText.length > 500) {
            setError('Reply is too long (max 500 characters).');
            return;
        }
        setSubmitting(true);
        setError(null);

        // Simple forbidden content check
        const forbiddenWords = ['spam', 'offensive'];
        if (forbiddenWords.some(word => replyText.toLowerCase().includes(word))) {
            setError('Reply contains forbidden content.');
            setSubmitting(false);
            return;
        }

        const { error: dbError } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                parent_id: comment.id,
                author_id: user.id,
                content: replyText
            });

        setSubmitting(false);

        if (!dbError) {
            setReplyText('');
            setShowReply(false);
            refreshComments();
        } else {
            setError(dbError.message);
        }
    };

    return (
        <div style={{ marginLeft: depth * 20, marginTop: 10 }}>
            <div className="comment">
                <strong>{comment.profiles?.username}</strong>
                <p>{comment.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                        onClick={() => handleVote(1)}
                        disabled={!user}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: user ? 'pointer' : 'default',
                            fontSize: 12,
                            opacity: userVote === 1 ? 1 : 0.4,
                            padding: '0 2px'
                        }}
                    >
                        ▲
                    </button>
                    <small style={{ fontWeight: 'bold' }}>{displayScore}</small>
                    <button
                        onClick={() => handleVote(-1)}
                        disabled={!user}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: user ? 'pointer' : 'default',
                            fontSize: 12,
                            opacity: userVote === -1 ? 1 : 0.4,
                            padding: '0 2px'
                        }}
                    >
                        ▼
                    </button>
                </div>
                <div>
                    <button onClick={() => setShowReply(!showReply)} disabled={!user}>
                        Reply
                    </button>
                </div>
                {showReply && (
                    <div style={{ marginTop: 8 }}>
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            placeholder="Write your reply..."
                            maxLength={500}
                        />
                        <br />
                        <button onClick={handleReply} disabled={submitting}>
                            {submitting ? 'Posting...' : 'Post Reply'}
                        </button>
                        {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}
                    </div>
                )}
            </div>
            {comment.children.map(child => (
                <CommentNode
                    key={child.id}
                    comment={child}
                    postId={postId}
                    depth={depth + 1}
                    refreshComments={refreshComments}
                    user={user}
                />
            ))}
        </div>
    );
}
