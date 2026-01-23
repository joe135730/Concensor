'use client';

/**
 * Saved Posts Page
 * 
 * Route: /saved
 * Shows posts that the user has saved.
 * Requires authentication.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { api } from '@/lib/api';
import { Post } from '@/types';
import Sidebar from '@/components/common/Sidebar';
import SavedButton from '@/components/common/SavedButton';
import './page.css';

export default function SavedPostsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingRemovals, setPendingRemovals] = useState<Record<string, boolean>>({});
  const pendingRemovalsRef = useRef<Record<string, boolean>>({});
  const removalTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  useEffect(() => {
    pendingRemovalsRef.current = pendingRemovals;
  }, [pendingRemovals]);

  useEffect(() => {
    return () => {
      const pendingIds = Object.keys(pendingRemovalsRef.current);
      if (pendingIds.length === 0) return;

      pendingIds.forEach((postId) => {
        const timer = removalTimersRef.current[postId];
        if (timer) {
          clearTimeout(timer);
        }
        api.unsavePost(postId).catch(() => {});
      });
    };
  }, []);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const handleToggleSaved = (postId: string) => {
    if (pendingRemovals[postId]) {
      const timer = removalTimersRef.current[postId];
      if (timer) {
        clearTimeout(timer);
      }
      delete removalTimersRef.current[postId];
      setPendingRemovals((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }

    setPendingRemovals((prev) => ({ ...prev, [postId]: true }));
    removalTimersRef.current[postId] = setTimeout(async () => {
      try {
        await api.unsavePost(postId);
        setPosts((prev) => prev.filter((item) => item.id !== postId));
      } catch (err: any) {
        setError(err.message || 'Failed to update saved posts');
        setPendingRemovals((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      } finally {
        delete removalTimersRef.current[postId];
      }
    }, 4000);
  };

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
                    className={`saved-post-card ${pendingRemovals[post.id] ? 'pending-removal' : ''}`}
                    onClick={() => router.push(`/posts/${post.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="saved-post-card-header">
                      <h2 className="saved-post-card-title">{post.title}</h2>
                      <SavedButton
                        isSaved={!pendingRemovals[post.id]}
                        size={28}
                        className="saved-card-button"
                        ariaLabel={pendingRemovals[post.id] ? 'Undo remove from saved' : 'Remove from saved'}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleSaved(post.id);
                        }}
                      />
                    </div>
                    <p className="saved-post-card-content">{post.content}</p>
                    {pendingRemovals[post.id] && (
                      <div className="saved-post-undo">
                        Removed from saved.
                        <button
                          type="button"
                          className="saved-post-undo-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleSaved(post.id);
                          }}
                        >
                          Undo
                        </button>
                      </div>
                    )}
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

