import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import { userService } from '../services/user.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ first_name: '', last_name: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await userService.getProfile(user.id);
        setProfile(data);
        setEditData({
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedProfile = await userService.updateProfile(user.id, editData);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      setError("Error saving: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  if (loading && !profile) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div>
      <h2>User Profile</h2>
      
      {isEditing ? (
        <div>
          <div>
            <label>First name: </label>
            <input 
              type="text" 
              name="first_name" 
              value={editData.first_name} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <label>Last name: </label>
            <input 
              type="text" 
              name="last_name" 
              value={editData.last_name} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <button onClick={handleSave} disabled={loading}>Save</button>
            <button onClick={() => setIsEditing(false)} disabled={loading}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>First name:</strong> {profile.first_name}</p>
          <p><strong>Last name:</strong> {profile.last_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Reputation:</strong> {profile.reputation}</p>
          <p><strong>Register date:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
          
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
}