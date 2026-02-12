import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export default function CommunitySpotlight() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTopUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, reputation')
        .order('reputation', { ascending: false })
        .limit(5)

      if (error) {
        setError(error.message)
      } else {
        setUsers(data)
      }

      setLoading(false)
    }

    fetchTopUsers()
  }, [])

  if (loading) {
    return <div>Loading spotlight...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="community-spotlight">
      <h2>Community Spotlight</h2>

      <ul>
        {users.map((user, index) => (
          <li key={user.id} className="spotlight-user">
            <span className="rank">#{index + 1}</span>

            <Link to={`/profile/${user.username}`}>
              <img
                src={user.avatar_url || '/default-avatar.png'}
                alt={user.username}
                width={40}
                height={40}
              />
            </Link>

            <div>
              <Link to={`/profile/${user.username}`}>
                <strong>{user.username}</strong>
              </Link>
              <p>{user.reputation} reputation</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
