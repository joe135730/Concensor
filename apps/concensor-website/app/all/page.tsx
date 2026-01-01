'use client';

/**
 * All Posts Page
 * 
 * Route: /all
 * Shows all main categories.
 * Accessible to both logged in and logged out users.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { api } from '@/lib/api';
import { Category } from '@/types';
import Sidebar from '@/components/common/Sidebar';
import './page.css';

export default function AllPostsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all main categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.getCategories({ mainOnly: true });
        setCategories(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Use appropriate layout based on authentication status
  const Layout = isAuthenticated ? AuthLayout : MainLayout;

  if (authLoading) {
    return null;
  }

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/category/${categorySlug}`);
  };

  return (
    <Layout>
      <div className="all-posts-page">
        <div className="all-posts-page-content">
          <Sidebar />
          <main className={`all-posts-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <h1 className="all-posts-title">All Categories</h1>
            
            {loading && <div className="all-posts-loading">Loading categories...</div>}
            {error && <div className="all-posts-error">{error}</div>}
            
            {!loading && !error && categories.length === 0 && (
              <div className="all-posts-empty">No categories found</div>
            )}
            
            {!loading && !error && categories.length > 0 && (
              <div className="categories-grid">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="category-card"
                    onClick={() => handleCategoryClick(category.slug)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h2 className="category-card-title">{category.name}</h2>
                    {category.description && (
                      <p className="category-card-description">{category.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}

