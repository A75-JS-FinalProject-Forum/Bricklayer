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
        setUsers(data);
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


  if (!isAdmin && loading) return <div>Checking adming priviliges...</div>;
  if (!isAdmin) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2>Command centre</h2>
      <p>Total users: {total}</p>

      <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr >
            <th style={{ padding: '8px' }}>User</th>
            <th style={{ padding: '8px' }}>Reputation</th>
            <th style={{ padding: '8px' }}>Role</th>
            <th style={{ padding: '8px' }}>Status</th>
            <th style={{ padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
          ) : (
            users.map(u => (
              <tr key={u.id}>
                <td style={{ padding: '8px' }}>{u.username}</td>
                <td style={{ padding: '8px' }}>{u.reputation}</td>
                <td style={{ padding: '8px', color: u.is_admin ? 'red' : 'black', fontWeight: 'bold' }}>
                  {u.is_admin ? 'Admin' : 'User'}
                </td>
                <td style={{ padding: '8px', color: u.is_blocked ? 'red' : 'green', fontWeight: 'bold' }}>
                  {u.is_blocked ? 'Blocked' : 'Active'}
                </td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => handleToggleAdmin(u.id, u.is_admin)} disabled={u.id === user.id} style={{ marginRight: '10px' }}>
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

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}>
          Prev
        </button>
        <span style={{ margin: '0 15px' }}>
          Page {page + 1} от {totalPages || 1}
        </span>
        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || loading}>
          Next
        </button>
      </div>
    </div>
  );
}