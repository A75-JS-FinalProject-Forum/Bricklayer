import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService } from '../services/searchService';


export default function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');

    const [results, setResults] = useState({ posts: [], users: [], tags: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const performSearch = async () => {
            if (!query) return;
            try {
                setLoading(true);
                const data = await searchService.globalSearch(query);
                setResults(data);
            } catch (err) {
                setError("Error when loading results.");
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query]);

    if (!query) return <div>Enter query for search.</div>;
    if (loading) return <div>Search for "{query}"...</div>;
    if (error) return <div>{error}</div>;

    const hasResults = results.posts.length > 0 || results.users.length > 0 || results.tags.length > 0;

    return (
        <div>
            <h1>Results for: "{query}"</h1>

            {!hasResults && <p>None search found.</p>}

            {results.tags.length > 0 && (
                <section>
                    <h3>Tags</h3>
                    <div>
                        {results.tags.map(tag => (
                            <Link 
                                key={tag.name} 
                                to={`/tags/${tag.name}`}
                                style={{ marginRight: '10px' }}
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {results.users.length > 0 && (
                <section>
                    <h3>Users</h3>
                    <div>
                        {results.users.map(u => (
                            <div key={u.username}>
                                <Link to={`/profile/${u.username}`}>
                                    {u.username}
                                </Link>
                                <span> (Reputations: {u.reputation || 0})</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {results.posts.length > 0 && (
                <section>
                    <h3>Publications</h3>
                    <div>
                        {results.posts.map(post => (
                            <div key={post.id} style={{ marginBottom: '15px' }}>
                                <h4>
                                    <Link to={`/posts/${post.id}`}>
                                        {post.title}
                                    </Link>
                                </h4>
                                <div>
                                    Author: <Link to={`/profile/${post.profiles?.username}`}>{post.profiles?.username}</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}