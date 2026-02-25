import { Link } from 'react-router-dom';
import { useAuth } from './context/useAuth';

export default function NavBar() {
    const {user, logout} = useAuth()

    return (
        <nav className="navbar">
            <strong>The BrickLayer</strong>
            <div className="navbar-links">
                <Link to="/">Feed</Link>
                {user && <Link to="/create">Create Post</Link>}
                {user && <Link to="/profile">Profile</Link>}
            </div>
            <div className="navbar-auth">
                {user ? (
                    <button onClick={logout}>Logout</button>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
