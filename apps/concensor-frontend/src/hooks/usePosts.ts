'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// Custom hook for posts
export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPosts();
      setPosts(data.posts || []);
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const createPost = async (title: string, content: string) => {
    try {
      const newPost = await api.createPost({ title, content });
      setPosts([newPost, ...posts]);
      return newPost;
    } catch (err) {
      throw err;
    }
  };

  const updatePost = async (id: string, data: { title?: string; content?: string }) => {
    try {
      await api.updatePost(id, data);
      await fetchPosts(); // Refresh list
    } catch (err) {
      throw err;
    }
  };

  const deletePost = async (id: string) => {
    try {
      await api.deletePost(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    refetch: fetchPosts,
  };
};

