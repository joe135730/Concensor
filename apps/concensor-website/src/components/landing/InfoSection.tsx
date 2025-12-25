import WhatImage from '../../assets/LandingPage/WhatImage.svg';
import WhyImage from '../../assets/LandingPage/WhyImage.svg';
import CreatePostsIcon from '../../assets/LandingPage/CreatePostsIcon.svg';
import LeaveCommentsIcon from '../../assets/LandingPage/LeaveCommentsIcon.svg';
import VoteIcon from '../../assets/LandingPage/VoteIcon.svg';
import './InfoSection.css';

const InfoSection = () => {
  return (
    <section className="info-section">
      <div className="info-container">
        {/* What Section */}
        <div className="info-card">
          <div className="what-section-wrapper">
            <h2 className="info-title what-title">What?</h2>
            <div className="what-right-content">
              <div className="info-image-container">
                <img src={WhatImage} alt="What" className="info-image" />
              </div>
              <div className="info-content what-content">
                <p className="info-text">
                  We provide an <strong>objective, fair, and debatable</strong> platform for people to discuss a wide range of political topics. You can <strong>share your thoughts</strong> freely without restrictions, and you can also see <strong>how much support</strong> other users express for each issue.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Section */}
        <div className="info-card">
          <div className="why-section-wrapper">
            <div className="why-left-content">
              <div className="info-image-container">
                <img src={WhyImage} alt="Why" className="info-image" />
              </div>
              <div className="info-content why-content">
                <p className="info-text">
                  Meaningful political conversations often lack <strong>neutrality and transparency</strong>. We want to create a space where people can express opinions without pressure, and understand public sentiment through visible support levels.
                </p>
              </div>
            </div>
            <h2 className="info-title why-title">Why?</h2>
          </div>
        </div>

        {/* How Section */}
        <div className="info-card">
          <div className="how-section-wrapper">
            <h2 className="info-title how-title">How?</h2>
            <div className="how-right-content">
              <div className="how-features">
                <div className="how-feature">
                  <img src={CreatePostsIcon} alt="Create Posts" className="how-icon-svg" />
                  <div className="how-feature-content">
                    <p className="how-title-text"><strong>Create Posts</strong></p>
                    <p className="how-text">Share your perspectives and start meaningful political conversations.</p>
                  </div>
                </div>
                <div className="how-feature">
                  <img src={LeaveCommentsIcon} alt="Leave Comments" className="how-icon-svg" />
                  <div className="how-feature-content">
                    <p className="how-title-text"><strong>Leave Comments</strong></p>
                    <p className="how-text">Join the discussion and exchange ideas with other users.</p>
                  </div>
                </div>
                <div className="how-feature">
                  <img src={VoteIcon} alt="Vote" className="how-icon-svg" />
                  <div className="how-feature-content">
                    <p className="how-title-text"><strong>Vote to show support</strong></p>
                    <p className="how-text">Express your stance and see where the community stands.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;

