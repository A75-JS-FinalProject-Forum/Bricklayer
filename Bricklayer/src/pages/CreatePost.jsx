import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/postService';
import { addTagToPost } from '../services/tagService';
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

export default function CreatePost() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
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

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .order('name', { ascending: true });
      if (error) {
        setError(error.message)
      } else {
        setCategories(data);
        if (data && data.length > 0) {
          setSelectedCategory(data[0].id);
        }
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!user) {
      setError('You must be logged in to create a post.');
      return;
    }
    if (title.length < 16 || title.length > 64) {
      setError('Title must be between 16 and 64 characters.');
      return;
    }
    if (content.length < 32 || content.length > 8192) {
      setError('Content must be between 32 and 8192 characters.');
      return;
    }

    setLoading(true);
    try {
      const newPost = await createPost({ author_id: user.id, title, content, category_id: selectedCategory });

      // Save tags to the created post
      if (newPost?.id && selectedTags.length > 0) {
        for (const tagName of selectedTags) {
          try {
            await addTagToPost(newPost.id, tagName);
          } catch {
            // Tag saving is best-effort; don't block navigation
          }
        }
      }

      toast.success("Post created successfully!");
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <div><Toaster /></div>

      <h2>Create New Post</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label><br />
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-section">
          <label>Content</label><br />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={6}
          />
        </div>
        <div className="form-section">
          <label>Category: </label><br />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            required
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-section">
          <label>Tags (up to 5)</label><br />
          <div className="tag-row">
            {selectedTags.map(tag => (
              <span key={tag} className="tag-chip" style={{ cursor: 'default' }}>
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="tag-remove-btn"
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
          />
        </div>
        {error && <div className="error-inline">{error}</div>}
        <button type="submit" disabled={loading} className="form-section">
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
