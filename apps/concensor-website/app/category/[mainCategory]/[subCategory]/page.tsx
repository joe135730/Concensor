'use client';

/**
 * Sub Category Page
 * 
 * Route: /category/[mainCategory]/[subCategory]
 * Shows posts filtered by sub category.
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

export default function SubCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [posts, setPosts] = useState<Post[]>([]);
  const [mainCategory, setMainCategory] = useState<Category | null>(null);
  const [subCategory, setSubCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mainCategorySlug = params?.mainCategory as string;
  const subCategorySlug = params?.subCategory as string;

  // Fetch categories and posts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch both categories
        const [mainCatData, subCatData] = await Promise.all([
          api.getCategoryBySlug(mainCategorySlug),
          api.getCategoryBySlug(subCategorySlug),
        ]);

        setMainCategory(mainCatData);
        setSubCategory(subCatData);

        // Verify sub category belongs to main category
        if (subCatData.parentId !== mainCatData.id) {
          setError('Sub category does not belong to main category');
          setLoading(false);
          return;
        }

        // Track category view (for LRU)
        // Always update localStorage (for browser persistence, like Reddit)
        // Also update backend when authenticated (for account-specific sync)
        try {
          // Always update localStorage (works for both logged-in and logged-out users)
          const { addRecentCategory } = await import('@/lib/recentCategories');
          addRecentCategory({
            id: subCatData.id,
            name: subCatData.name,
            slug: subCatData.slug,
            parentId: subCatData.parentId || null,
            parentSlug: mainCatData.slug, // Store parent slug for routing
          });
          // Event is already dispatched by addRecentCategory
        } catch (err) {
          // Ignore localStorage errors
        }

        // Also update backend if authenticated (for account-specific sync)
        // Note: Backend tracks main category, not sub category
        if (isAuthenticated) {
          try {
            await fetch(`/api/categories/${subCategorySlug}/view`, {
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

        // Fetch posts for this sub category
        const postsData = await api.getPosts({
          subCategory: subCategorySlug,
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

    if (mainCategorySlug && subCategorySlug) {
      fetchData();
    }
  }, [mainCategorySlug, subCategorySlug, isAuthenticated]);

  // Use appropriate layout based on authentication status
  const Layout = isAuthenticated ? AuthLayout : MainLayout;

  if (authLoading) {
    return null;
  }

  if ((!mainCategory || !subCategory) && !loading) {
    return (
      <Layout>
        <div className="sub-category-page">
          <div className="sub-category-page-content">
            <Sidebar />
            <main className={`sub-category-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
              <div className="category-error">Category not found</div>
            </main>
          </div>
        </div>
      </Layout>
    );
  }

  const categoryTitle = mainCategory && subCategory 
    ? `${mainCategory.name} / ${subCategory.name}`
    : 'Category';

  return (
    <Layout>
      <div className="sub-category-page">
        <div className="sub-category-page-content">
          <Sidebar />
          <main className={`sub-category-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <PostList 
              posts={posts} 
              loading={loading} 
              error={error}
              title={categoryTitle}
            />
          </main>
        </div>
      </div>
    </Layout>
  );
}

