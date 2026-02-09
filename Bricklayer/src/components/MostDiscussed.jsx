import { useEffect, useState } from 'react';

function MostDiscussed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    setPosts([
      { id: 1, title: 'City Diorama', comments: 24 },
      { id: 2, title: 'Technic Crane', comments: 19 }
    ]);
  }, []);

  return (
    <section>
      <h2>Most Discussed</h2>
      <ul>
        {posts.map(p => (
          <li key={p.id}>
            {p.title} ({p.comments} comments)
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MostDiscussed;
