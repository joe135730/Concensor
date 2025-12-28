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

import { useEffect, useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import { api } from '@/lib/api';
import { Post } from '@/types';
import './page.css';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch posts when component mounts
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await api.getPosts();
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
  }, []);

  return (
    <AuthLayout>
      <div className="home-page">
        <div className="home-content">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <a href="/home" className="sidebar-link active">Popular</a>
            <a href="/home?category=immigration" className="sidebar-link">Immigration</a>
            <a href="/home?category=abortion" className="sidebar-link">Abortion</a>
            <a href="/home?category=civil-rights" className="sidebar-link">Civil Rights</a>
            <a href="/home?category=public-safety" className="sidebar-link">Public Safety</a>
          </nav>
        </aside>
        
        <main className="posts-main">
          <h1 className="posts-title">Popular</h1>
          
          {loading && <div className="loading">Loading posts...</div>}
          {error && <div className="error">{error}</div>}
          
          {!loading && !error && posts.length === 0 && (
            <div className="no-posts">No posts yet. Be the first to create one!</div>
          )}
          
          <div className="posts-list">
            {posts.map((post) => (
              <article key={post.id} className="post-card">
                <h2 className="post-title">{post.title}</h2>
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <span className="comment-count">💬 100</span>
                  <div className="vote-bar">
                    <span className="agree-label">Agree</span>
                    <div className="progress-bar">
                      <div className="progress-agree" style={{ width: '50%' }}>50%</div>
                      <div className="progress-disagree" style={{ width: '50%' }}>50%</div>
                    </div>
                    <span className="disagree-label">Disagree</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
        </div>
      </div>
    </AuthLayout>
  );
}

