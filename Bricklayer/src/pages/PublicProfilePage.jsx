import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { badgeService } from '../services/badgeService';
import '../styles/publicProfile.css';

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await userService.getProfileByUsername(username);
        setProfile(data);

        if (data?.id) {
          try {
            const userBadges = await badgeService.getUserBadges(data.id);
            setBadges(userBadges);
          } catch {
            // Badges are non-critical; silently ignore if table doesn't exist yet
          }
        }
      } catch (err) {
        setError("User was not found.");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (loading) return <div className="message-center">Loading profile...</div>;
  if (error) return <div className="message-center message-error">{error}</div>;
  if (!profile) return <div className="message-center">Profile does not exist.</div>;

  return (
    <div className="profile-container">
      <div className="profile-card public-view">
        
        <div className="avatar-section">
          {profile.avatar_url && !avatarBroken ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="avatar-image-large"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            <div className="avatar-placeholder-large">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="public-info">
          <h2 className="public-username">@{profile.username}</h2>
          
          <div className="badge-container">
            <span className="badge reputation-badge">
              Reputation: {profile.reputation || 0} 
            </span>
            <span className="badge date-badge">
              Member from: {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>

          {badges.length > 0 && (
            <div className="badges-row">
              {badges.map(ub => (
                <span key={ub.badge_id} className="badge-chip" title={ub.badges?.description}>
                  {ub.badges?.name}
                </span>
              ))}
            </div>
          )}

          <div className="public-footer">
            <p>Public profile of: {profile.username}.</p>
          </div>
        </div>

      </div>
    </div>
  );
}