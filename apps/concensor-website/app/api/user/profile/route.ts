import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * Get Current User Profile
 * 
 * Endpoint: GET /api/user/profile
 * 
 * Returns the current logged-in user's profile.
 * Requires authentication (HttpOnly cookie with JWT token).
 */

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database (include tokenVersion for verification, but don't return it)
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if token version matches (for password change invalidation)
    if (user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { error: 'Token expired. Please login again.' },
        { status: 401 }
      );
    }

    // Return user data without sensitive fields
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        // Don't return passwordHash or tokenVersion
      },
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

