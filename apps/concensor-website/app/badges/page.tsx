'use client';

/**
 * Badges Page
 * 
 * Route: /badges
 * Shows all badges for all categories, which are achieved and which are not.
 * Allows users to equip badges.
 * Requires authentication.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ProfileSidebar from '@/components/common/ProfileSidebar';
import { api } from '@/lib/api';
import { Category } from '@/types';
import { BADGE_NAMES, BADGE_THRESHOLDS, getPointsForNextLevel } from '@/lib/points';
import './page.css';

interface CategoryPoints {
  categoryId: string;
  category: Category;
  points: number;
  peakPoints: number;
  currentBadgeLevel: number;
  currentBadgeName: string;
  peakBadgeLevel: number;
  peakBadgeName: string;
}

interface BadgeData {
  category: Category;
  userPoints: CategoryPoints | null;
  equipped: boolean;
}

export default function BadgesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [equippedBadgeCategoryId, setEquippedBadgeCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [equipping, setEquipping] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch badges data
  useEffect(() => {
    const fetchBadges = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError('');

        // Fetch all main categories and user's points
        const categoriesData = await api.getCategories({ mainOnly: true });
        const categories = Array.isArray(categoriesData) ? categoriesData : [];
        
        // Try to get points data
        try {
          const pointsResponse = await fetch('/api/user/points', { credentials: 'include' });
          if (pointsResponse.ok) {
            const pointsData = await pointsResponse.json();
            setEquippedBadgeCategoryId(pointsData.equippedBadgeCategoryId || null);
            
            // Create a map of category points
            const pointsMap = new Map<string, CategoryPoints>();
            pointsData.categoryPoints?.forEach((cp: CategoryPoints) => {
              pointsMap.set(cp.categoryId, cp);
            });

            // Combine categories with user points
            // If no UserCategoryPoints record exists, create a default one with Rookie badge
            const badgesData: BadgeData[] = categories.map((category: Category) => {
              const userPoints = pointsMap.get(category.id);
              if (!userPoints) {
                // Create default Rookie badge entry
                return {
                  category,
                  userPoints: {
                    categoryId: category.id,
                    category: category,
                    points: 0,
                    peakPoints: 0,
                    currentBadgeLevel: 1, // Rookie badge
                    currentBadgeName: 'Rookie',
                    peakBadgeLevel: 1,
                    peakBadgeName: 'Rookie',
                    lastLoginDate: null,
                  } as CategoryPoints,
                  equipped: category.id === pointsData.equippedBadgeCategoryId,
                };
              }
              return {
                category,
                userPoints,
                equipped: category.id === pointsData.equippedBadgeCategoryId,
              };
            });

            setBadges(badgesData);
          } else {
            throw new Error('Failed to fetch points');
          }
        } catch (err) {
          // If points fetch fails, still show categories without user data
          const badgesData: BadgeData[] = categories.map((category: Category) => ({
            category,
            userPoints: null,
            equipped: false,
          }));
          setBadges(badgesData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load badges');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBadges();
    }
  }, [isAuthenticated]);

  const handleEquipBadge = async (categoryId: string, badgeLevel: number) => {
    if (equipping) return; // Prevent multiple simultaneous requests

    try {
      setEquipping(categoryId);
      
      const data = await api.equipBadge(categoryId);
      const newEquippedId = data.equippedBadgeCategoryId;
      setEquippedBadgeCategoryId(newEquippedId);

      // Update local state - only the clicked category should be equipped
      setBadges(prev => prev.map(badge => ({
        ...badge,
        equipped: badge.category.id === categoryId && newEquippedId === categoryId,
      })));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle badge');
    } finally {
      setEquipping(null);
    }
  };

  const getBadgeStatus = (badgeLevel: number, userPoints: CategoryPoints | null) => {
    // Rookie (level 1) is always achieved (default for all users)
    if (badgeLevel === 1) {
      return { achieved: true, isCurrent: !userPoints || userPoints.currentBadgeLevel === 1 };
    }
    
    if (!userPoints) {
      return { achieved: false, isCurrent: false };
    }
    
    const achieved = userPoints.currentBadgeLevel >= badgeLevel;
    const isCurrent = userPoints.currentBadgeLevel === badgeLevel;
    
    return { achieved, isCurrent };
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="badges-page">
          <div className="loading">Loading badges...</div>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="badges-page">
          <div className="error">{error}</div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="badges-page">
        <div className="badges-page-content">
          <ProfileSidebar />
          <main className={`badges-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="badges-container">
              <h1 className="badges-title">My Badges</h1>
              <p className="badges-subtitle">
                Earn badges by participating in discussions. Equip your favorite badge to display on your profile.
              </p>

              <div className="badges-grid">
                {badges.map((badgeData) => {
                  const { category, userPoints, equipped } = badgeData;
                  const currentLevel = userPoints?.currentBadgeLevel || 0;

                  return (
                    <div key={category.id} className="badge-category-card">
                      <h2 className="badge-category-name">{category.name}</h2>
                      <div className="badge-category-info">
                        {userPoints ? (
                          <>
                            <div className="badge-category-points">
                              <span className="points-label">Current Points:</span>
                              <span className="points-value">{userPoints.points}</span>
                            </div>
                            <div className="badge-category-level">
                              <span className="level-label">Current Badge:</span>
                              <span className="level-value">{userPoints.currentBadgeName}</span>
                            </div>
                            {(() => {
                              const nextLevelPoints = getPointsForNextLevel(userPoints.currentBadgeLevel);
                              if (nextLevelPoints === null) {
                                // Already at max level (Legend)
                                return (
                                  <div className="badge-progress-section">
                                    <div className="badge-progress-header">
                                      <span className="badge-progress-label">Max Level Achieved!</span>
                                    </div>
                                    <div className="badge-progress-bar-container">
                                      <div className="badge-progress-bar" style={{ width: '100%' }}>
                                        <div className="badge-progress-fill max-level" style={{ width: '100%' }}></div>
                                      </div>
                                    </div>
                                    <div className="badge-progress-text">
                                      <span>Legend Badge - {userPoints.points} points</span>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Calculate progress from current level start to next level
                              // For Rookie (level 1), start is 0
                              const currentLevelStart = userPoints.currentBadgeLevel === 1 
                                ? 0 
                                : userPoints.currentBadgeLevel === 2
                                ? BADGE_THRESHOLDS.APPRENTICE
                                : userPoints.currentBadgeLevel === 3
                                ? BADGE_THRESHOLDS.EXPERT
                                : userPoints.currentBadgeLevel === 4
                                ? BADGE_THRESHOLDS.MASTER
                                : BADGE_THRESHOLDS.LEGEND;
                              
                              const progressRange = nextLevelPoints - currentLevelStart;
                              const currentProgress = userPoints.points - currentLevelStart;
                              const progressPercentage = Math.min(100, Math.max(0, (currentProgress / progressRange) * 100));
                              const pointsNeeded = nextLevelPoints - userPoints.points;
                              const nextBadgeName = BADGE_NAMES[(userPoints.currentBadgeLevel + 1) as keyof typeof BADGE_NAMES];

                              return (
                                <div className="badge-progress-section">
                                  <div className="badge-progress-header">
                                    <span className="badge-progress-label">Progress to {nextBadgeName}</span>
                                    <span className="badge-progress-percentage">{Math.round(progressPercentage)}%</span>
                                  </div>
                                  <div className="badge-progress-bar-container">
                                    <div className="badge-progress-bar">
                                      <div 
                                        className="badge-progress-fill" 
                                        style={{ width: `${progressPercentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="badge-progress-text">
                                    <span>{userPoints.points} / {nextLevelPoints} points</span>
                                    <span className="badge-progress-remaining">
                                      {pointsNeeded > 0 ? `${pointsNeeded} points to go` : 'Level up!'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          <>
                            <div className="badge-category-points">
                              <span className="points-label">Current Points:</span>
                              <span className="points-value">0</span>
                            </div>
                            <div className="badge-category-level">
                              <span className="level-label">Current Badge:</span>
                              <span className="level-value">Rookie</span>
                            </div>
                            <div className="badge-progress-section">
                              <div className="badge-progress-header">
                                <span className="badge-progress-label">Progress to Apprentice</span>
                                <span className="badge-progress-percentage">0%</span>
                              </div>
                              <div className="badge-progress-bar-container">
                                <div className="badge-progress-bar">
                                  <div className="badge-progress-fill" style={{ width: '0%' }}></div>
                                </div>
                              </div>
                              <div className="badge-progress-text">
                                <span>0 / {BADGE_THRESHOLDS.APPRENTICE} points</span>
                                <span className="badge-progress-remaining">
                                  {BADGE_THRESHOLDS.APPRENTICE} points to go
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="badge-levels">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const { achieved, isCurrent } = getBadgeStatus(level, userPoints);
                          const badgeName = BADGE_NAMES[level as keyof typeof BADGE_NAMES];
                          const pointsRequired = level === 1 
                            ? BADGE_THRESHOLDS.ROOKIE 
                            : level === 2 
                            ? BADGE_THRESHOLDS.APPRENTICE
                            : level === 3
                            ? BADGE_THRESHOLDS.EXPERT
                            : level === 4
                            ? BADGE_THRESHOLDS.MASTER
                            : BADGE_THRESHOLDS.LEGEND;
                          const nextPoints = getPointsForNextLevel(level - 1);
                          const pointsNeeded = userPoints && nextPoints 
                            ? Math.max(0, nextPoints - userPoints.points)
                            : pointsRequired;

                          return (
                            <div
                              key={level}
                              className={`badge-level-item ${achieved ? 'achieved' : 'locked'} ${isCurrent ? 'current' : ''} ${equipped && isCurrent ? 'equipped' : ''}`}
                            >
                              <div className="badge-level-header">
                                <span className="badge-level-name">{badgeName}</span>
                                {achieved && (
                                  <span className="badge-level-badge">✓</span>
                                )}
                                {!achieved && (
                                  <span className="badge-level-lock">🔒</span>
                                )}
                              </div>
                              <div className="badge-level-requirements">
                                {level === 1 ? (
                                  <span className="badge-requirement-text">Default badge for all users</span>
                                ) : achieved ? (
                                  <span className="badge-requirement-text">Requires {pointsRequired} points</span>
                                ) : (
                                  <span className="badge-requirement-text">
                                    {userPoints 
                                      ? `Need ${pointsNeeded} more points`
                                      : `Requires ${pointsRequired} points`
                                    }
                                  </span>
                                )}
                              </div>
                              {achieved && (
                                <button
                                  className={`badge-equip-button ${equipped && isCurrent ? 'equipped unequip' : ''}`}
                                  onClick={() => handleEquipBadge(category.id, level)}
                                  disabled={equipping === category.id}
                                >
                                  {equipping === category.id 
                                    ? '...' 
                                    : equipped && isCurrent 
                                    ? '✓ Equipped - Click to Unequip' 
                                    : 'Equip Badge'
                                  }
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}

