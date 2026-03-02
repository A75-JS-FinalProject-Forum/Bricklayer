import { Link } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { useTheme } from './context/useTheme';
import { useEffect, useState } from 'react';
import { userService } from './services/userService';
import QuickSearch from './components/QuickSearch';
import BrickLogo from './components/BrickLogo';

export default function NavBar() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
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
                console.error("Error checking permissions:", error);
                setIsAdmin(false);
            }
        };

        checkAdminStatus();
    }, [user]);

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <BrickLogo size={28} />
                <span>BrickLayer</span>
            </Link>
            <div className="navbar-links">
                <Link to="/">Feed</Link>
                {user && <Link to="/create">Create Post</Link>}
                {user && <Link to="/profile">Profile</Link>}

                {isAdmin && (
                    <Link to="/admin/users" className="admin-link">
                        Admin Panel
                    </Link>
                )}
                <QuickSearch />
            </div>
            <div className="navbar-auth">
                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    )}
                </button>
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