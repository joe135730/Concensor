'use client';

/**
 * Main Category Page
 * 
 * Route: /category/[mainCategory]
 * Shows posts filtered by main category.
 * Accessible to both logged in and logged out users.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { api } from '@/lib/api';
import { Post, Category } from '@/types';
import PostList from '@/components/posts/PostList';
import Sidebar from '@/components/common/Sidebar';
import './page.css';

export default function MainCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mainCategorySlug = params?.mainCategory as string;

  // Fetch category and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch category by slug
        const categoryData = await api.getCategoryBySlug(mainCategorySlug);
        setCategory(categoryData);

        // Track category view (for LRU)
        // Always update localStorage (for browser persistence, like Reddit)
        // Also update backend when authenticated (for account-specific sync)
        try {
          // Always update localStorage (works for both logged-in and logged-out users)
          const { addRecentCategory } = await import('@/lib/recentCategories');
          addRecentCategory({
            id: categoryData.id,
            name: categoryData.name,
            slug: categoryData.slug,
            parentId: categoryData.parentId || null,
            parentSlug: null, // Main category has no parent
          });
          // Event is already dispatched by addRecentCategory
        } catch (err) {
          // Ignore localStorage errors
        }

        // Also update backend if authenticated (for account-specific sync)
        if (isAuthenticated) {
          try {
            await fetch(`/api/categories/${mainCategorySlug}/view`, {
              method: 'POST',
            });
            // Dispatch event to notify sidebar to refresh (for immediate update)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('categoryViewed'));
            }
          } catch (err) {
            // Ignore backend tracking errors
          }
        }

        // Fetch posts for this main category
        const postsData = await api.getPosts({
          mainCategory: mainCategorySlug,
          popular: true, // Default to popular within category
        });
        
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        } else if (postsData.posts) {
          setPosts(postsData.posts);
        } else {
          setPosts([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load category or posts');
      } finally {
        setLoading(false);
      }
    };

    if (mainCategorySlug) {
      fetchData();
    }
  }, [mainCategorySlug, isAuthenticated]);

  // Use appropriate layout based on authentication status
  const Layout = isAuthenticated ? AuthLayout : MainLayout;

  if (authLoading) {
    return null;
  }

  if (!category && !loading) {
    return (
      <Layout>
        <div className="category-page">
          <div className="category-page-content">
            <Sidebar />
            <main className={`category-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
              <div className="category-error">Category not found</div>
            </main>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="category-page">
        <div className="category-page-content">
          <Sidebar />
          <main className={`category-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <PostList 
              posts={posts} 
              loading={loading} 
              error={error}
              title={category?.name || 'Category'}
            />
          </main>
        </div>
      </div>
    </Layout>
  );
}

