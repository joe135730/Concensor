'use client';

/**
 * Root Page (Entry Page / Home)
 * 
 * Route: /
 * Shows personalized recommendations for users.
 * For logged-out users, shows popular posts as fallback.
 * Accessible to both logged in and logged out users.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { api } from '@/lib/api';
import { Post } from '@/types';
import PostList from '@/components/posts/PostList';
import Sidebar from '@/components/common/Sidebar';
import './page.css';

export default function EntryPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen, isMobile } = useSidebar();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch personalized recommendations
  // TODO: Implement backend logic for personalized recommendations
  // For now, show popular posts as fallback
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        
        // TODO: Replace with personalized recommendations API
        // const data = await api.getPersonalizedRecommendations();
        
        // For now, use popular posts as fallback
        const data = await api.getPosts({
          popular: true,
        });
        
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
  }, [isAuthenticated]);

  // Use appropriate layout based on authentication status
  const Layout = isAuthenticated ? AuthLayout : MainLayout;

  // Show loading state while checking auth
  if (authLoading) {
    return null;
  }

  return (
    <Layout>
      <div className="entry-page">
        <div className="entry-page-content">
          <Sidebar />

          <main className={`entry-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <PostList 
              posts={posts} 
              loading={loading} 
              error={error}
              title={isAuthenticated ? "Recommended for You" : "Popular Posts"}
            />
          </main>
        </div>
      </div>
    </Layout>
  );
}
