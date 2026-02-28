import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

function FeaturedPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        
        // Get ISO string for 7 days ago
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('posts')
          .select('id, title, score, profiles!posts_author_id_fkey(username)')
          .eq('is_deleted', false)
          .gte('created_at', sevenDaysAgo)
          .order('score', { ascending: false })
          .limit(5);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error loading featured posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <section><h2>Loading featured builds...</h2></section>;
  }

  if (posts.length === 0) {
    return (
      <section>
        <h2>Featured Builds</h2>
        <p>No featured posts yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Featured Builds</h2>
      <ul>
        {posts.map(p => (
          <li key={p.id}>
            <Link to={`/posts/${p.id}`}>{p.title}</Link>
            {' '} by {p.profiles?.username || 'Unknown'} | Score: {p.score}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FeaturedPosts;
