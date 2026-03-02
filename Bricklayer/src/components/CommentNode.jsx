import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { castCommentVote, removeCommentVote, getUserCommentVote } from '../services/voteService';
import { updateComment, deleteComment } from '../services/commentService';

export default function CommentNode({ comment, postId, depth = 0, refreshComments, user, isAdmin = false }) {
    const isAuthor = user && comment.author_id === user.id;
    const canModify = isAuthor || isAdmin;
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [editError, setEditError] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    const [deleting, setDeleting] = useState(false);
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
                // Remove vote, revert score by previous vote value
                await removeCommentVote(user.id, comment.id);
                if (userVote) {
                    setDisplayScore(prev => prev - userVote);
                }
                setUserVote(null);
            } else {
                await castCommentVote(user.id, comment.id, voteType);
                // If there was a previous vote, subtract it and add new vote
                const scoreDelta = (userVote ? voteType - userVote : voteType);
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
                <strong>
                    {comment.profiles?.username ? (
                        <Link to={`/profile/${comment.profiles.username}`} className="author-link">
                            {comment.profiles.username}
                        </Link>
                    ) : 'Unknown'}
                </strong>
                {editing ? (
                    <>
                        <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={3}
                        />
                        <br />
                        <button
                            onClick={async () => {
                                setEditError(null);
                                if (!editText.trim()) {
                                    setEditError('Comment cannot be empty.');
                                    return;
                                }
                                try {
                                    await updateComment(comment.id, editText, { asAdmin: isAdmin && !isAuthor });
                                    setEditing(false);
                                    refreshComments();
                                } catch {
                                    setEditError('Failed to update comment.');
                                }
                            }}
                            style={{ marginRight: 8 }}
                        >Save</button>

                        <button onClick={() => { setEditing(false); setEditText(comment.content); }}>
                            Cancel
                        </button>

                        {editError && <div className="error-inline">{editError}</div>}
                    </>
                ) : (
                    <p>{comment.content}</p>
                )}
                <div className="vote-controls--sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                        onClick={() => handleVote(1)}
                        disabled={!user}
                        className={`vote-btn vote-btn--sm${userVote === 1 ? ' active' : ''}`}
                    >
                        ▲
                    </button>
                    <small className="vote-score--sm" style={{ fontWeight: 'bold' }}>{displayScore}</small>
                    <button
                        onClick={() => handleVote(-1)}
                        disabled={!user}
                        className={`vote-btn vote-btn--sm${userVote === -1 ? ' active' : ''}`}
                    >
                        ▼
                    </button>
                </div>
                <div>
                    <button onClick={() => setShowReply(!showReply)} disabled={!user}>
                        Reply
                    </button>
                    {canModify && !editing && (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                className="comment-actions-gap"
                            >Edit</button>
                            <button
                                onClick={async () => {
                                    setDeleteError(null);

                                    if (!window.confirm('Delete this comment?')) return;
                                    setDeleting(true);
                                    try {
                                        await deleteComment(comment.id, { asAdmin: isAdmin && !isAuthor });
                                        refreshComments();
                                    } catch {
                                        setDeleteError('Failed to delete comment.');
                                    }
                                }}
                                className="comment-delete-btn"
                                disabled={deleting}
                            >{deleting ? 'Deleting...' : 'Delete'}
                            </button>
                            {deleteError && <div className="error-inline">{deleteError}</div>}
                        </>
                    )}
                </div>
                {showReply && (
                    <div className="comment-reply-section">
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
                        {error && <div className="error-inline">{error}</div>}
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
                    isAdmin={isAdmin}
                />
            ))}
        </div>
    );
}
