// Categories API routes
// This handles all category-related operations

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/categories
 * 
 * Query parameters:
 * - parentId: Filter by parent category ID (null for main categories)
 * - slug: Get category by slug
 * - mainOnly: Get only main categories (parentId = null)
 * 
 * Returns: Array of categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const slug = searchParams.get('slug');
    const mainOnly = searchParams.get('mainOnly') === 'true';

    // Build query conditions
    const where: any = {};

    if (slug) {
      // Get category by slug
      const category = await db.category.findUnique({
        where: { slug },
        include: {
          parent: true,
          children: {
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(category);
    }

    if (mainOnly) {
      // Get only main categories (no parent)
      where.parentId = null;
    } else if (parentId !== null) {
      // Filter by specific parent
      if (parentId === 'null' || parentId === '') {
        where.parentId = null;
      } else {
        where.parentId = parentId;
      }
    }

    // Fetch categories
    const categories = await db.category.findMany({
      where,
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            mainCategoryPosts: true,
            subCategoryPosts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

