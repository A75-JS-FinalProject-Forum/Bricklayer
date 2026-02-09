import { useEffect, useState } from 'react';

function LatestPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const data = [
          { id: 1, title: 'New Space Station Build' },
          { id: 2, title: 'Medieval Tower' }
        ];

        setPosts(data);
      } catch (error) {
        console.error("error loading:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <section><h2>Loading models...</h2></section>;
  }

  return (
    <section>
      <h2>Latest Builds</h2>
      <ul>
        {posts.map(p => (
          <li key={p.id}>
            <span>{p.title}{p.likes}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default LatestPosts;