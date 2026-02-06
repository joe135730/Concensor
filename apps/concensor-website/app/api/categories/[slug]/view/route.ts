// Category View Tracking API route
// POST /api/categories/[slug]/view - Track user viewing a category (for LRU)

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
 * POST /api/categories/[slug]/view
 * 
 * Tracks that a user has viewed a category (for LRU).
 * If viewing a sub category, tracks the main category.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    
    // Only track if user is authenticated
    if (!user) {
      return NextResponse.json({ success: true }); // Silent success for unauthenticated users
    }

    const { slug } = params;

    // Get the category
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        parent: true, // Include parent to determine if it's a sub category
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Determine the main category ID
    // If this is a sub category, use its parent (main category)
    // If this is a main category, use itself
    const mainCategoryId = category.parentId || category.id;

    // Update or create UserCategoryView record (LRU)
    await (db as any).userCategoryView.upsert({
      where: {
        userId_categoryId: {
          userId: user.id,
          categoryId: mainCategoryId,
        },
      },
      update: {
        lastViewedAt: new Date(),
        viewCount: { increment: 1 },
      },
      create: {
        userId: user.id,
        categoryId: mainCategoryId,
        lastViewedAt: new Date(),
        viewCount: 1,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking category view:', error);
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: true });
  }
}

