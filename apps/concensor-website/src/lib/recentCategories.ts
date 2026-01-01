/**
 * Recent Categories Storage (Client-side LRU)
 * 
 * Implements LRU (Least Recently Used) for recently viewed categories
 * using browser localStorage. Works for both logged-in and logged-out users.
 * 
 * Similar to how Reddit handles recent browsing for non-logged-in users.
 */

const STORAGE_KEY = 'concensor_recent_categories';
const MAX_RECENT_ITEMS = 5;

export interface RecentCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentSlug: string | null; // If sub category, store parent slug for routing
  lastViewedAt: string;
}

/**
 * Get recent categories from localStorage
 */
export function getRecentCategories(): RecentCategory[] {
  if (typeof window === 'undefined') {
    return []; // SSR: return empty array
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const categories = JSON.parse(stored) as RecentCategory[];
    // Sort by lastViewedAt (most recent first)
    return categories.sort((a, b) => 
      new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime()
    );
  } catch (error) {
    console.error('Error reading recent categories from localStorage:', error);
    return [];
  }
}

/**
 * Add or update a category in recent categories (LRU)
 * 
 * @param category - Category to add/update
 */
export function addRecentCategory(category: {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parentSlug?: string | null;
}): void {
  if (typeof window === 'undefined') {
    return; // SSR: do nothing
  }

  try {
    const recent = getRecentCategories();
    
    // Remove existing entry if it exists (to move to top)
    const filtered = recent.filter(cat => cat.id !== category.id);
    
    // Add new entry at the beginning (most recent)
    const newEntry: RecentCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || null,
      parentSlug: category.parentSlug || null,
      lastViewedAt: new Date().toISOString(),
    };
    
    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Dispatch custom event to notify sidebar of the update
    // This works for same-tab updates (storage event only works across tabs)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('recentCategoriesUpdated'));
    }
  } catch (error) {
    console.error('Error saving recent category to localStorage:', error);
  }
}

/**
 * Clear all recent categories
 */
export function clearRecentCategories(): void {
  if (typeof window === 'undefined') {
    return; // SSR: do nothing
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recent categories:', error);
  }
}

/**
 * Get category path for routing
 */
export function getCategoryPath(category: RecentCategory): string {
  // If it's a sub category (has parent), route to sub category page
  if (category.parentId && category.parentSlug) {
    return `/category/${category.parentSlug}/${category.slug}`;
  }
  // Main category
  return `/category/${category.slug}`;
}

