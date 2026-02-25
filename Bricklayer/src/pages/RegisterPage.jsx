import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords doesnt match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be more than 6 characters');
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      navigate('/'); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2>Become a BrickLayer</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label>Username</label>
            <input
              type="text" 
              name="username" 
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label>First name</label>
            <input
              type="text" 
              name="firstName" 
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Third name</label>
            <input
              type="text" 
              name="lastName" 
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email" 
              name="email" 
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password" 
              name="password" 
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Confirm password</label>
            <input
              type="password" 
              name="confirmPassword" 
              required
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating profile...' : 'Create profile'}
          </button>
        </form>

        <div>
          You are already a builder? <Link to="/login">Join here</Link>
        </div>
      </div>
    </div>
  );
}