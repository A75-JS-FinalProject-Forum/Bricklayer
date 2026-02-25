import { Link } from 'react-router-dom';
import { useAuth } from './context/useAuth';

export default function NavBar() {
    const {user, logout} = useAuth()
    
    return (
        <nav className="navbar">
            <strong>The BrickLayer</strong>
            <span> | </span>
                <Link to="/">Feed</Link>
            <span> | </span>

            {user ? (
                
                <>
                    <Link to="/create">Create Post</Link>
                    <span> | </span>
                    <Link to="/profile">Profile</Link>
                    <span> | </span>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <>
                    <Link to="/login">Login</Link>
                    <span> | </span>
                    <Link to="/register">Register</Link>
                </>
            )}
        </nav>
    );
};