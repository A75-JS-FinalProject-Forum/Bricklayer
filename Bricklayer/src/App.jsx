import { useState } from 'react'
import NavBar from './NavBar';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
function App() {
  const [user, setUser] = useState(null);

  const Register = ({ onLogin }) => (
    <div>
      <h2>Register Page</h2>
      <button onClick={() => onLogin('new@user.com')}>Register</button>
    </div>
  );

  const Feed = () => (
    <div>
      <h2>Feed</h2>
      <p>Welcome to the forum.</p>
    </div>
  ); 
  
  const CreatePost = () => (
    <div>
      <h2>Create a New Post</h2>
      <p>This page is protected.</p>
    </div>
  ); 
  
  const Login = ({ onLogin }) => (
    <div>
      <h2>Login Page</h2>
      <button onClick={() => onLogin('test@user.com')}>Simulate Login</button>
    </div>
  ); 
  
  const Profile = ({ email }) => (
    <div>
      <h2>User Profile</h2>
      <p>Logged in as: {email}</p>
    </div>
  );

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={() => setUser(null)} />

      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={setUser} />} />
        <Route path="/create" element={user ? <CreatePost /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
