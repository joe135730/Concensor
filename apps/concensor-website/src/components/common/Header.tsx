'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Logo from '../../assets/Logo.svg';
import { useAuth } from '@/contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle logout
  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  // Don't render login button while checking auth status
  // This prevents flash of login button when user is actually logged in
  if (loading) {
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
            {/* Show nothing while loading */}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link href={isAuthenticated ? "/home" : "/"} className="header-logo">
            <img src={Logo} alt="Concensor" className="logo-image" />
          </Link>
        </div>
        <nav className="header-nav">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">Hi! {user?.username}</span>
            </>
          ) : (
            <>
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/about" className="nav-link">About</Link>
              <Link href="/contact" className="nav-link">Contact</Link>
            </>
          )}
        </nav>
        <div className="header-right">
          {isAuthenticated ? (
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button
                className="profile-picture-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                <div className="profile-picture">
                  {/* Show user profile picture if available, otherwise show initial */}
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={`${user.username}'s profile`}
                      className="profile-picture-img"
                    />
                  ) : (
                    <span className="profile-picture-initial">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </button>
              
              {dropdownOpen && (
                <div className="profile-dropdown">
                  <Link
                    href="/profile"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="login-button">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
