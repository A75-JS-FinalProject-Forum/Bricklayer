import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth.js';
import { userService } from '../services/userService.js';
import { authService } from '../services/authService.js';
import { badgeService } from '../services/badgeService.js';
import '../styles/profile.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const [badges, setBadges] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ first_name: '', last_name: '' });
  const [securityData, setSecurityData] = useState({ email: '', password: '' });

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
        
        setSecurityData({
          email: user.email || '',
          password: ''
        });

        try {
          const userBadges = await badgeService.getUserBadges(user.id);
          setBadges(userBadges);
        } catch {
          // Badges are non-critical; silently ignore if table doesn't exist yet
        }
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleAvatarSave = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setAvatarLoading(true);
      const publicUrl = await userService.uploadAvatar(user.id, file);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (err) {
      alert("Error uploading image: " + err.message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await userService.updateProfile(user.id, editData);
      setProfile(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSecuritySave = async (e) => {
    e.preventDefault();
    try {
      if (securityData.email !== user.email) {
        await authService.updateEmail(securityData.email);
        alert("Email changed.");
      }
      if (securityData.password.trim() !== '') {
        await authService.updatePassword(securityData.password);
        alert("Password changed.");
        setSecurityData(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleSecurityChange = (e) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
  };

  if (loading && !profile) return <div className="message-center">Loading profile...</div>;
  if (error) return <div className="message-center message-error">Error: {error}</div>;
  if (!profile) return <div className="message-center">Profile not found.</div>;

  return (
    <div className="profile-container">
      
      <div className="profile-card profile-header">
        <div>
          {profile.avatar_url && !avatarBroken ? (
            <img src={profile.avatar_url} alt="Avatar" className="avatar-image" onError={() => setAvatarBroken(true)} />
          ) : (
            <div className="avatar-placeholder">{profile.username?.charAt(0).toUpperCase()}</div>
          )}
        </div>
        
        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p>Registered on: {new Date(profile.created_at).toLocaleDateString()}</p>
          <p className="reputation">Reputation: {profile.reputation} </p>
          {badges.length > 0 && (
            <div className="badges-row">
              {badges.map(ub => (
                <span key={ub.badge_id} className="badge-chip" title={ub.badges?.description}>
                  {ub.badges?.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="upload-action">
          <label className={`avatar-upload-circle ${avatarLoading ? 'loading' : ''}`} title="Change photo">
            {avatarLoading ? <span className="loading-dots">...</span> : '+'}
            <input type="file" accept="image/*" hidden onChange={handleAvatarSave} disabled={avatarLoading} />
          </label>
        </div>
      </div>

      <div className="grid-columns">
        <div className="profile-card">
          <h3 className="section-title">Personal Information</h3>
          
          {isEditing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" name="first_name" value={editData.first_name} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Last name</label>
                <input type="text" name="last_name" value={editData.last_name} onChange={handleChange} className="form-input" />
              </div>
              <div className="btn-group">
                <button type="submit" disabled={loading} className="btn btn-primary">Save</button>
                <button type="button" onClick={() => setIsEditing(false)} disabled={loading} className="btn btn-secondary">Close</button>
              </div>
            </form>
          ) : (
            <div>
              <div className="info-row">
                <span className="info-label">Username</span>
                <span className="info-value">{profile.username}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Name</span>
                <span className="info-value">{profile.first_name || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Name</span>
                <span className="info-value">{profile.last_name || '-'}</span>
              </div>
              
              <button onClick={() => setIsEditing(true)} className="btn btn-outline">
                Edit Profile
              </button>
            </div>
          )}
        </div>

        <div className="profile-card">
          <h3 className="section-title">Security</h3>
          
          <form onSubmit={handleSecuritySave}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" value={securityData.email} onChange={handleSecurityChange} className="form-input bg-light" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" name="password" placeholder="Leave blank to save it" value={securityData.password} onChange={handleSecurityChange} className="form-input" />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-danger">Update Security</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}