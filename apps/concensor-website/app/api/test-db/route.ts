// Test endpoint to verify Prisma client and database connection
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test if Prisma client models are accessible
    const testResults: any = {
      prismaClientExists: !!db,
      models: {} as any,
      errors: [] as string[],
    };

    // Test User model (we know this works)
    try {
      const userCount = await db.user.count();
      testResults.models.user = { accessible: true, count: userCount };
    } catch (error: any) {
      testResults.models.user = { accessible: false, error: error.message };
      testResults.errors.push(`User model error: ${error.message}`);
    }

    // Test Category model
    try {
      const categoryCount = await db.category.count();
      testResults.models.category = { accessible: true, count: categoryCount };
    } catch (error: any) {
      testResults.models.category = { accessible: false, error: error.message };
      testResults.errors.push(`Category model error: ${error.message}`);
    }

    // Test Post model
    try {
      const postCount = await db.post.count();
      testResults.models.post = { accessible: true, count: postCount };
    } catch (error: any) {
      testResults.models.post = { accessible: false, error: error.message };
      testResults.errors.push(`Post model error: ${error.message}`);
    }

    return NextResponse.json(testResults, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Database test failed',
        message: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

