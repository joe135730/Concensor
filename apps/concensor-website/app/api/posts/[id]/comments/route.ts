// Comments endpoint
// GET /api/posts/[id]/comments - Get all comments for a post
// POST /api/posts/[id]/comments - Create a new comment

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { awardCommentPoints } from '@/lib/pointsService';
import { recalculateHotScore } from '@/lib/hotScore';
import { getBadgeName } from '@/lib/points';

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
 * GET /api/posts/[id]/comments - Get all comments for a post
 * Returns comments in a flat structure with nested replies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params;

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get all comments for this post (top-level only, no parentId)
    const topLevelComments = await db.comment.findMany({
      where: {
        postId,
        parentId: null,
        status: 'published',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            equippedBadgeCategoryId: true,
            equippedBadgeCategory: {
              select: {
                id: true,
                name: true,
              },
            },
            categoryPoints: {
              select: {
                categoryId: true,
                currentBadgeLevel: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Ascending order as requested
      },
    });

    // Get all replies (comments with parentId)
    const allReplies = await db.comment.findMany({
      where: {
        postId,
        parentId: { not: null },
        status: 'published',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            equippedBadgeCategoryId: true,
            equippedBadgeCategory: {
              select: {
                id: true,
                name: true,
              },
            },
            categoryPoints: {
              select: {
                categoryId: true,
                currentBadgeLevel: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            parentId: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get all votes for this post to show sentiment indicators
    const votes = await db.vote.findMany({
      where: { postId },
      select: {
        userId: true,
        voteType: true,
      },
    });

    // Create a map of userId -> voteType for quick lookup
    const userVoteMap = new Map<string, string>();
    votes.forEach((vote) => {
      userVoteMap.set(vote.userId, vote.voteType);
    });

    // Build nested structure
    const buildCommentTree = (parentId: string | null, comments: any[]): any[] => {
      return comments
        .filter((c) => c.parentId === parentId)
        .map((comment) => ({
          ...comment,
          replies: buildCommentTree(comment.id, comments),
          userVote: userVoteMap.get(comment.userId) || null,
        }));
    };

    // Build tree structure
    const addEquippedBadge = (comment: any) => {
      const equippedCategoryId = comment.user?.equippedBadgeCategoryId;
      const equippedCategory = comment.user?.equippedBadgeCategory;
      const equippedPoints = equippedCategoryId
        ? comment.user?.categoryPoints?.find((cp: any) => cp.categoryId === equippedCategoryId)
        : null;
      const badgeLevel = equippedPoints?.currentBadgeLevel ?? 1;
      const badgeName = getBadgeName(badgeLevel);

      return {
        ...comment,
        user: {
          ...comment.user,
          equippedBadge: equippedCategory
            ? {
                categoryId: equippedCategory.id,
                categoryName: equippedCategory.name,
                badgeLevel,
                badgeName,
                label: `${equippedCategory.name}-${badgeName}`,
              }
            : null,
        },
      };
    };

    const decoratedReplies = allReplies.map(addEquippedBadge);
    const decoratedTopLevel = topLevelComments.map(addEquippedBadge);

    const commentTree = decoratedTopLevel.map((comment) => ({
      ...comment,
      replies: buildCommentTree(comment.id, decoratedReplies),
      userVote: userVoteMap.get(comment.userId) || null,
    }));

    return NextResponse.json({ comments: commentTree });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts/[id]/comments - Create a new comment
 * Body: { content: string, parentId?: string }
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
    const { content, parentId } = body;

    // Validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        status: true,
        mainCategoryId: true,
        totalVotes: true,
        commentCount: true,
        createdAt: true,
      },
    });

    if (!post || post.status !== 'published') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // If parentId is provided, verify it exists and belongs to the same post
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { postId: true, status: true },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        );
      }

      if (parentComment.status !== 'published') {
        return NextResponse.json(
          { error: 'Cannot reply to deleted comment' },
          { status: 400 }
        );
      }
    }

    // Create comment and update post in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create comment
      const comment = await tx.comment.create({
        data: {
          postId,
          userId: user.id,
          content: content.trim(),
          parentId: parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          parent: parentId
            ? {
                select: {
                  id: true,
                  parentId: true,
                },
              }
            : undefined,
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      // Update post comment count
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          commentCount: { increment: 1 },
        },
        select: {
          totalVotes: true,
          commentCount: true,
          createdAt: true,
        },
      });

      // Recalculate hot score
      const newHotScore = recalculateHotScore({
        totalVotes: updatedPost.totalVotes,
        commentCount: updatedPost.commentCount,
        createdAt: updatedPost.createdAt,
      });

      await tx.post.update({
        where: { id: postId },
        data: { hotScore: newHotScore },
      });

      return { comment, mainCategoryId: post.mainCategoryId };
    });

    // Award points for commenting (after transaction)
    try {
      await awardCommentPoints(db, user.id, result.mainCategoryId);
    } catch (pointsError) {
      console.error('Error awarding comment points:', pointsError);
    }

    // Get user's vote for this post to include sentiment
    const userVote = await db.vote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
      select: {
        voteType: true,
      },
    });

    return NextResponse.json({
      success: true,
      comment: {
        ...result.comment,
        userVote: userVote?.voteType || null,
      },
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

