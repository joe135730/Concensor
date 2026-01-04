/**
 * Equip Badge API
 * POST /api/user/badges/equip - Equip a badge for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/user/badges/equip - Equip a badge
 * Body: { categoryId: string }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Verify category exists and is a main category
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category.parentId) {
      return NextResponse.json(
        { error: 'Only main categories can have badges equipped' },
        { status: 400 }
      );
    }

    // Check if user has a badge in this category
    // Get or create UserCategoryPoints (should exist with Rookie badge, but create if missing)
    let userCategoryPoints = await db.userCategoryPoints.findUnique({
      where: {
        userId_categoryId: {
          userId: user.id,
          categoryId,
        },
      },
    });

    // If no record exists, create one with Rookie badge (level 1)
    if (!userCategoryPoints) {
      userCategoryPoints = await db.userCategoryPoints.create({
        data: {
          userId: user.id,
          categoryId,
          points: 0,
          peakPoints: 0,
          currentBadgeLevel: 1, // Rookie badge by default
          peakBadgeLevel: 1,
          lastLoginDate: new Date(),
        },
      });
    }

    // Users should always have at least Rookie badge (level 1), but check just in case
    if (userCategoryPoints.currentBadgeLevel === 0) {
      // Update to Rookie badge if somehow at level 0
      userCategoryPoints = await db.userCategoryPoints.update({
        where: {
          userId_categoryId: {
            userId: user.id,
            categoryId,
          },
        },
        data: {
          currentBadgeLevel: 1,
          peakBadgeLevel: Math.max(1, userCategoryPoints.peakBadgeLevel),
        },
      });
    }

    // Toggle equipped badge: if already equipped, unequip it; otherwise, equip it
    const isCurrentlyEquipped = user.equippedBadgeCategoryId === categoryId;
    const newEquippedBadgeCategoryId = isCurrentlyEquipped ? null : categoryId;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        equippedBadgeCategoryId: newEquippedBadgeCategoryId,
      },
      select: {
        id: true,
        equippedBadgeCategoryId: true,
      },
    });

    return NextResponse.json({
      success: true,
      equippedBadgeCategoryId: updatedUser.equippedBadgeCategoryId,
      action: isCurrentlyEquipped ? 'unequipped' : 'equipped',
    });
  } catch (error: any) {
    console.error('Error equipping badge:', error);
    return NextResponse.json(
      { error: 'Failed to equip badge' },
      { status: 500 }
    );
  }
}

