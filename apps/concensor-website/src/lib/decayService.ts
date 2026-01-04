/**
 * Badge Decay Service
 * 
 * Handles applying badge decay when users log in
 */

import { PrismaClient } from '@prisma/client';
import { calculateBadgeDecay, calculateBadgeLevel } from './points';
import { updateTotalPoints } from './pointsService';

/**
 * Apply badge decay for a user on login
 * This should be called whenever a user logs in
 * @param db - Prisma client instance
 * @param userId - User ID
 * @param currentDate - Current date (defaults to now)
 */
export async function applyBadgeDecayOnLogin(
  db: PrismaClient,
  userId: string,
  currentDate: Date = new Date()
) {
  // Get user with category points
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      categoryPoints: true,
    },
  });

  if (!user) {
    return;
  }

  // Apply decay to each category
  const updates = user.categoryPoints.map(async (cp) => {
    const decayedPoints = calculateBadgeDecay(
      cp.points,
      cp.lastLoginDate,
      currentDate
    );

    // Only update if points changed (decay occurred)
    if (decayedPoints !== cp.points) {
      const newBadgeLevel = calculateBadgeLevel(decayedPoints);

      await db.userCategoryPoints.update({
        where: { id: cp.id },
        data: {
          points: decayedPoints,
          currentBadgeLevel: newBadgeLevel,
          // Note: peakPoints and peakBadgeLevel are not affected by decay
          lastLoginDate: currentDate,
        },
      });
    } else {
      // Even if no decay, update lastLoginDate
      await db.userCategoryPoints.update({
        where: { id: cp.id },
        data: {
          lastLoginDate: currentDate,
        },
      });
    }
  });

  await Promise.all(updates);

  // Update user's total points and lastLoginDate
  await updateTotalPoints(db, userId);
  await db.user.update({
    where: { id: userId },
    data: {
      lastLoginDate: currentDate,
    },
  });
}

