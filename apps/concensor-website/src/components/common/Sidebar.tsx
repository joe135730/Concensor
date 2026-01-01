'use client';

/**
 * Sidebar Component
 * 
 * Reusable sidebar for navigation.
 * Shows "All Posts", "Popular", main categories, and "Create Post" button (if authenticated).
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Category } from '@/types';
import './Sidebar.css';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, isMobile } = useSidebar();
  const { isAuthenticated } = useAuth();
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch main categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await api.getCategories({ mainOnly: true });
        setMainCategories(Array.isArray(categories) ? categories : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
    if (path.startsWith('/category/')) {
      return pathname?.startsWith(path);
    }
    return false;
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
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {/* All Posts */}
          <button
            className={`sidebar-link ${isActive('/all') ? 'active' : ''}`}
            onClick={() => handleNavigation('/all')}
          >
            All Posts
          </button>

          {/* Popular */}
          <button
            className={`sidebar-link ${isActive('/popular') || isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            Popular
          </button>

          {/* Divider */}
          <div className="sidebar-divider"></div>

          {/* Main Categories */}
          {loading ? (
            <div className="sidebar-loading">Loading categories...</div>
          ) : (
            mainCategories.map((category) => {
              const categoryPath = `/category/${category.slug}`;
              return (
                <button
                  key={category.id}
                  className={`sidebar-link ${isActive(categoryPath) ? 'active' : ''}`}
                  onClick={() => handleNavigation(categoryPath)}
                >
                  {category.name}
                </button>
              );
            })
          )}

          {/* Create Post Button in Sidebar */}
          <button
            className="sidebar-post-button"
            onClick={handleCreatePost}
          >
            {isAuthenticated ? 'Post' : 'Login to Post'}
          </button>
        </nav>
      </aside>
    </>
  );
}

