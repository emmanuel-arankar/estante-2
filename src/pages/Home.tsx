import { Hero } from '../components/home/Hero';
import { FeaturedBooks } from '../components/home/FeaturedBooks';
import { Feed } from '../components/feed/Feed';
import { useAuth } from '../hooks/useAuth';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      <Hero />
      <FeaturedBooks />
      
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Feed da Comunidade
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Acompanhe as últimas discussões, resenhas e descobertas dos leitores
            </p>
          </div>
          <Feed />
        </div>
      </section>
    </div>
  );
};