import './FeaturesSection.css';

const FeaturesSection = () => {
  return (
    <section className="features-section">
      <div className="features-container">
        <h2 className="features-title">Features</h2>
        <p className="features-subtitle">Why you need to choose us?</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-image-placeholder debatable">
              {/* Image placeholder - will be replaced with actual image */}
              <div className="feature-icon">💬</div>
            </div>
            <h3 className="feature-label">Debatable</h3>
          </div>
          <div className="feature-card">
            <div className="feature-image-placeholder fair">
              {/* Image placeholder - will be replaced with actual image */}
              <div className="feature-icon">⚖️</div>
            </div>
            <h3 className="feature-label">Fair</h3>
          </div>
          <div className="feature-card">
            <div className="feature-image-placeholder objective">
              {/* Image placeholder - will be replaced with actual image */}
              <div className="feature-icon">📊</div>
            </div>
            <h3 className="feature-label">Objective</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

