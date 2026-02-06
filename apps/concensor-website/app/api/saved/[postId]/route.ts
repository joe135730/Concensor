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
 * GET /api/saved/[postId] - Check if a post is saved by the current user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedPost = await db.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: params.postId,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ saved: !!savedPost });
  } catch (error: any) {
    console.error('Error checking saved post:', error);
    return NextResponse.json(
      { error: 'Failed to check saved post' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved/[postId] - Save a post for the current user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.savedPost.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId: params.postId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        postId: params.postId,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error: any) {
    console.error('Error saving post:', error);
    return NextResponse.json(
      { error: 'Failed to save post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saved/[postId] - Unsave a post for the current user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.savedPost.deleteMany({
      where: {
        userId: user.id,
        postId: params.postId,
      },
    });

    return NextResponse.json({ saved: false });
  } catch (error: any) {
    console.error('Error unsaving post:', error);
    return NextResponse.json(
      { error: 'Failed to unsave post' },
      { status: 500 }
    );
  }
}
