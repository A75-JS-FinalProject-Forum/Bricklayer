import NavBar from './NavBar'
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CategoryPage from './pages/CategoryPage'
import { AuthProvider } from './context/AuthContext'
import CreatePost from './pages/CreatePost'
import PostDetail from './components/PostDetail'
import TagPage from './pages/TagPage'
import { useAuth } from './context/useAuth'

const Feed = () => (
  <div>
    <h2>Feed</h2>
    <p>Welcome to the forum.</p>
  </div>
);

const Profile = ({ email }) => (
  <div>
    <h2>User Profile</h2>
    <p>Logged in as: {email}</p>
  </div>
);
function AppRoutes() {
  const { user, loading } = useAuth(); 

  if (loading) {
    return <div>Зареждане...</div>;
  }

  return (
    <>
      <NavBar />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" /> : <RegisterPage />} 
        />
        
        <Route 
          path="/create" 
          element={user ? <CreatePost /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/login" />} 
        />
        
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/tags/:name" element={<TagPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
