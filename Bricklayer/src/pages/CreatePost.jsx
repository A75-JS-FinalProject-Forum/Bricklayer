import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createPost } from '../services/postService';
import { AuthContext } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function CreatePost() {

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error} {toast("Тухличката е поставена успешно! 🧱")}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
