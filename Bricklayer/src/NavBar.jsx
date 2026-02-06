import { Link } from 'react-router-dom';

export default function NavBar({ user, onLogout }) {
    return (
        <nav>
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
                    <button onClick={onLogout}>Logout</button>
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