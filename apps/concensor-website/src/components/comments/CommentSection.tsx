'use client';

/**
 * CommentSection Component
 * 
 * Displays comment input and comment list for a post.
 * Features:
 * - Comment input for authenticated users
 * - Nested replies with B1, B1-1, B1-2 numbering
 * - Sentiment indicators from user votes
 * - Reply functionality
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Comment } from '@/types';
import './CommentSection.css';

interface CommentSectionProps {
  postId: string;
  userVote: { voteType: string } | null;
  isAuthor: boolean;
  onCommentAdded?: () => void;
}

export default function CommentSection({ postId, userVote, isAuthor, onCommentAdded }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; number: string; username: string } | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});

  // Fetch comments
  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await api.getComments(postId);
        const commentsWithNumbers = assignCommentNumbers(response.comments || []);
        setComments(commentsWithNumbers);
      } catch (error: any) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  /**
   * Flatten all replies to a comment (including nested replies)
   * Returns all replies in creation order
   */
  const flattenReplies = (comment: Comment): Comment[] => {
    const allReplies: Comment[] = [];
    
    const collectReplies = (c: Comment) => {
      if (c.replies && c.replies.length > 0) {
        c.replies.forEach((reply) => {
          allReplies.push(reply);
          collectReplies(reply);
        });
      }
    };
    
    collectReplies(comment);
    return allReplies.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  /**
   * Assign comment numbers (B1, B1-1, B1-2, etc.)
   * All replies to the same top-level comment get sequential numbers
   * If a reply is to another reply, it shows the parent reply number
   */
  const assignCommentNumbers = (comments: Comment[]): Comment[] => {
    return comments.map((comment, index) => {
      const baseNumber = `B${index + 1}`;
      
      // Flatten all replies to this comment (including nested) in creation order
      const allReplies = flattenReplies(comment);
      
      // Create a map of reply ID to its number for quick lookup
      const replyNumberMap = new Map<string, string>();
      allReplies.forEach((reply, replyIndex) => {
        const replyNumber = `${baseNumber}-${replyIndex + 1}`;
        replyNumberMap.set(reply.id, replyNumber);
      });

      // Recursively assign numbers to replies while maintaining tree structure
      const assignReplyNumbers = (replies: Comment[], parentId: string): Comment[] => {
        return replies.map((reply) => {
          const replyNumber = replyNumberMap.get(reply.id) || '';
          
          // Determine replyToNumber - only show if replying to another reply (not direct to top-level)
          let replyToNumber: string | undefined;
          if (reply.parentId !== parentId) {
            // Reply to another reply - find parent's number
            const parentNumber = replyNumberMap.get(reply.parentId || '');
            if (parentNumber) {
              replyToNumber = parentNumber;
            }
          }

          return {
            ...reply,
            commentNumber: replyNumber,
            replyToNumber,
            replies: reply.replies ? assignReplyNumbers(reply.replies, reply.id) : undefined,
          };
        });
      };

      const numberedComment = {
        ...comment,
        commentNumber: baseNumber,
        replies: comment.replies ? assignReplyNumbers(comment.replies, comment.id) : undefined,
      };

      return numberedComment;
    });
  };

  /**
   * Get sentiment label from vote type
   */
  const getSentimentLabel = (voteType: string | null): string => {
    if (!voteType) return '';
    
    switch (voteType) {
      case 'strongly_agree':
        return 'Strongly Agree';
      case 'agree':
        return 'Agree';
      case 'neutral':
        return 'Neutral';
      case 'disagree':
        return 'Disagree';
      case 'strongly_disagree':
        return 'Strongly Disagree';
      default:
        return '';
    }
  };

  /**
   * Get sentiment color class
   */
  const getSentimentColor = (voteType: string | null): string => {
    if (!voteType) return '';
    
    if (voteType === 'strongly_agree' || voteType === 'agree') {
      return 'sentiment-agree';
    } else if (voteType === 'disagree' || voteType === 'strongly_disagree') {
      return 'sentiment-disagree';
    }
    return 'sentiment-neutral';
  };

  /**
   * Handle comment submission
   */
  const handleSubmitComment = async () => {
    if (!isAuthenticated || !commentContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      const response = await api.createComment(postId, {
        content: commentContent.trim(),
      });

      // Refresh comments
      const commentsResponse = await api.getComments(postId);
      const commentsWithNumbers = assignCommentNumbers(commentsResponse.comments || []);
      setComments(commentsWithNumbers);
      setCommentContent('');
      
      // Notify parent component to refresh post data
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle reply submission
   */
  const handleSubmitReply = async (parentId: string) => {
    const content = replyContent[parentId];
    if (!isAuthenticated || !content?.trim() || submitting) return;

    try {
      setSubmitting(true);
      await api.createComment(postId, {
        content: content.trim(),
        parentId,
      });

      // Refresh comments
      const commentsResponse = await api.getComments(postId);
      const commentsWithNumbers = assignCommentNumbers(commentsResponse.comments || []);
      setComments(commentsWithNumbers);
      setReplyContent({ ...replyContent, [parentId]: '' });
      setReplyingTo(null);
      
      // Notify parent component to refresh post data
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle reply button click
   */
  const handleReplyClick = (comment: Comment) => {
    setReplyingTo({
      id: comment.id,
      number: comment.commentNumber || '',
      username: comment.user.username || 'User',
    });
    setReplyContent({ ...replyContent, [comment.id]: '' });
  };

  /**
   * Cancel reply
   */
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  /**
   * Format date
   */
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
    
    // Format: YYYY/MM/DD HH:MM AM/PM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${year}/${month}/${day} ${displayHours}:${minutes} ${ampm}`;
  };

  // Check if user can comment (authenticated and (has voted or is author))
  const canComment = isAuthenticated && (userVote || isAuthor);

  return (
    <div className="comment-section">
      {/* Comment Input Section */}
      {isAuthenticated && (
        <div className="comment-input-section">
          <div className="comment-input-container">
            <div className="comment-author-avatar">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username || 'You'}
                  className="comment-avatar-image"
                />
              ) : (
                <span className="comment-avatar-initial">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="comment-input-wrapper">
              <div className="comment-author-name">{user?.username || 'You'}</div>
              <textarea
                className="comment-input"
                placeholder="Share your thoughts...."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={!canComment || submitting}
                rows={3}
              />
            </div>
            <button
              className="comment-send-button"
              onClick={handleSubmitComment}
              disabled={!canComment || !commentContent.trim() || submitting}
            >
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyClick={handleReplyClick}
              onCancelReply={handleCancelReply}
              onSubmitReply={handleSubmitReply}
              onReplyContentChange={(parentId, content) =>
                setReplyContent({ ...replyContent, [parentId]: content })
              }
              getSentimentLabel={getSentimentLabel}
              getSentimentColor={getSentimentColor}
              formatDate={formatDate}
              isAuthenticated={isAuthenticated}
              currentUser={user}
              canComment={canComment}
              submitting={submitting}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * CommentItem Component - Recursive component for nested comments
 */
interface CommentItemProps {
  comment: Comment;
  replyingTo: { id: string; number: string; username: string } | null;
  replyContent: { [key: string]: string };
  onReplyClick: (comment: Comment) => void;
  onCancelReply: () => void;
  onSubmitReply: (parentId: string) => void;
  onReplyContentChange: (parentId: string, content: string) => void;
  getSentimentLabel: (voteType: string | null) => string;
  getSentimentColor: (voteType: string | null) => string;
  formatDate: (dateString: string) => string;
  isAuthenticated: boolean;
  currentUser: any;
  canComment: boolean;
  submitting: boolean;
  depth?: number;
}

function CommentItem({
  comment,
  replyingTo,
  replyContent,
  onReplyClick,
  onCancelReply,
  onSubmitReply,
  onReplyContentChange,
  getSentimentLabel,
  getSentimentColor,
  formatDate,
  isAuthenticated,
  currentUser,
  canComment,
  submitting,
  depth = 0,
}: CommentItemProps) {
  const isReplying = replyingTo?.id === comment.id;
  const sentiment = (comment as any).userVote;
  const sentimentLabel = getSentimentLabel(sentiment);
  const sentimentColor = getSentimentColor(sentiment);
  const replyCount = comment._count?.replies || comment.replies?.length || 0;

  return (
    <div className={`comment-item ${depth > 0 ? 'comment-reply' : ''}`}>
      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author-info">
            <div className="comment-author-avatar">
              {comment.user.profilePicture ? (
                <img
                  src={comment.user.profilePicture}
                  alt={comment.user.username || 'User'}
                  className="comment-avatar-image"
                />
              ) : (
                <span className="comment-avatar-initial">
                  {comment.user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="comment-meta">
              <div className="comment-author-row">
                <span className="comment-author-name">{comment.user.username || 'Anonymous'}</span>
                {comment.user.equippedBadge && (
                  <span
                    className={`user-badge badge-level-${comment.user.equippedBadge.badgeLevel}`}
                  >
                    {comment.user.equippedBadge.label}
                  </span>
                )}
                {sentimentLabel && (
                  <span className={`comment-sentiment ${sentimentColor}`}>
                    ({sentimentLabel})
                  </span>
                )}
              </div>
              {comment.commentNumber && (
                <div className="comment-number">{comment.commentNumber}</div>
              )}
            </div>
          </div>
          <button className="comment-like-button" aria-label="Like comment">
            ♡
          </button>
        </div>

        {comment.replyToNumber && (
          <div className="comment-reply-to">
            Replying to {comment.replyToNumber}
          </div>
        )}

        <div className="comment-text">{comment.content}</div>

        <div className="comment-footer">
          <button
            className="comment-reply-button"
            onClick={() => onReplyClick(comment)}
            disabled={!canComment}
          >
            <span className="reply-icon">↩</span>
            {replyCount > 0 && <span>Comments ({replyCount})</span>}
            {replyCount === 0 && <span>Reply</span>}
          </button>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && isAuthenticated && (
        <div className="comment-reply-input-section">
          <div className="comment-reply-input-container">
            <div className="comment-author-avatar">
              {currentUser?.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt={currentUser.username || 'You'}
                  className="comment-avatar-image"
                />
              ) : (
                <span className="comment-avatar-initial">
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="comment-reply-input-wrapper">
              <div className="comment-reply-to-label">
                Reply to {replyingTo.number}...
              </div>
              <textarea
                className="comment-input"
                placeholder="Share your thoughts...."
                value={replyContent[comment.id] || ''}
                onChange={(e) => onReplyContentChange(comment.id, e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>
            <div className="comment-reply-actions">
              <button
                className="comment-cancel-button"
                onClick={onCancelReply}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="comment-send-button"
                onClick={() => onSubmitReply(comment.id)}
                disabled={!replyContent[comment.id]?.trim() || submitting}
              >
                {submitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Replies - Display all replies nested, but numbered sequentially */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onReplyClick={onReplyClick}
                onCancelReply={onCancelReply}
                onSubmitReply={onSubmitReply}
                onReplyContentChange={onReplyContentChange}
                getSentimentLabel={getSentimentLabel}
                getSentimentColor={getSentimentColor}
                formatDate={formatDate}
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
                canComment={canComment}
                submitting={submitting}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

