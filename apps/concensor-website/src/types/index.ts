// TypeScript type definitions

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string; // Optional profile picture URL
  // Add more user fields as needed
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    username: string | null;
    profilePicture: string | null;
  };
  mainCategoryId: string;
  mainCategory: Category;
  subCategoryId: string;
  subCategory: Category;
  status: string;
  // Vote counts
  stronglyAgreeCount: number;
  agreeCount: number;
  neutralCount: number;
  disagreeCount: number;
  stronglyDisagreeCount: number;
  weightedScore: number;
  // Engagement counts
  totalVotes: number;
  commentCount: number;
  viewCount: number;
  // Popularity
  hotScore: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    votes: number;
    comments: number;
  };
}

