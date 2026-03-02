import { Link } from 'react-router-dom';
import { useAuth } from './context/useAuth.js';
import { useEffect, useState } from 'react';
import { userService } from './services/userService.js';
import QuickSearch from './components/QuickSearch.jsx';

export default function NavBar() {
    const { user, logout } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false);
                return;
            }
            try {
                const profile = await userService.getProfile(user.id);
                setIsAdmin(profile?.is_admin || false);
            } catch (error) {
                console.error("Error when checking privileges: ", error);
                setIsAdmin(false);
            }
        };

        checkAdminStatus();
    }, [user]);

    return (
        <nav className="navbar">
            <strong>The BrickLayer</strong>
            
            <QuickSearch />

            <div className="navbar-links">
                <Link to="/">Feed</Link>
                {user && <Link to="/create">Create Post</Link>}
                {user && <Link to="/profile">Profile</Link>}

                {isAdmin && (
                    <Link to="/admin/users" className="admin-link">
                        Admin Panel
                    </Link>
                )}
            </div>
            <div className="navbar-auth">
                {user ? (
                    <button onClick={logout} className="logout-btn">Logout</button>
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