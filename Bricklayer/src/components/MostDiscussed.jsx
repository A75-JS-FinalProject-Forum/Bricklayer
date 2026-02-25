import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'

function MostDiscussed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchTop = async () => {
      const { data } = await supabase
        .from('posts')
        .select('id, title, comments_count')
        .order('comments_count', {ascending: false})
        .limit(10);

        setPosts(data ?? []);
    }
    fetchTop();
  }, []);

  return (
    <section>
      <h2>Top 10 Most Discussed</h2>
      <ul>
        {posts.map(p => (
          <li key={p.id}>
            {p.title} -- {p.comments_count} comments
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MostDiscussed;