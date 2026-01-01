'use client';

/**
 * Post Details Page
 * 
 * Displays a single post with full details, voting interface, and comments.
 * Route: /posts/[id]
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Post } from '@/types';
import './page.css';

export default function PostDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const postId = params?.id as string;

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch post
  useEffect(() => {
    if (!postId || authLoading || !isAuthenticated) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.getPost(postId);
        setPost(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, authLoading, isAuthenticated]);

  const handleDelete = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setDeleting(true);
      await api.deletePost(post.id);
      router.push('/home');
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const calculateConsensus = () => {
    if (!post) return { agree: 0, disagree: 0, neutral: 0 };
    
    const total = post.totalVotes || 0;
    if (total === 0) return { agree: 0, disagree: 0, neutral: 0 };

    const agree = post.stronglyAgreeCount + post.agreeCount;
    const disagree = post.stronglyDisagreeCount + post.disagreeCount;
    const neutral = post.neutralCount;

    return {
      agree: Math.round((agree / total) * 100),
      disagree: Math.round((disagree / total) * 100),
      neutral: Math.round((neutral / total) * 100),
    };
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="post-details-page">
          <div className="loading">Loading post...</div>
        </div>
      </AuthLayout>
    );
  }

  if (error || !post) {
    return (
      <AuthLayout>
        <div className="post-details-page">
          <div className="error">{error || 'Post not found'}</div>
          <Link href="/home" className="back-link">
            ← Back to Posts
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const consensus = calculateConsensus();
  const isAuthor = user?.id === post.authorId;

  return (
    <AuthLayout>
      <div className="post-details-page">
        <div className="post-details-container">
          {/* Back Link */}
          <Link href="/home" className="back-link">
            ← Back to Posts
          </Link>

          {/* Post Header */}
          <div className="post-header">
            <div className="post-categories">
              <Link
                href={`/home?mainCategory=${post.mainCategory.slug}`}
                className="category-link main-category"
              >
                {post.mainCategory.name}
              </Link>
              <span className="category-separator">/</span>
              <Link
                href={`/home?subCategory=${post.subCategory.slug}`}
                className="category-link sub-category"
              >
                {post.subCategory.name}
              </Link>
            </div>

            {isAuthor && (
              <div className="post-actions">
                <button
                  className="edit-button"
                  onClick={() => router.push(`/posts/${post.id}/edit`)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {/* Post Content */}
          <article className="post-details-card">
            <div className="post-author">
              <div className="author-avatar">
                {post.author.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt={post.author.username || 'User'}
                    className="avatar-image"
                  />
                ) : (
                  <span className="avatar-initial">
                    {post.author.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="author-info">
                <div className="author-name">{post.author.username || 'Anonymous'}</div>
                <div className="post-date">{formatDate(post.createdAt)}</div>
              </div>
            </div>

            <h1 className="post-details-title">{post.title}</h1>
            <div className="post-details-content">{post.content}</div>

            {/* Post Stats */}
            <div className="post-stats">
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <span className="stat-value">{post._count?.comments || post.commentCount || 0}</span>
                <span className="stat-label">Comments</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">👁️</span>
                <span className="stat-value">{post.viewCount || 0}</span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <span className="stat-value">{post.totalVotes || 0}</span>
                <span className="stat-label">Votes</span>
              </div>
            </div>

            {/* Consensus Bar */}
            {post.totalVotes > 0 && (
              <div className="consensus-section">
                <h3 className="consensus-title">Community Consensus</h3>
                <div className="vote-bar">
                  <span className="agree-label">Agree {consensus.agree}%</span>
                  <div className="progress-bar">
                    <div
                      className="progress-agree"
                      style={{ width: `${consensus.agree}%` }}
                    >
                      {consensus.agree > 10 && `${consensus.agree}%`}
                    </div>
                    <div
                      className="progress-neutral"
                      style={{ width: `${consensus.neutral}%` }}
                    >
                      {consensus.neutral > 10 && `${consensus.neutral}%`}
                    </div>
                    <div
                      className="progress-disagree"
                      style={{ width: `${consensus.disagree}%` }}
                    >
                      {consensus.disagree > 10 && `${consensus.disagree}%`}
                    </div>
                  </div>
                  <span className="disagree-label">Disagree {consensus.disagree}%</span>
                </div>
              </div>
            )}

            {/* Voting Interface - TODO: Implement in Phase 4 */}
            <div className="voting-section">
              <p className="voting-placeholder">
                Voting interface will be implemented in Phase 4
              </p>
            </div>

            {/* Comments Section - TODO: Implement in Phase 9 */}
            <div className="comments-section">
              <h3 className="comments-title">
                Comments ({post._count?.comments || post.commentCount || 0})
              </h3>
              <p className="comments-placeholder">
                Comments will be implemented in Phase 9
              </p>
            </div>
          </article>
        </div>
      </div>
    </AuthLayout>
  );
}

