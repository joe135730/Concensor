/**
 * Points Service
 * 
 * Handles updating user points and badges in the database
 */

import { PrismaClient } from '@prisma/client';
import { POINTS_CONFIG, calculateBadgeLevel } from './points';

/**
 * Update user points for a specific category
 * @param db - Prisma client instance
 * @param userId - User ID
 * @param categoryId - Main category ID
 * @param pointsToAdd - Points to add (can be negative for decay)
 * @returns Updated UserCategoryPoints record
 */
export async function updateCategoryPoints(
  db: PrismaClient,
  userId: string,
  categoryId: string,
  pointsToAdd: number
) {
  // Get or create UserCategoryPoints record
  const existing = await db.userCategoryPoints.findUnique({
    where: {
      userId_categoryId: {
        userId,
        categoryId,
      },
    },
  });

  const currentPoints = existing?.points || 0;
  const newPoints = Math.max(0, currentPoints + pointsToAdd); // Don't go below 0
  // All users should have at least Rookie badge (level 1), so ensure badge level is at least 1
  const newBadgeLevel = Math.max(1, calculateBadgeLevel(newPoints));

  // Update or create UserCategoryPoints
  const updated = await db.userCategoryPoints.upsert({
    where: {
      userId_categoryId: {
        userId,
        categoryId,
      },
    },
    create: {
      userId,
      categoryId,
      points: newPoints,
      peakPoints: newPoints, // First time, so peak = current
      currentBadgeLevel: Math.max(1, newBadgeLevel), // At least Rookie badge (level 1)
      peakBadgeLevel: Math.max(1, newBadgeLevel), // At least Rookie badge (level 1)
      lastLoginDate: new Date(),
    },
    update: {
      points: newPoints,
      peakPoints: existing
        ? Math.max(existing.peakPoints, newPoints)
        : newPoints,
      currentBadgeLevel: newBadgeLevel,
      peakBadgeLevel: existing
        ? Math.max(existing.peakBadgeLevel, newBadgeLevel)
        : newBadgeLevel,
      // Note: lastLoginDate is updated separately on login
    },
  });

  return updated;
}

/**
 * Update user's total points (sum across all categories)
 * @param db - Prisma client instance
 * @param userId - User ID
 */
export async function updateTotalPoints(
  db: PrismaClient,
  userId: string
) {
  // Sum all category points for this user
  const result = await db.userCategoryPoints.aggregate({
    where: { userId },
    _sum: {
      points: true,
    },
  });

  const totalPoints = result._sum.points || 0;

  // Get current user to check peak points
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { peakPoints: true },
  });

  // Update user's total points and peak points
  await db.user.update({
    where: { id: userId },
    data: {
      points: totalPoints,
      peakPoints: user
        ? Math.max(user.peakPoints, totalPoints)
        : totalPoints,
    },
  });
}

/**
 * Award points to a user for voting
 * @param db - Prisma client instance
 * @param userId - User ID (voter)
 * @param categoryId - Main category ID of the post
 */
export async function awardVotePoints(
  db: PrismaClient,
  userId: string,
  categoryId: string
) {
  await updateCategoryPoints(db, userId, categoryId, POINTS_CONFIG.VOTE);
  await updateTotalPoints(db, userId);
}

/**
 * Award points to a user for creating a post
 * @param db - Prisma client instance
 * @param userId - User ID (post author)
 * @param categoryId - Main category ID of the post
 */
export async function awardPostPoints(
  db: PrismaClient,
  userId: string,
  categoryId: string
) {
  await updateCategoryPoints(db, userId, categoryId, POINTS_CONFIG.POST);
  await updateTotalPoints(db, userId);
}

/**
 * Award points to a user for commenting (future use)
 * @param db - Prisma client instance
 * @param userId - User ID (commenter)
 * @param categoryId - Main category ID of the post
 */
export async function awardCommentPoints(
  db: PrismaClient,
  userId: string,
  categoryId: string
) {
  await updateCategoryPoints(db, userId, categoryId, POINTS_CONFIG.COMMENT);
  await updateTotalPoints(db, userId);
}

