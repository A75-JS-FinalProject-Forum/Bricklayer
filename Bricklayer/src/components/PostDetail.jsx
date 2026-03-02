import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/useAuth'
import { getPostById, updatePost } from '../services/postService'
import { createComment, getCommentsByPostId } from '../services/commentService'
import { castPostVote, removePostVote, getUserPostVote } from '../services/voteService'
import { getTagsByPostId, addTagToPost, removeTagFromPost } from '../services/tagService'
import CommentNode from './CommentNode'
import { buildCommentTree } from '../utils/commentTree'
import { deletePost } from '../services/postService'
import { Link } from 'react-router-dom'
import { userService } from '../services/userService'

export default function PostDetail() {

    const { id } = useParams()
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(null);
    const [editTags, setEditTags] = useState([]);
    const [editTagInput, setEditTagInput] = useState('');

    const [post, setPost] = useState(null);

    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentsError, setCommentsError] = useState(null);
    const [userVote, setUserVote] = useState(null);
    const [displayScore, setDisplayScore] = useState(0);
    const [tags, setTags] = useState([]);

    // Use useAuth hook at the top level
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!user) { setIsAdmin(false); return; }
        userService.getProfile(user.id)
            .then(profile => setIsAdmin(profile?.is_admin || false))
            .catch(() => setIsAdmin(false));
    }, [user]);

    const handleAddComment = async () => {
        if (!comment.trim() || !user) return;
        try {
            await createComment(id, null, user.id, comment);
            setComment('');
            fetchComments();
        } catch {
            setCommentsError('Failed to add comment.');
        }
    };

    // ...CommentNode extracted to its own file...
    const fetchComments = useCallback(async () => {
        setCommentsLoading(true);
        setCommentsError(null);
        try {
            const data = await getCommentsByPostId(id);
            const filtered = (data || []).filter(c => !c.is_deleted);
            const tree = buildCommentTree(filtered);
            setComments(tree);
        } catch {
            setCommentsError('Failed to load comments.');
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const postData = await getPostById(id);
                setPost(postData);
            } catch {
                setError('Failed to load post.');
                setPost(null);
            } finally {
                setLoading(false);
            }
            fetchComments();
        };
        fetchData();
    }, [id, fetchComments])

    useEffect(() => {
        if (post) setDisplayScore(post.score);
    }, [post]);

    useEffect(() => {
        if (!user || !id) return;
        getUserPostVote(user.id, id)
            .then(vote => setUserVote(vote?.vote_type || null))
            .catch(() => setUserVote(null));
    }, [user, id]);

    useEffect(() => {
        if (!id) return;
        getTagsByPostId(id)
            .then(setTags)
            .catch(() => setTags([]));
    }, [id]);

    const handleVote = async (voteType) => {
        if (!user) return;

        try {
            if (userVote === voteType) {
                await removePostVote(user.id, id);
                setDisplayScore(prev => prev - voteType);
                setUserVote(null);
            } else {
                await castPostVote(user.id, id, voteType);
                const previousVote = userVote ?? 0;
                const delta = voteType - previousVote;
                setDisplayScore(prev => prev + delta);
                setUserVote(voteType);
            }
        } catch (err) {
            console.error("Vote failed:", err);
        }
    };

    if (loading) {
        return <div className="loading-text">Loading post...</div>
    }

    if (!post) {
        return <div>{error || 'Post not found'}</div>
    }

    const isAuthor = user && post.profiles?.username === user.user_metadata?.username;
    const canModify = isAuthor || isAdmin;

    const handleEdit = () => {
        setEditTitle(post.title);
        setEditContent(post.content);
        setEditTags(tags.map(t => ({ id: t.id, name: t.name })));
        setEditTagInput('');
        setEditError(null);
        setEditSuccess(null);
        setEditing(true);
    };

    const handleEditCancel = () => {
        setEditing(false);
        setEditError(null);
        setEditSuccess(null);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError(null);
        setEditSuccess(null);
        if (!editTitle.trim() || !editContent.trim()) {
            setEditError('Title and content are required.');
            return;
        }
        try {
            const updated = await updatePost(id, { title: editTitle, content: editContent });

            const originalNames = new Set(tags.map(t => t.name));
            const editNames = new Set(editTags.map(t => t.name));

            for (const tag of tags) {
                if (!editNames.has(tag.name)) {
                    await removeTagFromPost(id, tag.id);
                }
            }

            for (const tag of editTags) {
                if (!originalNames.has(tag.name)) {
                    await addTagToPost(id, tag.name);
                }
            }

            try {
                const refreshedTags = await getTagsByPostId(id);
                setTags(refreshedTags);
            } catch {
            }

            setPost({ ...post, ...updated });
            setEditSuccess('Post updated successfully.');
            setEditing(false);
        } catch (err) {
            setEditError(err.message || 'Failed to update post.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }

        setDeleting(true);
        setDeleteError(null);

        try {
            await deletePost(id);
            navigate('/');
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete post.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            {editing ? (
                <form onSubmit={handleEditSubmit} className="form-section" style={{ marginBottom: 24 }}>
                    <h2>Edit Post</h2>
                    <div>
                        <label>Title</label><br />
                        <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                        />
                    </div>
                    <div className="form-section">
                        <label>Content</label><br />
                        <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={6}
                        />
                    </div>
                    <div className="form-section">
                        <label>Tags (up to 5)</label><br />
                        <div className="tag-row">
                            {editTags.map(tag => (
                                <span key={tag.id ?? tag.name} className="tag-chip" style={{ cursor: 'default' }}>
                                    {tag.name}
                                    <button
                                        type="button"
                                        onClick={() => setEditTags(prev => prev.filter(t => t.name !== tag.name))}
                                        className="tag-remove-btn"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={editTagInput}
                            onChange={e => setEditTagInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const name = editTagInput.toLowerCase().trim();
                                    if (name && editTags.length < 5 && !editTags.some(t => t.name === name)) {
                                        setEditTags(prev => [...prev, { id: null, name }]);
                                    }
                                    setEditTagInput('');
                                }
                            }}
                            placeholder={editTags.length >= 5 ? 'Max 5 tags' : 'Type a tag and press Enter'}
                            disabled={editTags.length >= 5}
                        />
                    </div>
                    {editError && <div className="error-inline">{editError}</div>}
                    {editSuccess && <div className="success-inline">{editSuccess}</div>}
                    <div className="post-actions">
                        <button type="submit">Save</button>
                        <button type="button" onClick={handleEditCancel}>Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <h2>{post.title}</h2>
                    <p>by {post.profiles?.username ? <Link to={`/profile/${post.profiles.username}`} className="author-link">{post.profiles.username}</Link> : 'Unknown author'}</p>
                    <p>Category: <Link to={`/category/${post.categories?.slug}`} className="author-link">{post.categories?.name}</Link></p>
                    {tags.length > 0 && (
                        <div className="tags-display">
                            {tags.map(tag => (
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
                    <p>{post.content}</p>
                    <div className="vote-controls">
                        <button
                            onClick={() => handleVote(1)}
                            disabled={!user}
                            className={`vote-btn${userVote === 1 ? ' active' : ''}`}
                            title={user ? 'Upvote' : 'Log in to vote'}
                        >
                            ▲
                        </button>
                        <span className="vote-score">
                            {displayScore}
                        </span>
                        <button
                            onClick={() => handleVote(-1)}
                            disabled={!user}
                            className={`vote-btn${userVote === -1 ? ' active' : ''}`}
                            title={user ? 'Downvote' : 'Log in to vote'}
                        >
                            ▼
                        </button>
                    </div>
                    {canModify && (
                        <div className="post-actions">
                            <button
                                onClick={handleEdit}
                                className="btn-edit"
                            >
                                Edit Post
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn-delete"
                            >
                                {deleting ? 'Deleting...' : 'Delete Post'}
                            </button>
                        </div>
                    )}
                    {deleteError && <div className="error-inline">{deleteError}</div>}
                </>
            )}

            <hr />

            <h3>Comments</h3>

            <textarea
                name="submit-comment"
                id="submit"
                value={comment}
                onChange={e => setComment(e.target.value)}
            />

            <button onClick={handleAddComment}>Comment</button>

            {commentsLoading ? (
                <div className="loading-text">Loading comments...</div>
            ) : commentsError ? (
                <div className="error-inline">{commentsError}</div>
            ) : comments.length === 0 ? (
                <div>No comments yet.</div>
            ) : (
                comments.map(comment => (
                    <CommentNode
                        key={comment.id}
                        comment={comment}
                        postId={id}
                        refreshComments={fetchComments}
                        user={user}
                        isAdmin={isAdmin}
                    />
                ))
            )}
        </div>
    )
}
