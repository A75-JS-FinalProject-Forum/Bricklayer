import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result?.error) {
        if (result.error.message === 'Email not confirmed') {
          throw new Error('Please confirm your email');
        }
        throw result.error;
      }
      
      navigate('/'); 
    } catch (err) {
      const ErrMsg = err.message === 'Invalid login credentials' 
        ? 'Wrong email or password ' 
        : err.message;
        
      setError(ErrMsg);
      console.error("Details on input data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form">
      <h2>Enter</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Login</button>
      </form>
      
      <p>Don't have a profile? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  );
}