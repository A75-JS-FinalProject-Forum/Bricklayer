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
import ProfilePage from './pages/ProfilePage'
import UserManagement from './pages/admin/UserManagement'

function AppRoutes() {
  const { user, loading } = useAuth(); 

  if (loading) {
    return <div>Зареждане...</div>;
  }

  return (
    <>
      <NavBar />
      <main className="main-content">
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
          element={user ? <ProfilePage /> : <Navigate to="/login" />} 
        />
        
        <Route
          path="/admin/users" 
          element={<UserManagement />}
        />

        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/tags/:name" element={<TagPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </main>
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
