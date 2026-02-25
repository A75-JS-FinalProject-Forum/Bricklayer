import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createPost } from '../services/postService';
import { addTagToPost } from '../services/tagService';
import { AuthContext } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function CreatePost() {

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const navigate = useNavigate();

  const handleAddTag = (value) => {
    const tag = value.toLowerCase().trim();
    if (tag && selectedTags.length < 5 && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      
      const { data: { user } } = await supabase.auth.getUser(); // TODO: how to get AuthContext?
      
      if (!user) {

        setError('You must be logged in to create a post.');
        setLoading(false);
        return;

      }

      // BUG 1 (Boris): createPost call below is broken (no await, array, wrong field name).
      // Once fixed, this should be: const newPost = await createPost({ author_id: user.id, title, content });
      const { error: postError } = createPost([
        {
          title,
          content,
          user_id: user.id,
        }
      ]);

      if (postError) {
        throw postError;
      }

      // Save tags to the created post (will work once Bug 1 is fixed and newPost.id is available)
      // TODO: After Bug 1 fix, change to: if (newPost?.id && selectedTags.length > 0)
      //   for (const tagName of selectedTags) { await addTagToPost(newPost.id, tagName); }

      navigate('/'); // Redirect to home or posts page
    } catch (err) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      
      <div><Toaster/></div>

      <h2>Create New Post</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label><br />
          <input
            type="text"
            value={title}
            onChange= {e => 
                setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <label>Content</label><br />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={6}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <label>Tags (up to 5)</label><br />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {selectedTags.map(tag => (
              <span key={tag} className="tag-chip" style={{ cursor: 'default' }}>
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
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
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={selectedTags.length >= 5 ? 'Max 5 tags' : 'Type a tag and press Enter'}
            disabled={selectedTags.length >= 5}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error} {toast("Тухличката е поставена успешно! 🧱")}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
