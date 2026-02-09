function Categories() {
  const categories = [
    'MOCs',
    'Official Sets',
    'Techniques',
    'Dioramas',
    'Ideas',
    'Parts'
  ];

  return (
    <section>
      <h2>Categories</h2>
      <ul>
        {categories.map(c => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </section>
  );
}

export default Categories;
