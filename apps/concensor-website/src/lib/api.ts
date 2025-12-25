// API client for making requests to Next.js API routes
// This abstracts the API calls so if you migrate to separate backend later,
// you only need to change the base URL here

// For Next.js API routes (same origin), use relative paths
// If migrating to separate backend, change this to: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Helper function for API calls
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// API functions
export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  signup: (data: { email: string; password: string; username: string }) =>
    apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Posts
  getPosts: () => apiRequest('/api/posts'),
  
  getPost: (id: string) => apiRequest(`/api/posts/${id}`),
  
  createPost: (data: { title: string; content: string }) =>
    apiRequest('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePost: (id: string, data: { title?: string; content?: string }) =>
    apiRequest(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePost: (id: string) =>
    apiRequest(`/api/posts/${id}`, {
      method: 'DELETE',
    }),

  // Votes (for ideology scoring)
  vote: (postId: string, vote: 'strongly_disagree' | 'disagree' | 'neutral' | 'agree' | 'strongly_agree') =>
    apiRequest(`/api/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    }),

  // User/Profile
  getProfile: () => apiRequest('/api/user/profile'),
  
  updateProfile: (data: any) =>
    apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Ideology
  getIdeology: (userId: string) => apiRequest(`/api/user/${userId}/ideology`),
};

