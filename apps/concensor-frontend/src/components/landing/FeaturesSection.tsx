import DebatableImage from '../../assets/LandingPage/DebatableImage.svg';
import FairImage from '../../assets/LandingPage/FairImage.svg';
import ObjectiveImage from '../../assets/LandingPage/ObjectiveImage.svg';
import './FeaturesSection.css';

const FeaturesSection = () => {
  return (
    <section className="features-section">
      <div className="features-container">
        <h2 className="features-title">Features</h2>
        <p className="features-subtitle">Why you need to choose us?</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-image-container">
              <img src={DebatableImage} alt="Debatable" className="feature-image" />
            </div>
            <h3 className="feature-label">Debatable</h3>
          </div>
          <div className="feature-card">
            <div className="feature-image-container">
              <img src={FairImage} alt="Fair" className="feature-image" />
            </div>
            <h3 className="feature-label">Fair</h3>
          </div>
          <div className="feature-card">
            <div className="feature-image-container">
              <img src={ObjectiveImage} alt="Objective" className="feature-image" />
            </div>
            <h3 className="feature-label">Objective</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

