import { useState } from 'react'
import NavBar from './NavBar'
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { AuthProvider } from './context/AuthContext'

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

const Profile = ({ email }) => (
  <div>
    <h2>User Profile</h2>
    <p>Logged in as: {email}</p>
  </div>
);

function App() {
  const [user, setUser] = useState(null);

  return (
    <AuthProvider>
        <BrowserRouter>
        <NavBar user={user} onLogout={() => setUser(null)} />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage onLogin={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage onLogin={setUser} />} />
          <Route path="/create" element={user ? <CreatePost /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
