import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * GET /api/saved - Get saved posts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedPosts = await db.savedPost.findMany({
      where: { userId: user.id },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
            mainCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            subCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                votes: true,
                comments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const posts = savedPosts.map((savedPost) => savedPost.post);

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Error fetching saved posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved posts' },
      { status: 500 }
    );
  }
}
