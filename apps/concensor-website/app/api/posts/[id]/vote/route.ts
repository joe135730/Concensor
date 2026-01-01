// Vote endpoint
// POST /api/posts/[id]/vote - Submit a vote on a post

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { recalculateHotScore } from '@/lib/hotScore';

/**
 * Helper function to get authenticated user from request
 */
async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Map vote type to vote value
 */
function getVoteValue(voteType: string): number {
  switch (voteType) {
    case 'strongly_disagree':
      return -2;
    case 'disagree':
      return -1;
    case 'neutral':
      return 0;
    case 'agree':
      return 1;
    case 'strongly_agree':
      return 2;
    default:
      return 0;
  }
}

/**
 * POST /api/posts/[id]/vote - Submit a vote
 * 
 * Body:
 * - voteType: 'strongly_disagree' | 'disagree' | 'neutral' | 'agree' | 'strongly_agree'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: postId } = params;
    const body = await request.json();
    const { voteType } = body;

    // Validation
    const validVoteTypes = ['strongly_disagree', 'disagree', 'neutral', 'agree', 'strongly_agree'];
    if (!voteType || !validVoteTypes.includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }

    // Get post
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.status !== 'published') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the post author (post owner cannot vote)
    if (post.authorId === user.id) {
      return NextResponse.json(
        { error: 'Post owner cannot vote on their own post' },
        { status: 403 }
      );
    }

    // Check if user already voted
    const existingVote = await db.vote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this post' },
        { status: 400 }
      );
    }

    const voteValue = getVoteValue(voteType);

    // Create vote and update post counts in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create vote
      const vote = await tx.vote.create({
        data: {
          postId,
          userId: user.id,
          voteType,
          voteValue,
        },
      });

      // Get current post to calculate new hot score
      const currentPost = await tx.post.findUnique({
        where: { id: postId },
        select: {
          totalVotes: true,
          commentCount: true,
          createdAt: true,
        },
      });

      if (!currentPost) {
        throw new Error('Post not found');
      }

      // Update post vote counts based on vote type
      const updateData: any = {
        totalVotes: { increment: 1 },
        weightedScore: { increment: voteValue },
      };

      switch (voteType) {
        case 'strongly_disagree':
          updateData.stronglyDisagreeCount = { increment: 1 };
          break;
        case 'disagree':
          updateData.disagreeCount = { increment: 1 };
          break;
        case 'neutral':
          updateData.neutralCount = { increment: 1 };
          break;
        case 'agree':
          updateData.agreeCount = { increment: 1 };
          break;
        case 'strongly_agree':
          updateData.stronglyAgreeCount = { increment: 1 };
          break;
      }

      // Recalculate hot score with new vote count
      const newTotalVotes = currentPost.totalVotes + 1;
      const newHotScore = recalculateHotScore({
        totalVotes: newTotalVotes,
        commentCount: currentPost.commentCount,
        createdAt: currentPost.createdAt,
      });
      updateData.hotScore = newHotScore;

      // Update post
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          mainCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          subCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      });

      return { vote, post: updatedPost };
    });

    return NextResponse.json({
      success: true,
      vote: result.vote,
      post: result.post,
    });
  } catch (error: any) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process vote',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/[id]/vote - Get user's vote on this post (if exists)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: postId } = params;

    // Get user's vote
    const vote = await db.vote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (!vote) {
      return NextResponse.json({ vote: null });
    }

    return NextResponse.json({ vote });
  } catch (error: any) {
    console.error('Error fetching vote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote' },
      { status: 500 }
    );
  }
}
