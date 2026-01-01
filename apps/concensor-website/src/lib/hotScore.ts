/**
 * Hot Score Calculation Utility
 * 
 * Implements Reddit-style "Hot Score" algorithm that prioritizes:
 * - Total engagement (votes + comments weighted)
 * - Recency (newer posts rank higher)
 * 
 * Formula: Hot Score = (totalVotes + commentCount × 2) / (hoursSincePost + 2) ^ 1.8
 * 
 * This formula ensures:
 * - Posts with more engagement get higher scores
 * - Newer posts rank higher than older posts with same engagement
 * - The +2 in denominator prevents division by zero and gives new posts a boost
 * - The ^1.8 exponent creates a time decay curve
 */

/**
 * Calculate hot score for a post
 * 
 * @param totalVotes - Total number of votes (regardless of direction)
 * @param commentCount - Total number of comments
 * @param createdAt - Post creation date
 * @returns Hot score (higher = more popular)
 */
export function calculateHotScore(
  totalVotes: number,
  commentCount: number,
  createdAt: Date | string
): number {
  // Convert createdAt to Date if it's a string
  const postDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  
  // Calculate hours since post was created
  const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
  
  // Ensure hoursSincePost is not negative (in case of clock issues)
  const hours = Math.max(0, hoursSincePost);
  
  // Calculate engagement score (votes + comments weighted 2x)
  const engagement = totalVotes + (commentCount * 2);
  
  // Calculate hot score: engagement / (hours + 2)^1.8
  // The +2 prevents division by zero and gives new posts a boost
  const denominator = Math.pow(hours + 2, 1.8);
  const hotScore = engagement / denominator;
  
  // Round to 6 decimal places (matching database precision)
  return Math.round(hotScore * 1000000) / 1000000;
}

/**
 * Recalculate hot score for a post and return the new value
 * Useful for updating hot scores when engagement changes
 * 
 * @param post - Post object with totalVotes, commentCount, and createdAt
 * @returns Updated hot score
 */
export function recalculateHotScore(post: {
  totalVotes: number;
  commentCount: number;
  createdAt: Date | string;
}): number {
  return calculateHotScore(
    post.totalVotes,
    post.commentCount,
    post.createdAt
  );
}

