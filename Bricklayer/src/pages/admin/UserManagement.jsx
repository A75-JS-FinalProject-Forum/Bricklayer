import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { adminService } from '../../services/adminService.js';
import { userService } from '../../services/userService.js';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const limit = 20;

  useEffect(() => {
    const verifyAdminAndFetch = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        const profile = await userService.getProfile(user.id);
        if (!profile.is_admin) {
          navigate('/');
          return;
        }
        setIsAdmin(true);

        const { data, total: count } = await adminService.getAllUsers(page, limit);
        const activity = await Promise.all(
          data.map(u => adminService.getUserActivity(u.id))
        );
        const usersWithActivity = data.map((u, i) => ({
          ...u,
          postsCount: activity[i].postsCount,
          commentsCount: activity[i].commentsCount,
        }));
        setUsers(usersWithActivity);
        setTotal(count);

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAndFetch();
  }, [user, navigate, page]);

  const handleToggleAdmin = async (targetId, currentStatus) => {
    if (targetId === user.id) return;
    if (!window.confirm(`Accept changes?`)) return;

    try {
      const updatedUser = await adminService.toggleAdmin(targetId, currentStatus);
      setUsers(users.map(u => u.id === targetId ? updatedUser : u));
    } catch (err) {
      alert("Error while making changes: " + err.message);
    }
  };

  const handleToggleBlock = async (targetId, currentStatus) => {
    if (targetId === user.id) return;
    try {
      const updatedUser = await adminService.toggleBlock(targetId, currentStatus);
      setUsers(users.map(u => u.id === targetId ? updatedUser : u));
    } catch (err) {
      alert("Error while making changes: " + err.message);
    }
  };


  if (!isAdmin && loading) return <div className="loading-text">Checking admin privileges...</div>;
  if (!isAdmin) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2>Command centre</h2>
      <p>Total users: {total}</p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Reputation</th>
            <th>Posts</th>
            <th>Comments</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7" className="loading-text">Loading...</td></tr>
          ) : (
            users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.reputation}</td>
                <td>{u.postsCount ?? '—'}</td>
                <td>{u.commentsCount ?? '—'}</td>
                <td className={u.is_admin ? 'status-admin' : ''}>
                  {u.is_admin ? 'Admin' : 'User'}
                </td>
                <td className={u.is_blocked ? 'status-blocked' : 'status-active'}>
                  {u.is_blocked ? 'Blocked' : 'Active'}
                </td>
                <td>
                  <button onClick={() => handleToggleAdmin(u.id, u.is_admin)} disabled={u.id === user.id} style={{ marginRight: 10 }}>
                    {u.is_admin ? 'Demote' : 'Promote'}
                  </button>
                  <button onClick={() => handleToggleBlock(u.id, u.is_blocked)} disabled={u.id === user.id || u.is_admin}>
                    {u.is_blocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}>
          Prev
        </button>
        <span>
          Page {page + 1} of {totalPages || 1}
        </span>
        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || loading}>
          Next
        </button>
      </div>
    </div>
  );
}
