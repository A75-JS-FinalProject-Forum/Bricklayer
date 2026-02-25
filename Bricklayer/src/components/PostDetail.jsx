import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getPostById, updatePost } from '../services/postService'
import { castPostVote, removePostVote, getUserPostVote } from '../services/voteService'
import { getTagsByPostId, addTagToPost, removeTagFromPost } from '../services/tagService'
import CommentNode from './CommentNode'
import { buildCommentTree } from '../utils/commentTree'
import { deletePost } from '../services/postService'
import { Link } from 'react-router-dom'

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
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentsError, setCommentsError] = useState(null);
    const [user, setUser] = useState(null);
    const [userVote, setUserVote] = useState(null);
    const [displayScore, setDisplayScore] = useState(0);
    const [tags, setTags] = useState([]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch {
                setUser(null);
            }
        };
        loadUser();
    }, [])

    // ...buildCommentTree moved to utils/commentTree.js...

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

    // ...CommentNode extracted to its own file...
    const fetchComments = useCallback(async () => {
        setCommentsLoading(true);
        setCommentsError(null);
        try {
            const { data, error: commentsErr } = await supabase
                .from('comments')
                .select(`
                id,
                content,
                score,
                parent_id,
                created_at,
                profiles (username)
            `)
                .eq('post_id', id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });
            if (commentsErr) throw commentsErr;
            const tree = buildCommentTree(data || []);
            setComments(tree);
        } catch {
            setCommentsError('Failed to load comments.');
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, [id]);

    // Sync displayScore when post loads
    useEffect(() => {
        if (post) setDisplayScore(post.score);
    }, [post]);

    // Fetch user's existing vote on this post
    useEffect(() => {
        if (!user || !id) return;
        getUserPostVote(user.id, id)
            .then(vote => setUserVote(vote?.vote_type || null))
            .catch(() => setUserVote(null));
    }, [user, id]);

    // Fetch tags for this post
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
                // Toggle off: remove vote
                await removePostVote(user.id, id);
                setDisplayScore(prev => prev - voteType);
                setUserVote(null);
            } else {
                // Cast new vote (or change direction)
                await castPostVote(user.id, id, voteType);
                const scoreDelta = userVote ? voteType - userVote : voteType;
                setDisplayScore(prev => prev + scoreDelta);
                setUserVote(voteType);
            }
        } catch (err) {
            console.error('Vote failed:', err);
        }
    };

    if (loading) {
        return <div>Loading post...</div>
    }

    if (!post) {
        return <div>{error || 'Post not found'}</div>
    }

    const isAuthor = user && post.profiles?.username === user.user_metadata?.username;

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

            // Diff tags: find removed and added
            const originalNames = new Set(tags.map(t => t.name));
            const editNames = new Set(editTags.map(t => t.name));

            // Remove tags that were in original but not in edit
            for (const tag of tags) {
                if (!editNames.has(tag.name)) {
                    await removeTagFromPost(id, tag.id);
                }
            }

            // Add tags that are in edit but not in original
            for (const tag of editTags) {
                if (!originalNames.has(tag.name)) {
                    await addTagToPost(id, tag.name);
                }
            }

            // Refresh tags from DB
            try {
                const refreshedTags = await getTagsByPostId(id);
                setTags(refreshedTags);
            } catch {
                // Non-critical; tags will refresh on next page load
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
            navigate('/'); // Redirect to home after deletion
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete post.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            {editing ? (
                <form onSubmit={handleEditSubmit} style={{ marginBottom: 24 }}>
                    <h2>Edit Post</h2>
                    <div>
                        <label>Title</label><br />
                        <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            style={{ width: '100%', padding: 8 }}
                        />
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <label>Content</label><br />
                        <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={6}
                            style={{ width: '100%', padding: 8 }}
                        />
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <label>Tags (up to 5)</label><br />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {editTags.map(tag => (
                                <span key={tag.id ?? tag.name} className="tag-chip" style={{ cursor: 'default' }}>
                                    {tag.name}
                                    <button
                                        type="button"
                                        onClick={() => setEditTags(prev => prev.filter(t => t.name !== tag.name))}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            marginLeft: 4,
                                            padding: 0,
                                            fontSize: '0.85rem',
                                            lineHeight: 1,
                                            color: 'inherit'
                                        }}
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
                            style={{ width: '100%', padding: 8 }}
                        />
                    </div>
                    {editError && <div style={{ color: 'red', marginTop: 8 }}>{editError}</div>}
                    {editSuccess && <div style={{ color: 'green', marginTop: 8 }}>{editSuccess}</div>}
                    <button type="submit" style={{ marginTop: 16, marginRight: 8 }}>Save</button>
                    <button type="button" onClick={handleEditCancel} style={{ marginTop: 16 }}>Cancel</button>
                </form>
            ) : (
                <>
                    <h2>{post.title}</h2>
                    <p>by {post.profiles?.username || 'Unknown author'}</p>
                    {tags.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            {tags.map(tag => (
                                <Link
                                    key={tag.id}
                                    to={`/tags/${tag.name}`}
                                    style={{
                                        display: 'inline-block',
                                        background: '#e0e0e0',
                                        borderRadius: 12,
                                        padding: '2px 10px',
                                        marginRight: 6,
                                        fontSize: 13,
                                        textDecoration: 'none',
                                        color: '#333'
                                    }}
                                >
                                    {tag.name}
                                </Link>
                            ))}
                        </div>
                    )}
                    <p>{post.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                        <button
                            onClick={() => handleVote(1)}
                            disabled={!user}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: user ? 'pointer' : 'default',
                                fontSize: 20,
                                opacity: userVote === 1 ? 1 : 0.4
                            }}
                            title={user ? 'Upvote' : 'Log in to vote'}
                        >
                            ▲
                        </button>
                        <span style={{ fontWeight: 'bold', fontSize: 18, minWidth: 24, textAlign: 'center' }}>
                            {displayScore}
                        </span>
                        <button
                            onClick={() => handleVote(-1)}
                            disabled={!user}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: user ? 'pointer' : 'default',
                                fontSize: 20,
                                opacity: userVote === -1 ? 1 : 0.4
                            }}
                            title={user ? 'Downvote' : 'Log in to vote'}
                        >
                            ▼
                        </button>
                    </div>
                    {/* Show edit/delete buttons only if user is author */}
                    {isAuthor && (
                        <>
                            <button
                                onClick={handleEdit}
                                style={{ marginTop: 16, marginRight: 8, background: 'orange', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}
                            >
                                Edit Post
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{ marginTop: 16, background: 'red', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}
                            >
                                {deleting ? 'Deleting...' : 'Delete Post'}
                            </button>
                        </>
                    )}
                    {deleteError && <div style={{ color: 'red', marginTop: 8 }}>{deleteError}</div>}
                </>
            )}
            <hr />
            <h3>Comments</h3>
            {commentsLoading ? (
                <div>Loading comments...</div>
            ) : commentsError ? (
                <div style={{ color: 'red' }}>{commentsError}</div>
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
                    />
                ))
            )}
        </div>
    )
}
