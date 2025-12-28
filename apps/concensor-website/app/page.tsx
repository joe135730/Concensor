import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import InfoSection from '@/components/landing/InfoSection';
import './page.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <InfoSection />
      <Footer />
    </div>
  );
}

