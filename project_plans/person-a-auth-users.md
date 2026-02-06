# Person A: Authentication & User Management

## Role Overview

You own everything related to users - from database to UI. This includes registration, login, profiles, and admin user management.

---

## What You Own

### Database Tables
- `profiles` table

### Features
1. User registration
2. User login/logout
3. Profile viewing (own and others)
4. Profile editing
5. Profile photo upload
6. Admin: User search
7. Admin: Block/unblock users

### Files You'll Create
```
src/
  contexts/
    AuthContext.jsx
  services/
    authService.js
    userService.js
  pages/
    LoginPage.jsx
    RegisterPage.jsx
    ProfilePage.jsx
    admin/
      UserManagement.jsx
  components/
    auth/
      LoginForm.jsx
      RegisterForm.jsx
      ProtectedRoute.jsx
    user/
      UserCard.jsx
      ProfileEditForm.jsx
      AvatarUpload.jsx
```

---

## Week 1: Foundation (Team Together)

Work with team to:
- [ ] Set up React project
- [ ] Set up Supabase project
- [ ] Create shared components
- [ ] Set up basic routing

---

## Week 2: Authentication System

### Task 2.1: Create Profiles Table

Run in Supabase SQL Editor:

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL CHECK (length(first_name) BETWEEN 4 AND 32),
  last_name TEXT NOT NULL CHECK (length(last_name) BETWEEN 4 AND 32),
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  reputation INTEGER DEFAULT 0 CHECK (reputation >= 0),
  is_admin BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Index for faster lookups
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
```

### Task 2.2: Create Auth Service

```javascript
// src/services/authService.js
import { supabase } from '@/lib/supabase'

export const authService = {
  async signUp({ email, password, username, firstName, lastName }) {
    // Check if username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      throw new Error('Username is already taken')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Check if user is blocked
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', data.user.id)
      .single()

    if (profile?.is_blocked) {
      await supabase.auth.signOut()
      throw new Error('Your account has been blocked. Contact support.')
    }

    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
```

### Task 2.3: Create Auth Context

```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial session
    authService.getSession().then(session => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await loadProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    try {
      const data = await userService.getProfile(userId)
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const login = async (email, password) => {
    const { user } = await authService.signIn(email, password)
    setUser(user)
    await loadProfile(user.id)
    return user
  }

  const register = async (userData) => {
    return authService.signUp(userData)
  }

  const logout = async () => {
    await authService.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin || false,
    isBlocked: profile?.is_blocked || false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### Task 2.4: Create User Service

```javascript
// src/services/userService.js
import { supabase } from '@/lib/supabase'

export const userService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async getProfileByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(userId, updates) {
    // Don't allow updating username, is_admin, is_blocked
    const { username, is_admin, is_blocked, ...safeUpdates } = updates

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
```

### Task 2.5: Create Protected Route

```javascript
// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/common'

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="loading-page">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
```

### Task 2.6: Create Login Page

```javascript
// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card, Input, Button, ErrorMessage } from '@/components/common'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="auth-page">
        <Card className="auth-card">
          <Card.Header>
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </Card.Header>

          <Card.Body>
            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <Button
                type="submit"
                loading={loading}
                className="full-width"
              >
                Sign In
              </Button>
            </form>
          </Card.Body>

          <Card.Footer>
            <p>
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </Layout>
  )
}
```

### Task 2.7: Create Register Page

```javascript
// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card, Input, Button, ErrorMessage } from '@/components/common'
import { useAuth } from '@/contexts/AuthContext'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (formData.firstName.length < 4 || formData.firstName.length > 32) {
      newErrors.firstName = 'First name must be 4-32 characters'
    }

    if (formData.lastName.length < 4 || formData.lastName.length > 32) {
      newErrors.lastName = 'Last name must be 4-32 characters'
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      navigate('/login', {
        state: { message: 'Registration successful! Please sign in.' }
      })
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="auth-page">
        <Card className="auth-card">
          <Card.Header>
            <h1>Create Account</h1>
            <p>Join our community today</p>
          </Card.Header>

          <Card.Body>
            {errors.submit && <ErrorMessage message={errors.submit} />}

            <form onSubmit={handleSubmit}>
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                required
              />

              <div className="form-row">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  placeholder="4-32 characters"
                  required
                />

                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  placeholder="4-32 characters"
                  required
                />
              </div>

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="At least 6 characters"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Repeat your password"
                required
              />

              <Button
                type="submit"
                loading={loading}
                className="full-width"
              >
                Create Account
              </Button>
            </form>
          </Card.Body>

          <Card.Footer>
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </Layout>
  )
}
```

### Deliverables for Week 2
- [ ] profiles table created
- [ ] RLS policies working
- [ ] Auto-profile trigger working
- [ ] authService.js complete
- [ ] userService.js basic methods
- [ ] AuthContext working
- [ ] ProtectedRoute component
- [ ] LoginPage working
- [ ] RegisterPage working
- [ ] Users can register and login

---

## Week 3: Profile Features

### Task 3.1: Create Profile Page

```javascript
// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Card, Avatar, Button, LoadingSpinner, ErrorMessage } from '@/components/common'
import { ProfileEditForm } from '@/components/user/ProfileEditForm'
import { BadgeList } from '@/components/badge'
import { ReputationDisplay } from '@/components/vote'
import { userService } from '@/services/userService'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'

export function ProfilePage() {
  const { id } = useParams()
  const { user, profile: currentProfile, refreshProfile } = useAuth()

  const [profileData, setProfileData] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const isOwnProfile = user?.id === id

  useEffect(() => {
    loadProfile()
  }, [id])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const [profile, posts, userBadges] = await Promise.all([
        userService.getProfile(id),
        userService.getUserPosts(id),
        userService.getUserBadges(id),
      ])
      setProfileData(profile)
      setUserPosts(posts.data)
      setBadges(userBadges)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (updates) => {
    await userService.updateProfile(id, updates)
    await loadProfile()
    if (isOwnProfile) {
      await refreshProfile()
    }
    setIsEditing(false)
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>
  if (error) return <Layout><ErrorMessage message={error} /></Layout>

  return (
    <Layout>
      <div className="profile-page">
        <Card className="profile-header">
          <div className="profile-header-content">
            <Avatar
              src={profileData.avatar_url}
              alt={profileData.username}
              size="large"
            />

            <div className="profile-info">
              <h1>{profileData.username}</h1>
              <p className="profile-name">
                {profileData.first_name} {profileData.last_name}
              </p>
              <p className="profile-joined">
                Joined {formatDate(profileData.created_at)}
              </p>
            </div>

            <div className="profile-stats">
              <ReputationDisplay reputation={profileData.reputation} />
              <div className="stat">
                <span className="stat-value">{userPosts.length}</span>
                <span className="stat-label">Posts</span>
              </div>
            </div>

            {isOwnProfile && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>

          {badges.length > 0 && (
            <div className="profile-badges">
              <h3>Badges</h3>
              <BadgeList badges={badges} />
            </div>
          )}
        </Card>

        {isEditing && (
          <Card>
            <Card.Header>
              <h2>Edit Profile</h2>
            </Card.Header>
            <Card.Body>
              <ProfileEditForm
                profile={profileData}
                onSubmit={handleProfileUpdate}
                onCancel={() => setIsEditing(false)}
              />
            </Card.Body>
          </Card>
        )}

        <Card>
          <Card.Header>
            <h2>Recent Posts</h2>
          </Card.Header>
          <Card.Body>
            {userPosts.length === 0 ? (
              <p>No posts yet.</p>
            ) : (
              <div className="post-list-compact">
                {userPosts.map(post => (
                  <Link key={post.id} to={`/posts/${post.id}`} className="post-item">
                    <h3>{post.title}</h3>
                    <span>{formatDate(post.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </Layout>
  )
}
```

### Task 3.2: Create Profile Edit Form

```javascript
// src/components/user/ProfileEditForm.jsx
import { useState } from 'react'
import { Input, Button, ErrorMessage } from '@/components/common'
import { AvatarUpload } from './AvatarUpload'

export function ProfileEditForm({ profile, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const newErrors = {}

    if (formData.firstName.length < 4 || formData.firstName.length > 32) {
      newErrors.firstName = 'First name must be 4-32 characters'
    }

    if (formData.lastName.length < 4 || formData.lastName.length > 32) {
      newErrors.lastName = 'Last name must be 4-32 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      await onSubmit({
        first_name: formData.firstName,
        last_name: formData.lastName,
        avatar_url: formData.avatarUrl,
      })
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="profile-edit-form">
      {errors.submit && <ErrorMessage message={errors.submit} />}

      <AvatarUpload
        userId={profile.id}
        currentUrl={formData.avatarUrl}
        onUpload={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
      />

      <Input
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        error={errors.firstName}
      />

      <Input
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        error={errors.lastName}
      />

      <div className="form-note">
        <strong>Username:</strong> {profile.username}
        <br />
        <small>Username cannot be changed</small>
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}
```

### Task 3.3: Create Avatar Upload

```javascript
// src/components/user/AvatarUpload.jsx
import { useState, useRef } from 'react'
import { Avatar, Button, LoadingSpinner } from '@/components/common'
import { userService } from '@/services/userService'

export function AvatarUpload({ userId, currentUrl, onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const url = await userService.uploadAvatar(userId, file)
      onUpload(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="avatar-upload">
      <Avatar src={currentUrl} alt="Profile" size="large" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Button
        type="button"
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <LoadingSpinner size="small" /> : 'Change Avatar'}
      </Button>

      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
```

### Task 3.4: Update User Service for Avatar

```javascript
// Add to src/services/userService.js
import { supabase } from '@/lib/supabase'

export const userService = {
  // ... existing methods

  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile
    await this.updateProfile(userId, { avatar_url: publicUrl })

    return publicUrl
  },

  async getUserPosts(userId, page = 1, limit = 10) {
    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error
    return { data, count }
  },

  async getUserBadges(userId) {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)

    if (error) throw error
    return data?.map(ub => ({
      ...ub.badges,
      awarded_at: ub.awarded_at,
    })) || []
  },
}
```

### Task 3.5: Set Up Storage Bucket

In Supabase Dashboard > Storage:
1. Create bucket named `avatars`
2. Make it public
3. Run these policies:

```sql
-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Deliverables for Week 3
- [ ] ProfilePage working
- [ ] ProfileEditForm working
- [ ] AvatarUpload working
- [ ] Storage bucket configured
- [ ] Users can view any profile
- [ ] Users can edit own profile
- [ ] Avatar upload works
- [ ] User posts show on profile

---

## Week 4: Admin User Management

### Task 4.1: Add Admin RLS Policy

```sql
-- Admin can update any profile (for blocking)
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Search users function
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  is_blocked BOOLEAN,
  is_admin BOOLEAN,
  reputation INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.email,
    p.first_name,
    p.last_name,
    p.is_blocked,
    p.is_admin,
    p.reputation,
    p.created_at
  FROM profiles p
  WHERE
    p.username ILIKE '%' || search_term || '%' OR
    p.email ILIKE '%' || search_term || '%' OR
    p.first_name ILIKE '%' || search_term || '%' OR
    p.last_name ILIKE '%' || search_term || '%'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

### Task 4.2: Create Admin Service

```javascript
// src/services/adminService.js
import { supabase } from '@/lib/supabase'

export const adminService = {
  async searchUsers(searchTerm) {
    const { data, error } = await supabase
      .rpc('search_users', { search_term: searchTerm })

    if (error) throw error
    return data
  },

  async getAllUsers(page = 1, limit = 20) {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error
    return { data, count }
  },

  async blockUser(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_blocked: true })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async unblockUser(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_blocked: false })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
```

### Task 4.3: Create User Management Page

```javascript
// src/pages/admin/UserManagement.jsx
import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout'
import { Card, Input, Button, Avatar, LoadingSpinner, Pagination } from '@/components/common'
import { adminService } from '@/services/adminService'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'

export function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const debouncedSearch = useDebounce(searchTerm, 300)

  useEffect(() => {
    loadUsers()
  }, [debouncedSearch, page])

  const loadUsers = async () => {
    setLoading(true)
    try {
      if (debouncedSearch) {
        const data = await adminService.searchUsers(debouncedSearch)
        setUsers(data)
        setTotalPages(1)
      } else {
        const { data, count } = await adminService.getAllUsers(page)
        setUsers(data)
        setTotalPages(Math.ceil(count / 20))
      }
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (userId) => {
    if (!confirm('Are you sure you want to block this user?')) return

    try {
      await adminService.blockUser(userId)
      await loadUsers()
    } catch (err) {
      alert('Error blocking user: ' + err.message)
    }
  }

  const handleUnblock = async (userId) => {
    try {
      await adminService.unblockUser(userId)
      await loadUsers()
    } catch (err) {
      alert('Error unblocking user: ' + err.message)
    }
  }

  return (
    <Layout>
      <div className="admin-page">
        <h1>User Management</h1>

        <Card>
          <Card.Body>
            <Input
              placeholder="Search users by username, email, or name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="search-input"
            />
          </Card.Body>
        </Card>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="user-list">
              {users.map(user => (
                <Card key={user.id} className="user-card">
                  <Card.Body>
                    <div className="user-row">
                      <Avatar
                        src={user.avatar_url}
                        alt={user.username}
                        size="medium"
                      />

                      <div className="user-details">
                        <h3>{user.username}</h3>
                        <p>{user.email}</p>
                        <p>{user.first_name} {user.last_name}</p>
                        <small>Joined {formatDate(user.created_at)}</small>
                      </div>

                      <div className="user-badges">
                        {user.is_admin && (
                          <span className="badge badge-admin">Admin</span>
                        )}
                        {user.is_blocked && (
                          <span className="badge badge-blocked">Blocked</span>
                        )}
                        <span className="reputation">
                          Rep: {user.reputation}
                        </span>
                      </div>

                      <div className="user-actions">
                        {!user.is_admin && (
                          user.is_blocked ? (
                            <Button
                              variant="secondary"
                              onClick={() => handleUnblock(user.id)}
                            >
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              onClick={() => handleBlock(user.id)}
                            >
                              Block
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {!searchTerm && totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
```

### Task 4.4: Add Admin Routes

```javascript
// Update src/routes.jsx
import { UserManagement } from '@/pages/admin/UserManagement'

// Add inside Routes:
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requireAdmin>
      <UserManagement />
    </ProtectedRoute>
  }
/>
```

### Task 4.5: Write Unit Tests

```javascript
// tests/services/authService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('authService', () => {
  describe('signIn', () => {
    it('should sign in with valid credentials', async () => {
      // Test implementation
    })

    it('should throw error for blocked users', async () => {
      // Test implementation
    })
  })

  describe('signUp', () => {
    it('should create new user', async () => {
      // Test implementation
    })

    it('should throw error for duplicate username', async () => {
      // Test implementation
    })
  })
})
```

### Deliverables for Week 4
- [ ] Admin RLS policy added
- [ ] search_users function created
- [ ] adminService.js complete
- [ ] UserManagement page working
- [ ] Admin can search users
- [ ] Admin can block/unblock users
- [ ] Unit tests written
- [ ] All auth features tested

---

## CSS for Auth Pages

```css
/* Auth pages */
.auth-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-card h1 {
  margin-bottom: var(--space-xs);
}

.auth-card p {
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.full-width {
  width: 100%;
}

/* Profile page */
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-lg);
}

.profile-header-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
}

.profile-info h1 {
  margin-bottom: var(--space-xs);
}

.profile-name {
  color: var(--text-secondary);
}

.profile-stats {
  display: flex;
  gap: var(--space-lg);
  margin-left: auto;
}

/* Admin pages */
.admin-page {
  padding: var(--space-lg);
}

.user-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.user-details {
  flex: 1;
}

.user-badges {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-admin {
  background: var(--color-primary);
  color: white;
}

.badge-blocked {
  background: var(--color-danger);
  color: white;
}
```

---

## Checklist Summary

### Week 2
- [ ] profiles table
- [ ] RLS policies
- [ ] Auto-profile trigger
- [ ] authService.js
- [ ] userService.js (basic)
- [ ] AuthContext.jsx
- [ ] ProtectedRoute.jsx
- [ ] LoginPage.jsx
- [ ] RegisterPage.jsx

### Week 3
- [ ] ProfilePage.jsx
- [ ] ProfileEditForm.jsx
- [ ] AvatarUpload.jsx
- [ ] Storage bucket
- [ ] Avatar upload working

### Week 4
- [ ] Admin RLS policy
- [ ] search_users function
- [ ] adminService.js
- [ ] UserManagement.jsx
- [ ] Unit tests
- [ ] Integration complete
