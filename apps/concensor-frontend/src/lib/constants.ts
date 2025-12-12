// Application constants
// Next.js uses process.env for environment variables
// Create a .env.local file in the root with: NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

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

