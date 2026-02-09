import FeaturedPosts from '../components/FeaturedPosts';
import MostDiscussed from '../components/MostDiscussed';
import LatestPosts from '../components/LatestPosts';
import Categories from '../components/Categories';
import CommunitySpotlight from '../components/CommunitySpotlight';

function HomePage() {
  return (
    <div>
      <h1>Lego Forum</h1>

      <FeaturedPosts />
      <MostDiscussed />
      <LatestPosts />
      <Categories />
      <CommunitySpotlight />
    </div>
  );
}

export default HomePage;
