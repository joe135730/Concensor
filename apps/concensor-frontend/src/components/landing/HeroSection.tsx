import HeroSectionImage from '../../assets/LandingPage/HeroSectionImage.svg';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-background">
        <img src={HeroSectionImage} alt="" className="hero-background-image" />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <h1 className="hero-title">
          The most<br />
          objective place to<br />
          discuss politics
        </h1>
        <p className="hero-subtitle">Share your thoughts now!</p>
      </div>
    </section>
  );
};

export default HeroSection;

