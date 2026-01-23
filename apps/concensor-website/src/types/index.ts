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
  description?: string | null;
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

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string | null;
    profilePicture: string | null;
  };
  replies?: Comment[];
  _count?: {
    replies: number;
  };
  // For display purposes
  commentNumber?: string; // B1, B1-1, B1-2, etc.
  replyToNumber?: string; // B1-1 if replying to B1-1
}

