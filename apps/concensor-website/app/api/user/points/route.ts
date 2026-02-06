/**
 * User Points API
 * GET /api/user/points - Get current user's points and badges
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getBadgeName } from '@/lib/points';

/**
 * GET /api/user/points - Get current user's points and badges
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's category points with category details
    const categoryPoints = await db.userCategoryPoints.findMany({
      where: { userId: user.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
    });

    // Format response
    const formattedCategoryPoints = categoryPoints.map((cp) => ({
      categoryId: cp.categoryId,
      category: cp.category,
      points: cp.points,
      peakPoints: cp.peakPoints,
      currentBadgeLevel: cp.currentBadgeLevel,
      currentBadgeName: getBadgeName(cp.currentBadgeLevel),
      peakBadgeLevel: cp.peakBadgeLevel,
      peakBadgeName: getBadgeName(cp.peakBadgeLevel),
      lastLoginDate: cp.lastLoginDate,
    }));

    return NextResponse.json({
      totalPoints: user.points,
      peakPoints: user.peakPoints,
      equippedBadgeCategoryId: user.equippedBadgeCategoryId,
      categoryPoints: formattedCategoryPoints,
    });
  } catch (error: any) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user points' },
      { status: 500 }
    );
  }
}

