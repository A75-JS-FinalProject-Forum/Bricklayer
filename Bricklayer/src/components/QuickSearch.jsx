import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { searchService } from '../services/searchService';


export default function QuickSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState({ posts: [], users: [] });
    const [popularPosts, setPopularPosts] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const loadPopular = async () => {
            try {
                const data = await searchService.getPopularPosts(5);
                setPopularPosts(data || []);
            } catch (err) {
                console.log("Error loading popular posts", err);
            }
        };

        loadPopular();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            const timeoutId = setTimeout(async () => {
                try {
                    const data = await searchService.globalSearch(searchQuery);
                    setResults(data);
                } catch (err) {
                    console.log("Error when searching:", err);
                }
            }, 300);
            return () => clearTimeout(timeoutId);
        } else {
            setResults({ posts: [], users: [] });
        }
    }, [searchQuery]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsDropdownOpen(false);
        }
    };

    return (
        <div ref={dropdownRef} className="quick-search-container">
            <form onSubmit={handleSearchSubmit}>
                <input 
                    type="text" 
                    placeholder="Searching..." 
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            {isDropdownOpen && (
                <div className="search-dropdown">
                    {searchQuery.length >= 2 ? (
                        <>
                            {results.posts.length > 0 && (
                                <div className="search-section">
                                    <p>Publications</p>
                                    {results.posts.map(p => (
                                        <div 
                                            key={p.id} 
                                            className="search-item"
                                            onClick={() => { navigate(`/posts/${p.id}`); setIsDropdownOpen(false); }}
                                        >
                                            {p.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {results.users.length > 0 && (
                                <div className="search-section">
                                    <p>Users</p>
                                    {results.users.map(u => (
                                        <div 
                                            key={u.username} 
                                            className="search-item"
                                            onClick={() => { navigate(`/profile/${u.username}`); setIsDropdownOpen(false); }}
                                        >
                                            @{u.username}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {results.posts.length === 0 && results.users.length === 0 && (
                                <div className="no-results">No matches.</div>
                            )}
                        </>
                    ) : (
                        <div className="search-section">
                            <p>Popular bricks</p>
                            {popularPosts.length > 0 ? (
                                popularPosts.map(p => (
                                    <div 
                                        key={p.id} 
                                        className="search-item"
                                        onClick={() => { navigate(`/posts/${p.id}`); setIsDropdownOpen(false); }}
                                    >
                                    {p.title}
                                    </div>
                                ))
                            ) : (
                                <div className="no-results">No popular content.</div>
                            )}
                        </div>
                    )}
                    <hr />
                    <div className="search-footer">
                        <Link 
                            to={`/search?q=${searchQuery}`} 
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            Find everything about "{searchQuery}"
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}