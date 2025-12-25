// TypeScript type definitions

export interface User {
  id: string;
  username: string;
  email: string;
  // Add more user fields as needed
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  // Add more post fields as needed
}

