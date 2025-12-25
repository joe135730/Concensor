import Link from 'next/link';
import Logo from '../../assets/Logo.svg';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link href="/" className="header-logo">
            <img src={Logo} alt="Concensor" className="logo-image" />
          </Link>
        </div>
        <nav className="header-nav">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/contact" className="nav-link">Contact</Link>
        </nav>
        <div className="header-right">
          <Link href="/login" className="login-button">Login</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
