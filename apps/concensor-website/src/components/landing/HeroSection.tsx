import BackgroundImage from '../common/BackgroundImage';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <BackgroundImage className="hero-section-wrapper">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            The most<br />
            objective place to<br />
            discuss politics
          </h1>
          <p className="hero-subtitle">Share your thoughts now!</p>
        </div>
      </section>
    </BackgroundImage>
  );
};

export default HeroSection;

