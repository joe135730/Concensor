import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.svg';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <img src={Logo} alt="Concensor" className="logo-image" />
          </Link>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>
        <div className="header-right">
          <Link to="/login" className="login-button">Login</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
