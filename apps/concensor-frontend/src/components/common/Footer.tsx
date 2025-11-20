import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.svg';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <Link to="/" className="footer-logo">
            <img src={Logo} alt="Concensor" className="footer-logo-image" />
          </Link>
        </div>
        <div className="footer-right">
          <div className="footer-column">
            <h3 className="footer-heading">COMPANY</h3>
            <ul className="footer-links">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3 className="footer-heading">PRODUCT</h3>
            <ul className="footer-links">
              {/* Empty for now */}
            </ul>
          </div>
          <div className="footer-column">
            <h3 className="footer-heading">POLICIES</h3>
            <ul className="footer-links">
              <li><Link to="/terms">Terms and Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
