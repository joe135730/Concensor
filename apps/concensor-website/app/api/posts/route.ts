// Posts API routes
// This handles all post-related operations

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { calculateHotScore, recalculateHotScore } from '@/lib/hotScore';
import { awardPostPoints } from '@/lib/pointsService';

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
 * GET /api/posts - Get all posts
 * 
 * Query parameters:
 * - category: Filter by category slug (main or sub)
 * - mainCategory: Filter by main category slug
 * - subCategory: Filter by sub category slug
 * - popular: Sort by hot score (popular posts)
 * - page: Page number (default: 1)
 * - limit: Posts per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const mainCategorySlug = searchParams.get('mainCategory');
    const subCategorySlug = searchParams.get('subCategory');
    const popular = searchParams.get('popular') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'published',
    };

    // Filter by category
    if (categorySlug) {
      const category = await db.category.findUnique({
        where: { slug: categorySlug },
      });

      if (category) {
        if (category.parentId) {
          // Sub category
          where.subCategoryId = category.id;
        } else {
          // Main category - get all sub categories
          const subCategories = await db.category.findMany({
            where: { parentId: category.id },
            select: { id: true },
          });
          const subCategoryIds = subCategories.map((c: { id: string }) => c.id);
          where.mainCategoryId = category.id;
        }
      }
    }

    // Filter by main category
    if (mainCategorySlug) {
      const mainCategory = await db.category.findUnique({
        where: { slug: mainCategorySlug },
      });
      if (mainCategory && !mainCategory.parentId) {
        where.mainCategoryId = mainCategory.id;
      }
    }

    // Filter by sub category
    if (subCategorySlug) {
      const subCategory = await db.category.findUnique({
        where: { slug: subCategorySlug },
      });
      if (subCategory && subCategory.parentId) {
        where.subCategoryId = subCategory.id;
      }
    }

    // If sorting by popular, we need to recalculate hot scores for accurate ranking
    // Hot scores decay over time, so we recalculate them on-the-fly for popular queries
    let posts;
    let total;

    if (popular) {
      // For popular posts, fetch all matching posts first, then recalculate and sort
      const allPosts = await db.post.findMany({
        where,
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

      // Recalculate hot scores for all posts (since they decay over time)
      const postsWithRecalculatedScores = allPosts.map((post) => {
        const recalculatedHotScore = recalculateHotScore({
          totalVotes: post.totalVotes,
          commentCount: post.commentCount,
          createdAt: post.createdAt,
        });
        return {
          ...post,
          hotScore: recalculatedHotScore,
        };
      });

      // Sort by recalculated hot score (descending)
      postsWithRecalculatedScores.sort((a, b) => b.hotScore - a.hotScore);

      // Apply pagination
      total = postsWithRecalculatedScores.length;
      posts = postsWithRecalculatedScores.slice(skip, skip + limit);
    } else {
      // For non-popular queries, use database sorting
      const orderBy = { createdAt: 'desc' as const };

      const [fetchedPosts, fetchedTotal] = await Promise.all([
        db.post.findMany({
          where,
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
          orderBy,
          skip,
          take: limit,
        }),
        db.post.count({ where }),
      ]);

      posts = fetchedPosts;
      total = fetchedTotal;
    }

    return NextResponse.json({
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch posts',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts - Create a new post
 * 
 * Body:
 * - title: string (required)
 * - content: string (required)
 * - mainCategoryId: string (required)
 * - subCategoryId: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, mainCategoryId, subCategoryId } = body;

    // Validation
    if (!title || !content || !mainCategoryId || !subCategoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, mainCategoryId, subCategoryId' },
        { status: 400 }
      );
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title and content cannot be empty' },
        { status: 400 }
      );
    }

    // Verify categories exist and sub belongs to main
    const [mainCategory, subCategory] = await Promise.all([
      db.category.findUnique({ where: { id: mainCategoryId } }),
      db.category.findUnique({ where: { id: subCategoryId } }),
    ]);

    if (!mainCategory || !subCategory) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (subCategory.parentId !== mainCategoryId) {
      return NextResponse.json(
        { error: 'Sub category does not belong to main category' },
        { status: 400 }
      );
    }

    // Calculate initial hot score (new post has 0 votes and 0 comments)
    const initialHotScore = calculateHotScore(0, 0, new Date());

    // Create post
    const post = await db.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        mainCategoryId,
        subCategoryId,
        status: 'published',
        hotScore: initialHotScore,
      },
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
      },
    });

    // Award points to the post author
    try {
      await awardPostPoints(db, user.id, mainCategoryId);
    } catch (pointsError) {
      // Log error but don't fail the post creation
      // Points can be recalculated if needed
      console.error('Error awarding post points:', pointsError);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
