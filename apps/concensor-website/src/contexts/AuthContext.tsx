'use client';

/**
 * Authentication Context
 * 
 * Provides global authentication state to all components.
 * Uses HttpOnly cookies for authentication (set by backend).
 * 
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Check if user is authenticated by calling API
   * Since we use HttpOnly cookies, we can't check localStorage
   * We need to call the backend to verify the token
   */
  const checkAuth = async () => {
    try {
      // Call API to get current user profile
      // This will fail if token is invalid/expired
      const response = await api.getProfile();
      // API returns { user: {...} } or just user object
      const userData = response.user || response;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Token invalid or expired
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Login function
   * Calls API, sets user state, and redirects to home page
   */
  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    setUser(response.user);
    setIsAuthenticated(true);
    // Use replace() instead of push() to avoid adding to history
    // This prevents the login page from being in browser history
    // and makes the redirect faster (no glitch)
    router.replace('/'); // Redirect to home page after login
  };

  /**
   * Logout function
   * Calls backend API to clear HttpOnly cookie, then clears user state and redirects
   * Also clears localStorage recent categories (like Reddit - logout clears recent)
   */
  const logout = async () => {
    try {
      // Call logout API endpoint to clear HttpOnly cookie
      // This is required because HttpOnly cookies can only be cleared by the server
      await api.logout();
    } catch (error) {
      // Even if API call fails, clear local state
      // This ensures UI updates even if network request fails
      console.error('Logout error:', error);
    }
    
    // Clear localStorage recent categories on logout (like Reddit)
    // This ensures user doesn't see previous account's recent categories
    if (typeof window !== 'undefined') {
      try {
        const { clearRecentCategories } = await import('@/lib/recentCategories');
        clearRecentCategories();
      } catch (err) {
        // Ignore errors if module fails to load
        console.error('Failed to clear recent categories on logout:', err);
      }
    }
    
    // Clear user state (regardless of API call success/failure)
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to landing page
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * 
 * Usage in components:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

