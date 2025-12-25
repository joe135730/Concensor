'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// Custom hook for authentication
export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (check localStorage, cookies, etc.)
    // TODO: Implement session check
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      setUser(response.user);
      setIsAuthenticated(true);
      // TODO: Store token in localStorage/cookies
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // TODO: Clear token from localStorage/cookies
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };
};

