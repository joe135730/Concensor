'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../../assets/Logo.svg';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get sidebar context (only available on /home page)
  const isHomePage = pathname === '/home';
  let sidebarContext = null;
  if (isHomePage) {
    try {
      sidebarContext = useSidebar();
    } catch (e) {
      // SidebarContext not available (shouldn't happen, but handle gracefully)
    }
  }

  // List of authenticated routes (routes that require login)
  // If we're on these routes, assume user is authenticated during loading
  const authenticatedRoutes = ['/home', '/profile'];
  const isAuthenticatedRoute = authenticatedRoutes.some(route => pathname?.startsWith(route));

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

  // While loading, show appropriate header based on route
  // If on authenticated route, show authenticated layout (prevents glitch on refresh)
  // If on public route, show public layout
  if (loading) {
    // If we're on an authenticated route, show authenticated header layout
    // This prevents the glitch when refreshing /home page
    if (isAuthenticatedRoute) {
      return (
        <header className="header">
          <div className="header-container">
            <div className="header-left">
              <Link href="/home" className="header-logo">
                <img src={Logo} alt="Concensor" className="logo-image" />
              </Link>
            </div>
            <nav className="header-nav">
              <span className="user-greeting">Hi! ...</span>
            </nav>
            <div className="header-right">
              <div className="profile-picture-button" style={{ opacity: 0.5 }}>
                <div className="profile-picture">
                  <span className="profile-picture-initial">...</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      );
    }
    
    // Otherwise, show public header layout
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
          {/* Hamburger Menu - Only show on /home page */}
          {isHomePage && sidebarContext && (
            <button
              className="header-hamburger-button"
              onClick={sidebarContext.toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarContext.sidebarOpen}
            >
              <span className="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          )}
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
