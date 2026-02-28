import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { castCommentVote, removeCommentVote, getUserCommentVote } from '../services/voteService.js';
import { updateComment, deleteComment } from '../services/commentService.js';

export default function CommentNode({ comment, postId, depth = 0, refreshComments, user }) {
    const isAuthor = user && comment.author_id === user.id;
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
            setError('Трябва да сте влезли, за да отговорите.');
            return;
        }
        if (!replyText.trim()) {
            setError('Коментарът не може да бъде празен.');
            return;
        }
        if (replyText.length > 500) {
            setError('Коментарът е твърде дълъг (макс. 500 символа).');
            return;
        }
        setSubmitting(true);
        setError(null);

        // Проверка за забранено съдържание
        const forbiddenWords = ['spam', 'offensive'];
        if (forbiddenWords.some(word => replyText.toLowerCase().includes(word))) {
            setError('Коментарът съдържа забранено съдържание.');
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

    const username = comment.profiles?.username || 'Unknown';

    return (
        <div style={{ marginLeft: depth * 20, marginTop: 10 }}>
            <div className="comment">
                <Link 
                    to={`/profile/${username}`} 
                    style={{ fontWeight: 'bold', textDecoration: 'none', color: '#1d4ed8' }}
                >
                    {username}
                </Link>

                {editing ? (
                    <>
                        <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={3}
                            style={{ width: '100%', marginTop: 8 }}
                        />
                        <br />
                        <button
                            onClick={async () => {
                                setEditError(null);
                                if (!editText.trim()) {
                                    setEditError('Коментарът не може да бъде празен.');
                                    return;
                                }
                                try {
                                    await updateComment(comment.id, editText);
                                    setEditing(false);
                                    refreshComments();
                                } catch {
                                    setEditError('Грешка при обновяване.');
                                }
                            }}
                            style={{ marginRight: 8 }}
                        >Запази</button>

                        <button onClick={() => { setEditing(false); setEditText(comment.content); }}>
                            Отказ
                        </button>

                        {editError && <div style={{ color: 'red', marginTop: 4 }}>{editError}</div>}
                    </>
                ) : (
                    <p style={{ marginTop: 5 }}>{comment.content}</p>
                )}

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

                <div style={{ marginTop: 5 }}>
                    <button onClick={() => setShowReply(!showReply)} disabled={!user}>
                        Отговори
                    </button>
                    {isAuthor && !editing && (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                style={{ marginLeft: 8 }}
                            >Редактирай</button>
                            <button
                                onClick={async () => {
                                    setDeleteError(null);

                                    if (!window.confirm('Изтрий коментара?')) return;
                                    setDeleting(true);
                                    try {
                                        await deleteComment(comment.id);
                                        refreshComments();
                                    } catch {
                                        setDeleteError('Грешка при изтриване.');
                                    }
                                }}
                                style={{ marginLeft: 4, color: 'red' }}
                                disabled={deleting}
                            >{deleting ? 'Изтриване...' : 'Изтрий'}
                            </button>
                            {deleteError && <div style={{ color: 'red', marginTop: 4 }}>{deleteError}</div>}
                        </>
                    )}
                </div>

                {showReply && (
                    <div style={{ marginTop: 8 }}>
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            placeholder="Напиши отговор..."
                            maxLength={500}
                            style={{ width: '100%' }}
                        />
                        <br />
                        <button onClick={handleReply} disabled={submitting}>
                            {submitting ? 'Изпращане...' : 'Публикувай отговор'}
                        </button>
                        {error && <div style={{ color: 'red', marginTop: 4 }}>{error}</div>}
                    </div>
                )}
            </div>
            {comment.children && comment.children.map(child => (
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