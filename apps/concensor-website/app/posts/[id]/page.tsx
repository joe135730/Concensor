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
import MainLayout from '@/layouts/MainLayout';
import Sidebar from '@/components/common/Sidebar';
import CommentSection from '@/components/comments/CommentSection';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { api } from '@/lib/api';
import { Post } from '@/types';
import './page.css';

type VoteType = 'strongly_disagree' | 'disagree' | 'neutral' | 'agree' | 'strongly_agree';

interface Vote {
  id: string;
  voteType: VoteType;
  voteValue: number;
  createdAt: string;
}

export default function PostDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { sidebarOpen } = useSidebar(); // Must be called before any conditional returns
  const [post, setPost] = useState<Post | null>(null);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showVotePreview, setShowVotePreview] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const postId = params?.id as string;

  // Fetch post (allow non-authenticated users to view)
  useEffect(() => {
    if (!postId || authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch post
        const postData = await api.getPost(postId);
        setPost(postData);
        
        // Only fetch user's vote if authenticated
        if (isAuthenticated) {
          try {
            const voteData = await api.getUserVote(postId);
            setUserVote(voteData.vote || null);
          } catch (err) {
            // If no vote or error, set to null
            setUserVote(null);
          }

          try {
            const savedData = await api.getSavedPostStatus(postId);
            setIsSaved(!!savedData.saved);
          } catch (err) {
            setIsSaved(false);
          }
        } else {
          setUserVote(null);
          setIsSaved(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, authLoading, isAuthenticated]);

  const handleDelete = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setDeleting(true);
      await api.deletePost(post.id);
      router.push('/');
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = () => {
    const link = window.location.href;
    window.prompt('Copy this link:', link);
  };

  const handleToggleSave = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setSaving(true);
      if (isSaved) {
        await api.unsavePost(post.id);
        setIsSaved(false);
      } else {
        await api.savePost(post.id);
        setIsSaved(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update saved state');
    } finally {
      setSaving(false);
    }
  };

  const handleVoteClick = (voteType: VoteType) => {
    if (!post || isAuthor || userVote) return; // Can't vote if already voted or is author
    
    setSelectedVote(voteType);
    setShowVotePreview(true);
  };

  const handleConfirmVote = async () => {
    if (!post || !selectedVote || voting) return;

    try {
      setVoting(true);
      const response = await api.vote(post.id, selectedVote);
      
      // Update post with new vote counts
      setPost(response.post);
      setUserVote(response.vote);
      setShowVotePreview(false);
      setSelectedVote(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const handleCancelVote = () => {
    setShowVotePreview(false);
    setSelectedVote(null);
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

  const getVoteLabel = (voteType: VoteType): string => {
    switch (voteType) {
      case 'strongly_disagree':
        return 'Strongly Disagree';
      case 'disagree':
        return 'Disagree';
      case 'neutral':
        return 'Neutral';
      case 'agree':
        return 'Agree';
      case 'strongly_agree':
        return 'Strongly Agree';
    }
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

  const getUserVotePosition = () => {
    if (!userVote || !post) return null;

    const total = post.totalVotes || 0;
    if (total === 0) return null;

    // Calculate grouped percentages (for display)
    const agreePercent = consensus.agree; // Strongly Agree + Agree
    const neutralPercent = consensus.neutral;
    const disagreePercent = consensus.disagree; // Disagree + Strongly Disagree

    // Calculate position based on grouped segments
    let position = 0;
    switch (userVote.voteType) {
      case 'strongly_disagree':
      case 'disagree':
        // In the Disagree segment (right side)
        position = agreePercent + neutralPercent + (disagreePercent / 2);
        break;
      case 'neutral':
        // In the Neutral segment (middle)
        position = agreePercent + (neutralPercent / 2);
        break;
      case 'agree':
      case 'strongly_agree':
        // In the Agree segment (left side)
        position = agreePercent / 2;
        break;
    }

    return Math.max(0, Math.min(100, position)); // Clamp between 0 and 100
  };

  if (authLoading) {
    return (
      <div className="post-details-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="post-details-page">
        <div className="loading">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-details-page">
        <div className="error">{error || 'Post not found'}</div>
        <Link href="/" className="back-link">
          ← Back to Posts
        </Link>
      </div>
    );
  }

  const consensus = calculateConsensus();
  const isAuthor = isAuthenticated && user?.id === post.authorId;
  const hasVoted = !!userVote;
  const canVote = isAuthenticated && !isAuthor && !hasVoted;
  const canComment = isAuthenticated && (hasVoted || isAuthor); // Must be authenticated and (vote OR be author) to comment
  const userVotePosition = getUserVotePosition();

  // Use MainLayout for non-authenticated, AuthLayout for authenticated
  const Layout = isAuthenticated ? AuthLayout : MainLayout;

  return (
    <Layout>
      <div className="post-details-page">
        <div className="post-details-page-content">
          <Sidebar />
          <main className={`post-details-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="post-details-container">
          {/* Back Link */}
          <Link href="/" className="back-link">
            ← Back to Posts
          </Link>

          {/* Post Header */}
          <div className="post-header">
            <div className="post-categories">
              <Link
                href={`/category/${post.mainCategory.slug}`}
                className="category-link main-category"
              >
                {post.mainCategory.name}
              </Link>
              <span className="category-separator">/</span>
              <Link
                href={`/category/${post.mainCategory.slug}/${post.subCategory.slug}`}
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

            <div className="post-details-header">
              <h1 className="post-details-title">{post.title}</h1>
              <div className="post-details-actions">
                <button
                  type="button"
                  className="post-action-button"
                  onClick={handleShare}
                  aria-label="Share post"
                >
                  <svg viewBox="0 0 24 24" role="presentation">
                    <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-6 9h2v6h8v-6h2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`post-action-button save-button ${isSaved ? 'active' : ''}`}
                  onClick={handleToggleSave}
                  aria-label={isSaved ? 'Unsave post' : 'Save post'}
                  disabled={saving}
                >
                  <svg viewBox="0 0 24 24" role="presentation">
                    <path d="M7 4a2 2 0 0 0-2 2v14l7-3.5L19 20V6a2 2 0 0 0-2-2H7z" />
                  </svg>
                </button>
              </div>
            </div>
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

            {/* Voting Section */}
            <div className="voting-section">
              {!isAuthenticated ? (
                // Non-authenticated user view
                <div className="voting-login-prompt">
                  <h3 className="voting-title">What's your opinion?</h3>
                  <p className="voting-subtitle">Please login to vote and see community consensus</p>
                  <div className="login-prompt-card">
                    <p className="login-prompt-text">
                      Join the discussion by logging in. Once you vote, you'll be able to see the community consensus and participate in comments.
                    </p>
                    <button
                      className="login-prompt-button"
                      onClick={() => router.push('/login')}
                    >
                      Login to Vote & Comment
                    </button>
                  </div>
                </div>
              ) : isAuthor ? (
                // Post owner view - show results if votes exist
                post.totalVotes > 0 ? (
                  <div className="voting-results">
                    <h3 className="voting-results-title">Community Consensus</h3>
                    <p className="voting-owner-note">You cannot vote on your own post, but you can see the results.</p>
                    
                    {/* Consensus Bar */}
                    <div className="vote-bar-detailed">
                      <span className="vote-label-left">Strongly Agree</span>
                      <div className="progress-bar-detailed">
                        {/* Agree (Strongly Agree + Agree) */}
                        <div
                          className="progress-agree-grouped"
                          style={{ width: `${consensus.agree}%` }}
                        >
                          {consensus.agree > 5 && (
                            <span className="progress-percentage">
                              {consensus.agree}%
                            </span>
                          )}
                        </div>
                        {/* Neutral */}
                        <div
                          className="progress-neutral"
                          style={{ width: `${consensus.neutral}%` }}
                        >
                          {consensus.neutral > 5 && (
                            <span className="progress-percentage">
                              {consensus.neutral}%
                            </span>
                          )}
                        </div>
                        {/* Disagree (Disagree + Strongly Disagree) */}
                        <div
                          className="progress-disagree-grouped"
                          style={{ width: `${consensus.disagree}%` }}
                        >
                          {consensus.disagree > 5 && (
                            <span className="progress-percentage">
                              {consensus.disagree}%
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="vote-label-right">Strongly Disagree</span>
                    </div>
                  </div>
                ) : (
                  // No votes yet - show empty bar
                  <div className="voting-results">
                    <h3 className="voting-results-title">Community Consensus</h3>
                    <p className="voting-owner-note">You cannot vote on your own post. Waiting for votes...</p>
                    
                    <div className="vote-bar-detailed">
                      <span className="vote-label-left">Strongly Agree</span>
                      <div className="progress-bar-empty">
                        <span className="no-votes-text">No votes yet</span>
                      </div>
                      <span className="vote-label-right">Strongly Disagree</span>
                    </div>
                  </div>
                )
              ) : hasVoted ? (
                // Show results after voting
                <div className="voting-results">
                  <h3 className="voting-results-title">Community Consensus</h3>
                  
                  {/* User's Vote Indicator */}
                  <div className="user-vote-indicator">
                    <div className="user-vote-arrow" style={{ left: `${userVotePosition}%` }}>
                      <div className="arrow-down"></div>
                      <div className="user-vote-label">
                        Your answer ({getVoteLabel(userVote.voteType)})
                      </div>
                    </div>
                  </div>

                  {/* Consensus Bar - Grouped into 3 segments (Agree, Neutral, Disagree) */}
                  <div className="vote-bar-detailed">
                    <span className="vote-label-left">Strongly Agree</span>
                    <div className="progress-bar-detailed">
                      {/* Agree (Strongly Agree + Agree) */}
                      <div
                        className="progress-agree-grouped"
                        style={{ width: `${consensus.agree}%` }}
                      >
                        {consensus.agree > 5 && (
                          <span className="progress-percentage">
                            {consensus.agree}%
                          </span>
                        )}
                      </div>
                      {/* Neutral */}
                      <div
                        className="progress-neutral"
                        style={{ width: `${consensus.neutral}%` }}
                      >
                        {consensus.neutral > 5 && (
                          <span className="progress-percentage">
                            {consensus.neutral}%
                          </span>
                        )}
                      </div>
                      {/* Disagree (Disagree + Strongly Disagree) */}
                      <div
                        className="progress-disagree-grouped"
                        style={{ width: `${consensus.disagree}%` }}
                      >
                        {consensus.disagree > 5 && (
                          <span className="progress-percentage">
                            {consensus.disagree}%
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="vote-label-right">Strongly Disagree</span>
                  </div>
                </div>
              ) : (
                // Show voting interface before voting - NO result bar shown until user votes
                <div className="voting-interface">
                  <h3 className="voting-title">What's your opinion?</h3>
                  <p className="voting-subtitle">Vote to see results and join the discussion</p>
                  
                  <div className="vote-slider">
                    <button
                      className={`vote-option ${selectedVote === 'strongly_agree' ? 'selected' : ''}`}
                      onClick={() => handleVoteClick('strongly_agree')}
                      disabled={voting}
                    >
                      <div className="vote-circle"></div>
                      <span className="vote-label">Strongly Agree</span>
                    </button>
                    <button
                      className={`vote-option ${selectedVote === 'agree' ? 'selected' : ''}`}
                      onClick={() => handleVoteClick('agree')}
                      disabled={voting}
                    >
                      <div className="vote-circle"></div>
                      <span className="vote-label">Agree</span>
                    </button>
                    <button
                      className={`vote-option ${selectedVote === 'neutral' ? 'selected' : ''}`}
                      onClick={() => handleVoteClick('neutral')}
                      disabled={voting}
                    >
                      <div className="vote-circle"></div>
                      <span className="vote-label">Neutral</span>
                    </button>
                    <button
                      className={`vote-option ${selectedVote === 'disagree' ? 'selected' : ''}`}
                      onClick={() => handleVoteClick('disagree')}
                      disabled={voting}
                    >
                      <div className="vote-circle"></div>
                      <span className="vote-label">Disagree</span>
                    </button>
                    <button
                      className={`vote-option ${selectedVote === 'strongly_disagree' ? 'selected' : ''}`}
                      onClick={() => handleVoteClick('strongly_disagree')}
                      disabled={voting}
                    >
                      <div className="vote-circle"></div>
                      <span className="vote-label">Strongly Disagree</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Vote Preview Modal */}
            {showVotePreview && selectedVote && (
              <div className="vote-preview-modal-overlay" onClick={handleCancelVote}>
                <div className="vote-preview-modal" onClick={(e) => e.stopPropagation()}>
                  <h3 className="vote-preview-title">Confirm Your Vote</h3>
                  <p className="vote-preview-message">
                    You are about to vote: <strong>{getVoteLabel(selectedVote)}</strong>
                  </p>
                  <p className="vote-preview-note">
                    This vote is final and cannot be changed. Make sure this reflects your true opinion.
                  </p>
                  <div className="vote-preview-actions">
                    <button
                      className="vote-preview-cancel"
                      onClick={handleCancelVote}
                      disabled={voting}
                    >
                      Cancel
                    </button>
                    <button
                      className="vote-preview-confirm"
                      onClick={handleConfirmVote}
                      disabled={voting}
                    >
                      {voting ? 'Submitting...' : 'Confirm Vote'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="comments-section">
              <h3 className="comments-title">
                Comments ({post._count?.comments || post.commentCount || 0})
              </h3>
              
              {/* Show comments for all users (authenticated and non-authenticated can view) */}
              {(hasVoted || isAuthor || !isAuthenticated) && (
                <CommentSection
                  postId={post.id}
                  userVote={userVote}
                  isAuthor={isAuthor}
                  onCommentAdded={() => {
                    // Refresh post to update comment count
                    api.getPost(postId).then((updatedPost) => {
                      setPost(updatedPost);
                    }).catch(console.error);
                  }}
                />
              )}
              
              {/* Show message for authenticated users who haven't voted yet */}
              {isAuthenticated && !hasVoted && !isAuthor && (
                <div className="comments-placeholder">
                  <p>Vote to see comments and join the discussion</p>
                </div>
              )}
            </div>
          </article>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
