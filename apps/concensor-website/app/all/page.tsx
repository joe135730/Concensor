'use client';

/**
 * All Posts Page
 * 
 * Route: /all
 * Shows all posts sorted by newest first.
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

export default function AllPostsPage() {
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

  // Fetch all posts
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const fetchPosts = async () => {
        try {
          setLoading(true);
          setError('');
          const data = await api.getPosts({
            popular: false, // All posts, sorted by newest
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
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="all-posts-page">
        <div className="all-posts-page-content">
          <Sidebar />
          <main className={`all-posts-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <PostList 
              posts={posts} 
              loading={loading} 
              error={error}
              title="All Posts"
            />
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}

