import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
    return (
        <div className="post-card">
            <h3>
                <Link to={`/posts/${post.id}`}>
                    {post.title}
                </Link>
            </h3>
            <p>
                by {post.profiles?.username || 'Unknown author'}
                {post.categories && (
                    <> in {post.categories.name}</>
                )}
            </p>
            <div>
                ⭐ {post.score} | 💬 {post.comments_count}
            </div>
        </div>
    );
}
