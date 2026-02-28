import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getPostById, updatePost } from '../services/postService'
import { createComment, getCommentsByPostId } from '../services/commentService'
import { castPostVote, removePostVote, getUserPostVote } from '../services/voteService'
import { getTagsByPostId, addTagToPost, removeTagFromPost } from '../services/tagService'
import CommentNode from './CommentNode'
import { buildCommentTree } from '../utils/commentTree'
import { deletePost } from '../services/postService'

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
    const [user, setUser] = useState(null);
    const [userVote, setUserVote] = useState(null);
    const [displayScore, setDisplayScore] = useState(0);
    const [tags, setTags] = useState([]);

    const handleAddComment = async () => {
        if (!comment.trim() || !user) return;
        try {
            await createComment(id, null, user.id, comment);
            setComment('');
            fetchComments();
        } catch {
            setCommentsError('Грешка при добавяне на коментар.');
        }
    };

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

    const fetchComments = useCallback(async () => {
        setCommentsLoading(true);
        setCommentsError(null);
        try {
            const data = await getCommentsByPostId(id);
            const filtered = (data || []).filter(c => !c.is_deleted);
            const tree = buildCommentTree(filtered);
            setComments(tree);
        } catch {
            setCommentsError('Грешка при зареждане на коментарите.');
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
                setError('Грешка при зареждане на поста.');
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

    if (loading) return <div>Зареждане на поста...</div>
    if (!post) return <div>{error || 'Постът не е намерен'}</div>

    const authorName = post.profiles?.username || 'Unknown author';
    const isAuthor = user && authorName === user.user_metadata?.username;

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
        if (!editTitle.trim() || !editContent.trim()) {
            setEditError('Заглавието и съдържанието са задължителни.');
            return;
        }
        try {
            const updated = await updatePost(id, { title: editTitle, content: editContent });
            const editNames = new Set(editTags.map(t => t.name));
            for (const tag of tags) {
                if (!editNames.has(tag.name)) await removeTagFromPost(id, tag.id);
            }
            const originalNames = new Set(tags.map(t => t.name));
            for (const tag of editTags) {
                if (!originalNames.has(tag.name)) await addTagToPost(id, tag.name);
            }
            try {
                const refreshedTags = await getTagsByPostId(id);
                setTags(refreshedTags);
            } catch {}
            setPost({ ...post, ...updated });
            setEditing(false);
        } catch (err) {
            setEditError(err.message || 'Грешка при обновяване.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Сигурни ли сте?')) return;
        setDeleting(true);
        try {
            await deletePost(id);
            navigate('/');
        } catch (err) {
            setDeleteError(err.message || 'Грешка при изтриване.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            {editing ? (
                <form onSubmit={handleEditSubmit} style={{ marginBottom: 24 }}>
                    <h2>Редактирай пост</h2>
                    {/* ... (формата за редактиране остава същата) ... */}
                </form>
            ) : (
                <>
                    <h2>{post.title}</h2>
                    <p>
                        от <Link 
                            to={`/profile/${authorName}`}
                            style={{ fontWeight: 'bold', textDecoration: 'none', color: '#dc2626' }}
                           >
                            {authorName}
                        </Link>
                    </p>
                    <p>Категория: <Link to={`/category/${post.categories?.slug}`}>{post.categories?.name}</Link></p>
                    {tags.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            {tags.map(tag => (
                                <Link key={tag.id} to={`/tags/${tag.name}`} className="tag-chip">
                                    {tag.name}
                                </Link>
                            ))}
                        </div>
                    )}
                    <p>{post.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                        <button onClick={() => handleVote(1)} disabled={!user} style={{ background: 'none', border: 'none', cursor: user ? 'pointer' : 'default', fontSize: 20, opacity: userVote === 1 ? 1 : 0.4 }}>▲</button>
                        <span style={{ fontWeight: 'bold', fontSize: 18, minWidth: 24, textAlign: 'center' }}>{displayScore}</span>
                        <button onClick={() => handleVote(-1)} disabled={!user} style={{ background: 'none', border: 'none', cursor: user ? 'pointer' : 'default', fontSize: 20, opacity: userVote === -1 ? 1 : 0.4 }}>▼</button>
                    </div>
                    {isAuthor && (
                        <>
                            <button onClick={handleEdit} style={{ background: 'orange', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, marginRight: 8 }}>Редактирай</button>
                            <button onClick={handleDelete} disabled={deleting} style={{ background: 'red', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}>{deleting ? 'Изтриване...' : 'Изтрий'}</button>
                        </>
                    )}
                </>
            )}

            <hr />
            <h3>Коментари</h3>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Напиши коментар..." />
            <button onClick={handleAddComment}>Коментирай</button>

            {commentsLoading ? (
                <div>Зареждане на коментари...</div>
            ) : (
                comments.map(comment => (
                    <CommentNode key={comment.id} comment={comment} postId={id} refreshComments={fetchComments} user={user} />
                ))
            )}
        </div>
    )
}