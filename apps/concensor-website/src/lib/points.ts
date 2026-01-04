/**
 * Points & Badge System
 * 
 * Handles:
 * - Points calculation and thresholds
 * - Badge level determination
 * - Badge decay calculation
 */

// ============================================
// POINTS CONFIGURATION
// ============================================

/**
 * Points awarded for different actions
 */
export const POINTS_CONFIG = {
  VOTE: 1,           // Points for voting on a post
  POST: 5,           // Points for creating a post
  COMMENT: 2,        // Points for commenting (future)
} as const;

/**
 * Badge level thresholds (points required)
 * Badge levels: 0 = no badge, 1 = Rookie, 2 = Apprentice, 3 = Expert, 4 = Master, 5 = Legend
 */
export const BADGE_THRESHOLDS = {
  ROOKIE: 50,        // Level 1: 50-99 points
  APPRENTICE: 100,   // Level 2: 100-249 points
  EXPERT: 250,       // Level 3: 250-499 points
  MASTER: 500,       // Level 4: 500-999 points
  LEGEND: 1000,      // Level 5: 1000+ points
} as const;

/**
 * Badge level names
 */
export const BADGE_NAMES = {
  0: 'No Badge',
  1: 'Rookie',
  2: 'Apprentice',
  3: 'Expert',
  4: 'Master',
  5: 'Legend',
} as const;

// ============================================
// BADGE LEVEL CALCULATION
// ============================================

/**
 * Calculate badge level based on points
 * @param points - Current points in category
 * @returns Badge level (0-5)
 */
export function calculateBadgeLevel(points: number): number {
  if (points < BADGE_THRESHOLDS.ROOKIE) {
    return 0; // No badge
  } else if (points < BADGE_THRESHOLDS.APPRENTICE) {
    return 1; // Rookie
  } else if (points < BADGE_THRESHOLDS.EXPERT) {
    return 2; // Apprentice
  } else if (points < BADGE_THRESHOLDS.MASTER) {
    return 3; // Expert
  } else if (points < BADGE_THRESHOLDS.LEGEND) {
    return 4; // Master
  } else {
    return 5; // Legend
  }
}

/**
 * Get badge name for a given level
 * @param level - Badge level (0-5)
 * @returns Badge name string
 */
export function getBadgeName(level: number): string {
  if (level < 0 || level > 5) {
    return BADGE_NAMES[0];
  }
  return BADGE_NAMES[level as keyof typeof BADGE_NAMES] || BADGE_NAMES[0];
}

/**
 * Get points required for next badge level
 * @param currentLevel - Current badge level (0-5)
 * @returns Points required for next level, or null if already at max level
 */
export function getPointsForNextLevel(currentLevel: number): number | null {
  switch (currentLevel) {
    case 0:
      return BADGE_THRESHOLDS.ROOKIE;
    case 1:
      return BADGE_THRESHOLDS.APPRENTICE;
    case 2:
      return BADGE_THRESHOLDS.EXPERT;
    case 3:
      return BADGE_THRESHOLDS.MASTER;
    case 4:
      return BADGE_THRESHOLDS.LEGEND;
    case 5:
      return null; // Already at max level
    default:
      return BADGE_THRESHOLDS.ROOKIE;
  }
}

// ============================================
// BADGE DECAY CONFIGURATION
// ============================================

/**
 * Decay configuration
 */
export const DECAY_CONFIG = {
  DAYS_BEFORE_DECAY: 7,        // Start decaying after 7 days of inactivity
  DECAY_RATE: 0.02,            // 2% decay per day after threshold
  MIN_POINTS_DECAY: 10,        // Don't decay below this many points
  MAX_DAYS_DECAY: 30,          // Maximum days to calculate decay for (prevents excessive decay)
} as const;

/**
 * Calculate badge decay based on last login date
 * @param currentPoints - Current points in category
 * @param lastLoginDate - Last login date (null if never logged in)
 * @param currentDate - Current date (defaults to now)
 * @returns New points after decay, or null if no decay needed
 */
export function calculateBadgeDecay(
  currentPoints: number,
  lastLoginDate: Date | null,
  currentDate: Date = new Date()
): number {
  // If no last login date, no decay (new user)
  if (!lastLoginDate) {
    return currentPoints;
  }

  // Calculate days since last login
  const daysSinceLogin = Math.floor(
    (currentDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // No decay if within threshold
  if (daysSinceLogin < DECAY_CONFIG.DAYS_BEFORE_DECAY) {
    return currentPoints;
  }

  // Calculate decay days (days beyond threshold, capped at max)
  const decayDays = Math.min(
    daysSinceLogin - DECAY_CONFIG.DAYS_BEFORE_DECAY,
    DECAY_CONFIG.MAX_DAYS_DECAY
  );

  // Calculate decay: points * (1 - decayRate) ^ decayDays
  // This applies compound decay
  const decayMultiplier = Math.pow(1 - DECAY_CONFIG.DECAY_RATE, decayDays);
  let newPoints = Math.floor(currentPoints * decayMultiplier);

  // Don't decay below minimum
  if (newPoints < DECAY_CONFIG.MIN_POINTS_DECAY && currentPoints >= DECAY_CONFIG.MIN_POINTS_DECAY) {
    newPoints = DECAY_CONFIG.MIN_POINTS_DECAY;
  } else if (currentPoints < DECAY_CONFIG.MIN_POINTS_DECAY) {
    // If already below minimum, don't change
    newPoints = currentPoints;
  }

  return newPoints;
}

/**
 * Calculate total points decay for user (across all categories)
 * @param categoryPoints - Array of { points, lastLoginDate } for each category
 * @param currentDate - Current date (defaults to now)
 * @returns Total points after decay
 */
export function calculateTotalPointsDecay(
  categoryPoints: Array<{ points: number; lastLoginDate: Date | null }>,
  currentDate: Date = new Date()
): number {
  return categoryPoints.reduce((total, cp) => {
    const decayedPoints = calculateBadgeDecay(cp.points, cp.lastLoginDate, currentDate);
    return total + decayedPoints;
  }, 0);
}

