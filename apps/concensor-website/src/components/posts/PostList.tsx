'use client';

/**
 * PostList Component
 * 
 * Reusable component for displaying a list of posts.
 * Used across different routes (/, /all, /popular, /category/...)
 */

import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import './PostList.css';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
  error?: string;
  title?: string;
}

export default function PostList({ posts, loading, error, title }: PostListProps) {
  const router = useRouter();

  if (loading) {
    return <div className="post-list-loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="post-list-error">{error}</div>;
  }

  if (!loading && !error && posts.length === 0) {
    return <div className="post-list-empty">No posts yet. Be the first to create one!</div>;
  }

  return (
    <div className="post-list-container">
      {title && <h1 className="post-list-title">{title}</h1>}
      
      <div className="post-list">
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
    </div>
  );
}
