/**
 * API Client for making HTTP requests to Next.js API routes
 * 
 * This file abstracts all API calls using Axios. If you migrate to a separate backend later,
 * you only need to change the base URL here - all your components will continue to work.
 * 
 * Features:
 * - HttpOnly cookie support (automatic authentication via cookies)
 * - Global error handling
 * - Request timeout
 * - Automatic retry for network errors and server errors (5xx)
 * - Exponential backoff between retries
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

// Base URL for API requests
// For Next.js API routes (same origin), use empty string (relative paths)
// If migrating to separate backend, change this to: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
// Example: const API_BASE = 'http://localhost:3001';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Create Axios instance with default configuration
 * This instance will be used for all API calls
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE, // Base URL prepended to all requests (empty = same origin)
    headers: {
    'Content-Type': 'application/json', // Tell server we're sending JSON
  },
  withCredentials: true, // Include cookies in requests (needed for HttpOnly cookies)
  timeout: 10000, // Request timeout: 10 seconds (prevents hanging requests)
});

/**
 * Request Interceptor: Runs BEFORE every API request
 * 
 * Note: Authentication is handled via HttpOnly cookies (set by backend).
 * Cookies are automatically sent with requests when withCredentials: true.
 * No manual token injection needed.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Cookies are automatically included via withCredentials: true
    // No need to manually add tokens - backend reads from cookies
    return config;
  },
  (error) => {
    // If request setup fails, reject the promise
    return Promise.reject(error);
  }
);

/**
 * Retry Configuration
 * 
 * Retry logic for network errors and timeouts
 * - Retries up to 3 times for network errors (ECONNABORTED, ETIMEDOUT, network errors)
 * - Does NOT retry for 4xx errors (client errors like 400, 401, 404) - these are user errors
 * - Does retry for 5xx errors (server errors) - these might be temporary
 * - Uses exponential backoff (wait longer between each retry)
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Start with 1 second delay

/**
 * Check if error should be retried
 */
const shouldRetry = (error: AxiosError, retryCount: number): boolean => {
  // Don't retry if we've exceeded max retries
  if (retryCount >= MAX_RETRIES) {
    return false;
  }

  // Don't retry if there's no response (network error, timeout)
  if (!error.response) {
    // Retry network errors and timeouts
    return true;
  }

  const status = error.response.status;

  // Don't retry 4xx errors (client errors - user's fault)
  if (status >= 400 && status < 500) {
    return false;
  }

  // Retry 5xx errors (server errors - might be temporary)
  if (status >= 500) {
    return true;
  }

  return false;
};

/**
 * Calculate delay before retry (exponential backoff)
 * Retry 1: wait 1 second
 * Retry 2: wait 2 seconds
 * Retry 3: wait 4 seconds
 */
const getRetryDelay = (retryCount: number): number => {
  return RETRY_DELAY * Math.pow(2, retryCount);
};

/**
 * Response Interceptor: Runs AFTER every API response
 * 
 * Purpose: Handle errors globally (401, 500, etc.) and implement retry logic
 * This way, you don't need to handle errors in every component
 */
apiClient.interceptors.response.use(
  (response) => {
    // If response is successful (200-299), just return it
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as any;

    // Initialize retry count if not present
    if (!config) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    // Check if we should retry this error
    if (shouldRetry(error, config.__retryCount)) {
      config.__retryCount += 1;

      // Calculate delay before retry (exponential backoff)
      const delay = getRetryDelay(config.__retryCount - 1);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return apiClient(config);
    }

    // If we shouldn't retry, handle the error normally
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Note: HttpOnly cookies are cleared by the backend on logout
      // No need to manually clear localStorage (we don't use it for auth)
      
      // Optional: Automatically redirect to login page
      // Uncomment if you want automatic redirect:
      // window.location.href = '/login';
    }
    
    // Extract error message from response
    // Try multiple places where error message might be:
    // 1. error.response.data.error (our custom error format)
    // 2. error.response.data.message (alternative error format)
    // 3. error.message (Axios default error)
    // 4. Fallback to generic message
    const errorMessage = 
      (error.response?.data as any)?.error ||      // Our API returns { error: "..." }
      (error.response?.data as any)?.message ||     // Some APIs return { message: "..." }
      error.message ||                              // Axios error message
      'An error occurred';                          // Fallback message
    
    // Reject with error message (will be caught in component's catch block)
    return Promise.reject(new Error(errorMessage));
}
);

/**
 * API Functions Object
 * 
 * This object contains all API functions that components can use.
 * Each function uses the apiClient instance we created above.
 * 
 * Usage in components:
 *   const response = await api.login({ email, password });
 */
export const api = {
  /**
   * Login API call
   * 
   * @param credentials - Object containing email and password
   * @returns Promise with user data and success status
   * 
   * Example:
   *   const response = await api.login({ email: 'user@example.com', password: 'password123' });
   *   console.log(response.user); // { id, email, username }
   */
  login: (credentials: { email: string; password: string }) =>
    // POST request to /api/auth/login
    // apiClient.post() automatically:
    // - Adds baseURL if set
    // - Sets Content-Type to application/json
    // - Includes cookies (withCredentials: true)
    // - Adds Authorization header if token exists (from interceptor)
    apiClient.post<{ success: boolean; user: any; token?: string }>('/api/auth/login', credentials)
      // Extract data from response (response.data contains the JSON body)
      .then((response) => response.data),

  /**
   * Signup API call
   * 
   * @param data - Object containing email, password, and username
   * @returns Promise with user data and success status
   * 
   * Example:
   *   const response = await api.signup({ 
   *     email: 'user@example.com', 
   *     password: 'SecurePass123!',
   *     username: 'johndoe'
   *   });
   */
  signup: (data: { email: string; password: string; username: string }) =>
    // POST request to /api/auth/signup
    apiClient.post<{ success: boolean; user: any; token?: string }>('/api/auth/signup', data)
      // Extract data from response
      .then((response) => response.data),

  /**
   * Posts API calls
   */
  
  // GET /api/posts - Get all posts
  getPosts: (params?: { category?: string; mainCategory?: string; subCategory?: string; popular?: boolean; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.mainCategory) queryParams.append('mainCategory', params.mainCategory);
    if (params?.subCategory) queryParams.append('subCategory', params.subCategory);
    if (params?.popular) queryParams.append('popular', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return apiClient.get(`/api/posts${query ? `?${query}` : ''}`).then((response) => response.data);
  },
  
  // GET /api/posts/:id - Get single post by ID
  getPost: (id: string) =>
    apiClient.get(`/api/posts/${id}`).then((response) => response.data),
  
  // POST /api/posts - Create new post
  createPost: (data: { title: string; content: string; mainCategoryId: string; subCategoryId: string }) =>
    apiClient.post('/api/posts', data).then((response) => response.data),

  // PUT /api/posts/:id - Update existing post
  updatePost: (id: string, data: { title?: string; content?: string }) =>
    apiClient.put(`/api/posts/${id}`, data).then((response) => response.data),

  // DELETE /api/posts/:id - Delete post
  deletePost: (id: string) =>
    apiClient.delete(`/api/posts/${id}`).then((response) => response.data),

  /**
   * Votes API
   * 
   * @param postId - ID of the post to vote on
   * @param voteType - Vote type (strongly_disagree, disagree, neutral, agree, strongly_agree)
   */
  vote: (postId: string, voteType: 'strongly_disagree' | 'disagree' | 'neutral' | 'agree' | 'strongly_agree') =>
    apiClient.post(`/api/posts/${postId}/vote`, { voteType }).then((response) => response.data),
  
  /**
   * Get user's vote on a post
   * 
   * @param postId - ID of the post
   */
  getUserVote: (postId: string) =>
    apiClient.get(`/api/posts/${postId}/vote`).then((response) => response.data),

  /**
   * User/Profile API calls
   */
  
  // GET /api/user/profile - Get current user's profile (requires authentication)
  getProfile: () =>
    apiClient.get('/api/user/profile').then((response) => response.data),
  
  // PUT /api/user/profile - Update current user's profile
  updateProfile: (data: any) =>
    apiClient.put('/api/user/profile', data).then((response) => response.data),

  // GET /api/user/points - Get current user's points and badges
  getUserPoints: () =>
    apiClient.get('/api/user/points').then((response) => response.data),

  // POST /api/user/badges/equip - Equip a badge
  equipBadge: (categoryId: string) =>
    apiClient.post('/api/user/badges/equip', { categoryId }).then((response) => response.data),

  /**
   * Logout API call
   * 
   * Clears the HttpOnly cookie by calling the backend logout endpoint.
   * The backend will set the cookie to expire immediately.
   * 
   * @returns Promise with success status
   * 
   * Example:
   *   await api.logout();
   */
  logout: () =>
    apiClient.post('/api/auth/logout').then((response) => response.data),

  /**
   * Check Username Availability
   * 
   * Checks if a username is available (not already taken).
   * 
   * @param username - Username to check
   * @returns Promise with { available: boolean, message: string }
   * 
   * Example:
   *   const result = await api.checkUsername('johndoe');
   *   if (result.available) {
   *     console.log('Username is available!');
   *   }
   */
  checkUsername: (username: string) =>
    apiClient.post<{ available: boolean; message: string }>('/api/auth/check-username', { username })
      .then((response) => response.data),

  /**
   * Check Email Availability
   * 
   * Checks if an email is available (not already registered).
   * 
   * @param email - Email to check
   * @returns Promise with { available: boolean, message: string }
   * 
   * Example:
   *   const result = await api.checkEmail('user@example.com');
   *   if (result.available) {
   *     console.log('Email is available!');
   *   }
   */
  checkEmail: (email: string) =>
    apiClient.post<{ available: boolean; message: string }>('/api/auth/check-email', { email })
      .then((response) => response.data),

  /**
   * Resend Verification Email
   * 
   * Sends a new email verification link to the user.
   * Useful if user didn't receive the original email or link expired.
   * 
   * @param email - User's email address
   * @returns Promise with success status and alreadyVerified flag
   * 
   * Example:
   *   await api.resendVerification('user@example.com');
   */
  resendVerification: (email: string) =>
    apiClient.post<{ success: boolean; message: string; alreadyVerified?: boolean }>('/api/auth/resend-verification', { email })
      .then((response) => response.data),

  /**
   * Ideology API
   * 
   * @param userId - ID of user to get ideology for
   */
  getIdeology: (userId: string) =>
    apiClient.get(`/api/user/${userId}/ideology`).then((response) => response.data),

  /**
   * Categories API
   * 
   * @param params - Query parameters (mainOnly, parentId, slug)
   */
  getCategories: (params?: { mainOnly?: boolean; parentId?: string; slug?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.mainOnly) queryParams.append('mainOnly', 'true');
    if (params?.parentId) queryParams.append('parentId', params.parentId);
    if (params?.slug) queryParams.append('slug', params.slug);
    const query = queryParams.toString();
    return apiClient.get(`/api/categories${query ? `?${query}` : ''}`).then((response) => response.data);
  },
  
  /**
   * Get category by slug
   * 
   * @param slug - Category slug
   */
  getCategoryBySlug: (slug: string) =>
    apiClient.get<Category>(`/api/categories/${slug}`).then((response) => response.data),
  
  /**
   * Get user's recently viewed categories (LRU)
   * Requires authentication
   */
  getRecentCategories: () =>
    apiClient.get<{ categories: Array<Category & { lastViewedAt: string; viewCount: number }> }>('/api/user/recent-categories')
      .then((response) => response.data.categories),
};

