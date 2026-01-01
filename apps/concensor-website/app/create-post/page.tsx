'use client';

/**
 * Create Post Page
 * 
 * Allows authenticated users to create new posts.
 * Route: /create-post
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import './page.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
}

export default function CreatePostPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mainCategoryId, setMainCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch main categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/categories?mainOnly=true');
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        const categories = await response.json();
        setMainCategories(categories);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load categories. Please refresh the page.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Fetch sub categories when main category changes
  useEffect(() => {
    if (mainCategoryId) {
      const fetchSubCategories = async () => {
        try {
          const mainCategory = mainCategories.find(c => c.id === mainCategoryId);
          if (mainCategory) {
            const response = await fetch(`/api/categories?parentId=${mainCategoryId}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch sub categories: ${response.statusText}`);
            }
            const categories = await response.json();
            setSubCategories(categories);
            setSubCategoryId(''); // Reset sub category selection
          }
        } catch (err: any) {
          console.error('Error fetching sub categories:', err);
          setError(err.message || 'Failed to load sub categories.');
        }
      };

      fetchSubCategories();
    } else {
      setSubCategories([]);
      setSubCategoryId('');
    }
  }, [mainCategoryId, mainCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (!mainCategoryId) {
      setError('Please select a main category');
      return;
    }

    if (!subCategoryId) {
      setError('Please select a sub category');
      return;
    }

    try {
      setLoading(true);
      const post = await api.createPost({
        title: title.trim(),
        content: content.trim(),
        mainCategoryId,
        subCategoryId,
      });

      // Redirect to post details page
      router.push(`/posts/${post.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="create-post-page">
        <div className="create-post-container">
          <h1 className="create-post-title">Create New Post</h1>

          <form onSubmit={handleSubmit} className="create-post-form">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Title <span className="required-asterisk">*</span>
              </label>
              <input
                id="title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                maxLength={200}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">
                Content <span className="required-asterisk">*</span>
              </label>
              <textarea
                id="content"
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                rows={10}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mainCategory" className="form-label">
                Main Category <span className="required-asterisk">*</span>
              </label>
              <select
                id="mainCategory"
                className="form-select"
                value={mainCategoryId}
                onChange={(e) => setMainCategoryId(e.target.value)}
                disabled={categoriesLoading}
                required
              >
                <option value="">Select main category</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subCategory" className="form-label">
                Sub Category <span className="required-asterisk">*</span>
              </label>
              <select
                id="subCategory"
                className="form-select"
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                disabled={!mainCategoryId || subCategories.length === 0}
                required
              >
                <option value="">
                  {!mainCategoryId
                    ? 'Select main category first'
                    : subCategories.length === 0
                    ? 'Loading sub categories...'
                    : 'Select sub category'}
                </option>
                {subCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}

