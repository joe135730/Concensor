// Category by slug API route
// GET /api/categories/[slug] - Get category by slug with full details

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const category = await db.category.findUnique({
      where: { slug },
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
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

