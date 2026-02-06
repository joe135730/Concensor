/**
 * Badge Initialization Service
 * 
 * Handles initializing Rookie badges for new users
 */

import { PrismaClient } from '@prisma/client';
import { calculateBadgeLevel } from './points';

/**
 * Initialize Rookie badges for a new user in all main categories
 * This should be called when a user signs up
 * @param db - Prisma client instance
 * @param userId - User ID
 */
export async function initializeRookieBadges(
  db: PrismaClient,
  userId: string
) {
  // Get all main categories (categories with no parent)
  const mainCategories = await db.category.findMany({
    where: {
      parentId: null,
    },
    select: {
      id: true,
    },
  });

  // Create UserCategoryPoints records with Rookie badge (level 1) for all categories
  const badgeRecords = mainCategories.map((category) => ({
    userId,
    categoryId: category.id,
    points: 0, // Start with 0 points
    peakPoints: 0,
    currentBadgeLevel: 1, // Rookie badge (level 1) by default
    peakBadgeLevel: 1,
    lastLoginDate: new Date(),
  }));

  // Use createMany for better performance
  if (badgeRecords.length > 0) {
    await db.userCategoryPoints.createMany({
      data: badgeRecords,
      skipDuplicates: true, // Skip if record already exists (idempotent)
    });
  }
}

