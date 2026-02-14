import FeaturedPosts from '../components/FeaturedPosts';
import MostDiscussed from '../components/MostDiscussed';
import LatestPosts from '../components/LatestPosts';
import Categories from '../components/Categories';
import CommunitySpotlight from '../components/CommunitySpotlight';

import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Lego Forum</h1>
      <button
        style={{ marginBottom: 20, padding: '8px 16px', fontSize: 16 }}
        onClick={() => navigate('/create')}
      >
        Create Post
      </button>
      <FeaturedPosts />
      <MostDiscussed />
      <LatestPosts />
      <Categories />
      <CommunitySpotlight />
    </div>
  );
}

export default HomePage;
