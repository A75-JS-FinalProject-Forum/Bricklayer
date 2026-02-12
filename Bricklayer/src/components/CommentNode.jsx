import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function CommentNode({ comment, postId, depth = 0, refreshComments, user }) {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

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
            refreshComments(); // re-fetch comments
        } else {
            setError(dbError.message);
        }
    };

    return (
        <div style={{ marginLeft: depth * 20, marginTop: 10 }}>
            <div className="comment">
                <strong>{comment.profiles?.username}</strong>
                <p>{comment.content}</p>
                <small>⭐ {comment.score}</small>
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
