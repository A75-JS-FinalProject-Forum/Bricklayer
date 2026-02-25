import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'

function LatestPosts() {

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          created_at,
          author:profiles!posts_author_id_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .limit(10)
        ;

      if (error) {
        console.error(error);
      } else {
        setPosts(data);
      }

      setLoading(false);
    };

    fetchLatest();
  }, []);

  if (loading) {
    return <section><h2>Loading models...</h2></section>;
  }

  return (
    <section>
      <h2>Latest Posts</h2>
      <ul>
        {posts.map(p => (
          <li key={p.id}>
            <span>{p.title}{p.likes}</span>
            <small>
              by {p.author?.username} –{' '}
              {new Date(p.created_at).toLocaleDateString()}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default LatestPosts;