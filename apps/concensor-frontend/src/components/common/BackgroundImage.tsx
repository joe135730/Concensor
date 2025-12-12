import HeroSectionImage from '../../assets/LandingPage/HeroSectionImage.svg';
import './BackgroundImage.css';

interface BackgroundImageProps {
  children: React.ReactNode;
  className?: string;
}

const BackgroundImage = ({ children, className = '' }: BackgroundImageProps) => {
  return (
    <div className={`background-image-container ${className}`}>
      <div className="background-image-wrapper">
        <img src={HeroSectionImage} alt="" className="background-image" />
        <div className="background-overlay"></div>
      </div>
      <div className="background-content">
        {children}
      </div>
    </div>
  );
};

export default BackgroundImage;

