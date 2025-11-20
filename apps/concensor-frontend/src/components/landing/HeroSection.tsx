import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <h1 className="hero-title">The most objective place to discuss politics.</h1>
        <p className="hero-subtitle">Share your thoughts now!</p>
      </div>
    </section>
  );
};

export default HeroSection;

