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
import PostList from '@/components/posts/PostList';
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
  // TODO: Implement saved posts API endpoint
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const fetchSavedPosts = async () => {
        try {
          setLoading(true);
          setError('');
          
          // TODO: Replace with saved posts API
          // const data = await api.getSavedPosts();
          
          // For now, show empty state
          setPosts([]);
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
            <PostList 
              posts={posts} 
              loading={loading} 
              error={error}
              title="Saved Posts"
            />
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}

