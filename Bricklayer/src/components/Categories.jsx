import { useState, useEffect } from "react";
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .order('name', { ascending: true });

      if (error) {
        setError(error.message)
      } else {
        setCategories(data)
      }

      setLoading(false)
    }

    fetchCategories()
  }, []);

  if (loading) {
    return <div>Loading categories...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="categories">
      <h2>Categories</h2>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <Link to={`/category/${category.slug}`}>
              <strong>{category.name}</strong>
            </Link>
            {category.description && (
              <p>{category.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Categories;
