'use client';

/**
 * ProfileSidebar Component
 * 
 * Sidebar for profile-related pages.
 * Navigation items:
 * - Profile
 * - Ideology
 * - Dashboard
 * - Setting
 */

import { useRouter, usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import './Sidebar.css'; // Reuse the same CSS

export default function ProfileSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, isMobile, isResizing } = useSidebar();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const sidebarClass = `sidebar ${sidebarOpen ? 'open' : ''} ${isResizing ? 'resizing' : ''}`;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <nav className={sidebarClass}>
        <div className="sidebar-nav">
          {/* Profile */}
          <button
            className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavigation('/profile')}
          >
            Profile
          </button>

          {/* Ideology */}
          <button
            className={`sidebar-link ${isActive('/ideology') ? 'active' : ''}`}
            onClick={() => handleNavigation('/ideology')}
          >
            Ideology
          </button>

          {/* Dashboard */}
          <button
            className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => handleNavigation('/dashboard')}
          >
            Dashboard
          </button>

          {/* Setting */}
          <button
            className={`sidebar-link ${isActive('/setting') ? 'active' : ''}`}
            onClick={() => handleNavigation('/setting')}
          >
            Setting
          </button>
        </div>
      </nav>
    </>
  );
}

