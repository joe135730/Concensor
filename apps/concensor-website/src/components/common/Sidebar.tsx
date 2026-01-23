'use client';

/**
 * Sidebar Component
 * 
 * Reusable sidebar for navigation.
 * Structure:
 * - Home (personalized recommendations)
 * - All Posts (shows all main categories)
 * - Popular (popular posts)
 * - Recent (LRU - recently viewed categories)
 * - Saved (saved posts) - authenticated only
 * - Messages (messaging) - authenticated only
 * - Create Post button (Login to Post for non-authenticated)
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Category } from '@/types';
import { getRecentCategories, addRecentCategory, getCategoryPath as getRecentCategoryPath, type RecentCategory as LocalRecentCategory } from '@/lib/recentCategories';
import './Sidebar.css';

interface RecentCategory extends Category {
  lastViewedAt: string;
  viewCount: number;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, isMobile, isResizing } = useSidebar();
  const { isAuthenticated, user } = useAuth();
  const [recentCategories, setRecentCategories] = useState<RecentCategory[]>([]);
  const [localRecentCategories, setLocalRecentCategories] = useState<LocalRecentCategory[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Fetch recent categories (LRU)
  // Logic: 
  // - When logged in: Show account-specific recent from backend (Account A sees A's recent, Account B sees B's recent)
  // - When logged out: Show localStorage recent (browser-specific, persists across sessions)
  // - Always update both: localStorage (for logout persistence) and backend (for account sync)
  // - On login: Show account recent if available, otherwise fallback to localStorage
  const loadRecentCategories = useCallback(async () => {
    setRecentLoading(true);
    
    // Always load from localStorage (for fallback and logout persistence)
    const localRecent = getRecentCategories();
    setLocalRecentCategories(localRecent);
    
    if (isAuthenticated && user) {
      // Authenticated: Fetch account-specific recent from backend
      try {
        const backendRecent = await api.getRecentCategories();
        setRecentCategories(backendRecent || []);
        
        // If account has no recent but localStorage has recent, use localStorage as fallback
        // This ensures consistency: user doesn't see empty recent when logging in
        if (backendRecent.length === 0 && localRecent.length > 0) {
          // Account has no recent, but localStorage does - use localStorage
          // This matches Reddit: if you login with new account, you still see browser recent
          setRecentCategories([]); // Will use localRecentCategories for display
        } else {
          // Account has recent - use it (account-specific)
          setRecentCategories(backendRecent);
        }
      } catch (err) {
        console.error('Failed to load recent categories from backend:', err);
        // On error, fallback to localStorage
        setRecentCategories([]);
      }
    } else {
      // Not authenticated: Use localStorage only
      setRecentCategories([]);
    }
    
    setRecentLoading(false);
  }, [isAuthenticated, user]);

  // Initial load and reload when pathname changes
  useEffect(() => {
    loadRecentCategories();
  }, [loadRecentCategories, pathname]); // Reload when pathname changes

  // Listen for localStorage changes (for all users - like Reddit, localStorage is always used)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if the change is for recent categories
      if (e.key === 'concensor_recent_categories' || e.key === null) {
        // Reload recent categories from localStorage
        const localRecent = getRecentCategories();
        setLocalRecentCategories(localRecent);
      }
    };

    // Listen for storage events (triggered by other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event (triggered by same tab)
    const handleCustomStorageChange = () => {
      const localRecent = getRecentCategories();
      setLocalRecentCategories(localRecent);
    };
    window.addEventListener('recentCategoriesUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('recentCategoriesUpdated', handleCustomStorageChange);
    };
  }, []); // Always listen, regardless of authentication status

  // For authenticated users: listen for categoryViewed event to reload immediately
  useEffect(() => {
    if (isAuthenticated) {
      const handleCategoryViewed = () => {
        // Reload recent categories when a category is viewed
        loadRecentCategories();
      };

      window.addEventListener('categoryViewed', handleCategoryViewed);

      return () => {
        window.removeEventListener('categoryViewed', handleCategoryViewed);
      };
    }
  }, [isAuthenticated, loadRecentCategories]);

  const handleNavigation = useCallback((path: string) => {
    router.push(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router, isMobile, setSidebarOpen]);

  const handleCreatePost = useCallback(() => {
    if (isAuthenticated) {
      router.push('/create-post');
    } else {
      router.push('/login');
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router, isMobile, setSidebarOpen, isAuthenticated]);

  const handleSaved = useCallback(() => {
    // TODO: Implement saved posts page
    router.push('/saved');
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router, isMobile, setSidebarOpen]);

  const handleMessages = useCallback(() => {
    router.push('/messages');
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router, isMobile, setSidebarOpen]);

  const handleLogin = useCallback(() => {
    router.push('/login');
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router, isMobile, setSidebarOpen]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    if (path === '/all') {
      return pathname === '/all';
    }
    if (path === '/popular') {
      return pathname === '/popular';
    }
    if (path === '/saved') {
      return pathname === '/saved';
    }
    if (path === '/messages') {
      return pathname === '/messages';
    }
    if (path.startsWith('/category/')) {
      return pathname?.startsWith(path);
    }
    return false;
  };

  const getCategoryPath = (category: Category | RecentCategory) => {
    // If category has a parent, it's a sub category - route to sub category page
    if (category.parentId && 'parent' in category && category.parent && category.parent.slug) {
      return `/category/${category.parent.slug}/${category.slug}`;
    }
    // Main category
    return `/category/${category.slug}`;
  };

  return (
    <>
      {/* Sidebar Overlay (mobile only when sidebar is open) */}
      {sidebarOpen && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${isResizing ? 'resizing' : ''}`}>
        <nav className="sidebar-nav">
          {/* Section 1: Main Navigation */}
          <button
            className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            Home
          </button>

          <button
            className={`sidebar-link ${isActive('/all') ? 'active' : ''}`}
            onClick={() => handleNavigation('/all')}
          >
            Explore
          </button>

          <button
            className={`sidebar-link ${isActive('/popular') ? 'active' : ''}`}
            onClick={() => handleNavigation('/popular')}
          >
            Popular
          </button>

          {/* Divider */}
          <div className="sidebar-divider"></div>

          {/* Section 2: Recent (LRU) */}
          {/* Show Recent section for both authenticated and non-authenticated users */}
          {/* 
            Display logic:
            - When logged in: Show account recent from backend (account-specific)
              - If account has no recent, fallback to localStorage (for new accounts)
            - When logged out: Show localStorage recent (browser-specific)
          */}
          <>
            <div className="sidebar-section-title">Recent</div>
            {recentLoading ? (
              <div className="sidebar-loading">Loading recent...</div>
            ) : (() => {
              // Determine which recent categories to show
              let categoriesToShow: LocalRecentCategory[] = [];
              
              if (isAuthenticated) {
                // Logged in: Use account recent from backend (account-specific)
                // If account has no recent, fallback to localStorage
                if (recentCategories.length > 0) {
                  // Convert backend recent categories to LocalRecentCategory format
                  categoriesToShow = recentCategories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    parentId: cat.parentId || null,
                    parentSlug: null, // Backend only tracks main categories currently
                    lastViewedAt: cat.lastViewedAt || new Date().toISOString(),
                  }));
                } else if (localRecentCategories.length > 0) {
                  // Account has no recent, fallback to localStorage (like Reddit)
                  categoriesToShow = localRecentCategories;
                }
              } else {
                // Not logged in: Use localStorage (browser-specific)
                categoriesToShow = localRecentCategories;
              }
              
              return categoriesToShow.length > 0 ? (
                categoriesToShow.map((category) => {
                  const categoryPath = getRecentCategoryPath(category);
                  return (
                    <button
                      key={category.id}
                      className={`sidebar-link sidebar-link-recent ${isActive(categoryPath) ? 'active' : ''}`}
                      onClick={() => handleNavigation(categoryPath)}
                    >
                      {category.name}
                    </button>
                  );
                })
              ) : (
                <div className="sidebar-empty">No recent categories</div>
              );
            })()}
          </>

          {/* Section 3: User Actions & Post Button (only for authenticated users) */}
          {isAuthenticated && (
            <>
              <div className="sidebar-divider"></div>
              <button
                className={`sidebar-link ${isActive('/saved') ? 'active' : ''}`}
                onClick={handleSaved}
              >
                Saved
              </button>
              <button
                className={`sidebar-link ${isActive('/messages') ? 'active' : ''}`}
                onClick={handleMessages}
              >
                Messages
              </button>
              {/* Create Post Button in Sidebar */}
              <button
                className="sidebar-post-button"
                onClick={handleCreatePost}
              >
                Post
              </button>
            </>
          )}

          {/* Login to Post Button (only for non-authenticated users) */}
          {!isAuthenticated && (
            <button
              className="sidebar-post-button"
              onClick={handleCreatePost}
            >
              Login to Post
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}

