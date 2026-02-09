import { useEffect, useState } from 'react';

function CommunitySpotlight() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setUsers([
      { id: 1, username: 'brickmaster', reputation: 120 },
      { id: 2, username: 'mocbuilder', reputation: 95 }
    ]);
  }, []);

  return (
    <section>
      <h2>Top Builders</h2>
      <ul>
        {users.map(u => (
          <li key={u.id}>
            {u.username} (rep: {u.reputation})
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CommunitySpotlight;
