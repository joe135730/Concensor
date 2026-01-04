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
    const userCategoryPoints = await db.userCategoryPoints.findUnique({
      where: {
        userId_categoryId: {
          userId: user.id,
          categoryId,
        },
      },
    });

    if (!userCategoryPoints || userCategoryPoints.currentBadgeLevel === 0) {
      return NextResponse.json(
        { error: 'You do not have a badge in this category yet' },
        { status: 400 }
      );
    }

    // Update user's equipped badge
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        equippedBadgeCategoryId: categoryId,
      },
      select: {
        id: true,
        equippedBadgeCategoryId: true,
      },
    });

    return NextResponse.json({
      success: true,
      equippedBadgeCategoryId: updatedUser.equippedBadgeCategoryId,
    });
  } catch (error: any) {
    console.error('Error equipping badge:', error);
    return NextResponse.json(
      { error: 'Failed to equip badge' },
      { status: 500 }
    );
  }
}

