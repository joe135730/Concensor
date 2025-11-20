// Application constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  POST_DETAILS: '/post/:id',
  POST_MANAGEMENT: '/posts/manage',
  DASHBOARD: '/dashboard',
  ANALYSIS: '/analysis',
};

