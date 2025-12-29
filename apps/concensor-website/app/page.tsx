import MainLayout from '@/layouts/MainLayout';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import InfoSection from '@/components/landing/InfoSection';
import './page.css';

export default function HomePage() {
  return (
    <MainLayout>
    <div className="home-page">
      <HeroSection />
      <FeaturesSection />
      <InfoSection />
    </div>
    </MainLayout>
  );
}

