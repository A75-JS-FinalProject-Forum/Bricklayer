import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function CategoryPage() {
  const { slug } = useParams()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          created_at,
          categories!inner(slug)
        `)
        .eq('categories.slug', slug)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (!error) setPosts(data)
    }

    fetchPosts()
  }, [slug])

  return (
    <div className="category-page">
      <h2>{slug}</h2>
      {posts.map(post => (
        <div key={post.id}>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </div>
      ))}
    </div>
  )
}
