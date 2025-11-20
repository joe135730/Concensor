import './InfoSection.css';

const InfoSection = () => {
  return (
    <section className="info-section">
      <div className="info-container">
        {/* What Section */}
        <div className="info-card">
          <div className="info-header">
            <h2 className="info-title">What?</h2>
            <div className="info-image-placeholder what-image">
              <div className="info-icon">💭</div>
            </div>
          </div>
          <div className="info-content">
            <p className="info-text">
              We provide an <strong>objective, fair, and debatable</strong> platform for people to discuss a wide range of political topics. You can <strong>share your thoughts</strong> freely without restrictions, and you can also see <strong>how much support</strong> other users express for each issue.
            </p>
          </div>
        </div>

        {/* Why Section */}
        <div className="info-card">
          <div className="info-header">
            <div className="info-image-placeholder why-image">
              <div className="info-icon">👥</div>
            </div>
            <h2 className="info-title">Why?</h2>
          </div>
          <div className="info-content">
            <p className="info-text">
              Meaningful political conversations often lack <strong>neutrality and transparency</strong>. We want to create a space where people can express opinions without pressure, and understand public sentiment through visible support levels.
            </p>
          </div>
        </div>

        {/* How Section */}
        <div className="info-card">
          <div className="info-header">
            <h2 className="info-title">How?</h2>
            <div className="info-image-placeholder how-image">
              <div className="info-icon">📝</div>
            </div>
          </div>
          <div className="info-content">
            <div className="how-features">
              <div className="how-feature">
                <div className="how-icon">📄</div>
                <p className="how-text"><strong>Create Posts</strong>: Share your perspectives and start meaningful political conversations.</p>
              </div>
              <div className="how-feature">
                <div className="how-icon">💬</div>
                <p className="how-text"><strong>Leave Comments</strong>: Join the discussion and exchange ideas with other users.</p>
              </div>
              <div className="how-feature">
                <div className="how-icon">🗳️</div>
                <p className="how-text"><strong>Vote to show support</strong>: Express your stance and see where the community stands.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;

