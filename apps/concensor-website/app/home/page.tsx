'use client';

/**
 * Home Page (Posts Page)
 * 
 * This is the main page users see after logging in.
 * Shows all posts with sidebar navigation.
 * 
 * Route: /home
 * API: /api/posts
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { api } from '@/lib/api';
import { Post } from '@/types';
import './page.css';

const CATEGORIES = [
  { id: 'popular', name: 'Popular', slug: null },
  { id: 'immigration', name: 'Immigration', slug: 'immigration' },
  { id: 'abortion', name: 'Abortion', slug: 'abortion' },
  { id: 'civil-rights', name: 'Civil Rights', slug: 'civil-rights' },
  { id: 'public-safety', name: 'Public Safety', slug: 'public-safety' },
] as const;

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen, setSidebarOpen, isMobile } = useSidebar();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentCategorySlug = searchParams.get('category');
  const currentCategory = CATEGORIES.find(
    cat => cat.slug === currentCategorySlug || (currentCategorySlug === null && cat.slug === null)
  ) || CATEGORIES[0];

  const handleCategoryClick = useCallback((category: typeof CATEGORIES[number]) => {
    if (category.slug) {
      router.push(`/home?category=${category.slug}`);
    } else {
      router.push('/home');
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router, isMobile, setSidebarOpen]);

  const handleCreatePost = useCallback(() => {
    router.push('/create-post');
  }, [router]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Only fetch posts if user is authenticated
    if (!authLoading && isAuthenticated) {
      const fetchPosts = async () => {
        try {
          setLoading(true);
          // Check if "Popular" category is selected
          const isPopular = currentCategory?.id === 'popular';
          const data = await api.getPosts({
            popular: isPopular,
            category: currentCategorySlug || undefined,
          });
          // API returns { posts: [], total: 0, page: 1 } or array directly
          if (Array.isArray(data)) {
            setPosts(data);
          } else if (data.posts) {
            setPosts(data.posts);
          } else {
            setPosts([]);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load posts');
        } finally {
          setLoading(false);
        }
      };

      fetchPosts();
    }
  }, [authLoading, isAuthenticated, currentCategorySlug, currentCategory]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const sidebar = document.querySelector('.sidebar');
        const hamburger = document.querySelector('.header-hamburger-button');

        if (sidebar && hamburger && !sidebar.contains(target) && !hamburger.contains(target)) {
          setSidebarOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarOpen, isMobile, setSidebarOpen]);

  // Show nothing while checking auth or if not authenticated (will redirect)
  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="home-page">
        <div className="home-content">
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
              {CATEGORIES.map((category) => {
                const isActive = currentCategory.id === category.id;
                return (
                  <button
                    key={category.id}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category.name}
                  </button>
                );
              })}
              {/* Create Post Button in Sidebar */}
              <button
                className="sidebar-post-button"
                onClick={handleCreatePost}
              >
                Post
              </button>
            </nav>
          </aside>

          <main className={`posts-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <h1 className="posts-title">{currentCategory.name}</h1>
          
          {loading && <div className="loading">Loading posts...</div>}
          {error && <div className="error">{error}</div>}
          
          {!loading && !error && posts.length === 0 && (
            <div className="no-posts">No posts yet. Be the first to create one!</div>
          )}
          
          <div className="posts-list">
            {posts.map((post) => (
              <article
                key={post.id}
                className="post-card"
                onClick={() => router.push(`/posts/${post.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <h2 className="post-title">{post.title}</h2>
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <span className="comment-count">
                    💬 {post._count?.comments || post.commentCount || 0}
                  </span>
                  {post.totalVotes > 0 && (
                    <div className="vote-bar">
                      <span className="agree-label">
                        Agree {Math.round(((post.stronglyAgreeCount + post.agreeCount) / post.totalVotes) * 100)}%
                      </span>
                      <div className="progress-bar">
                        <div
                          className="progress-agree"
                          style={{
                            width: `${Math.round(((post.stronglyAgreeCount + post.agreeCount) / post.totalVotes) * 100)}%`,
                          }}
                        />
                        <div
                          className="progress-disagree"
                          style={{
                            width: `${Math.round(((post.stronglyDisagreeCount + post.disagreeCount) / post.totalVotes) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="disagree-label">
                        Disagree {Math.round(((post.stronglyDisagreeCount + post.disagreeCount) / post.totalVotes) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* Floating Create Post Button (Bottom Right) */}
        <button
          className="floating-create-post-button"
          onClick={handleCreatePost}
          aria-label="Create post"
        >
          <span className="plus-icon">+</span>
        </button>
        </div>
      </div>
    </AuthLayout>
  );
}

