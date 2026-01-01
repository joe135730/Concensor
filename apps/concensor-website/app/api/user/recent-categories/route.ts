// Recent Categories API route
// GET /api/user/recent-categories - Get user's recently viewed categories (LRU)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * Helper function to get authenticated user from request
 */
async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.tokenVersion !== payload.tokenVersion) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * GET /api/user/recent-categories
 * 
 * Returns user's recently viewed categories (LRU), ordered by lastViewedAt (most recent first)
 * Returns both main and sub categories that the user has viewed
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's recently viewed categories (LRU)
    // Order by lastViewedAt descending (most recent first)
    // Note: UserCategoryView only tracks main categories currently
    const recentViews = await (db as any).userCategoryView.findMany({
      where: { userId: user.id },
      include: {
        category: {
          include: {
            parent: true,
            children: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastViewedAt: 'desc',
      },
      take: 5, // Limit to 5 most recent
    });

    // Format the response
    // Note: Currently only main categories are tracked
    const categories = recentViews.map((view: any) => ({
      id: view.category.id,
      name: view.category.name,
      slug: view.category.slug,
      parentId: view.category.parentId || null,
      parent: null, // Main categories don't have parents
      lastViewedAt: view.lastViewedAt.toISOString(),
      viewCount: view.viewCount,
    }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching recent categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent categories', details: error.message },
      { status: 500 }
    );
  }
}

