'use client';

/**
 * Saved Posts Page
 * 
 * Route: /saved
 * Shows posts that the user has saved.
 * Requires authentication.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { api } from '@/lib/api';
import { Post } from '@/types';
import Sidebar from '@/components/common/Sidebar';
import './page.css';

export default function SavedPostsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch saved posts
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const fetchSavedPosts = async () => {
        try {
          setLoading(true);
          setError('');
          const data = await api.getSavedPosts();
          setPosts(Array.isArray(data) ? data : []);
        } catch (err: any) {
          setError(err.message || 'Failed to load saved posts');
        } finally {
          setLoading(false);
        }
      };

      fetchSavedPosts();
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="saved-posts-page">
        <div className="saved-posts-page-content">
          <Sidebar />
          <main className={`saved-posts-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <h1 className="saved-posts-title">Save</h1>

            {loading && <div className="saved-posts-loading">Loading saved posts...</div>}
            {error && <div className="saved-posts-error">{error}</div>}

            {!loading && !error && posts.length === 0 && (
              <div className="saved-posts-empty">No saved posts yet</div>
            )}

            {!loading && !error && posts.length > 0 && (
              <div className="saved-posts-grid">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="saved-post-card"
                    onClick={() => router.push(`/posts/${post.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="saved-post-card-header">
                      <h2 className="saved-post-card-title">{post.title}</h2>
                      <span className="saved-post-bookmark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" role="presentation">
                          <path d="M7 4a2 2 0 0 0-2 2v14l7-3.5L19 20V6a2 2 0 0 0-2-2H7z" />
                        </svg>
                      </span>
                    </div>
                    <p className="saved-post-card-content">{post.content}</p>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}

