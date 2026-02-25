import FeaturedPosts from '../components/FeaturedPosts';
import MostDiscussed from '../components/MostDiscussed';
import LatestPosts from '../components/LatestPosts';
import Categories from '../components/Categories';
import CommunitySpotlight from '../components/CommunitySpotlight';

import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      <h1>Lego Forum</h1>
      <button
        className="btn btn-primary"
        style={{ marginBottom: 20 }}
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
