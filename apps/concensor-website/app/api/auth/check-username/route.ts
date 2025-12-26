/**
 * Check Username Availability API Route
 *
 * Checks if a username is available (not already taken).
 * This endpoint is safe to expose publicly as usernames are not sensitive information.
 *
 * Endpoint: POST /api/auth/check-username
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Database client

/**
 * POST Handler for Username Availability Check
 *
 * @param request - Next.js request object containing username in body
 * @returns NextResponse - JSON response with availability status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { username } = body;

    // Validate input
    if (typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 }
      );
    }

    // Sanitize input
    const trimmedUsername = username.trim();

    // Validate username format
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return NextResponse.json(
        { available: false, message: 'Username must be 3-30 characters' },
        { status: 200 } // Still return 200, but indicate it's not available due to format
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { available: false, message: 'Username can only contain letters, numbers, and underscores' },
        { status: 200 }
      );
    }

    // Check if username exists in database
    const existingUser = await db.user.findUnique({
      where: { username: trimmedUsername },
    });

    // Return availability status
    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: 'Username has been used',
      });
    } else {
      return NextResponse.json({
        available: true,
        message: 'Username is available',
      });
    }
  } catch (error: any) {
    console.error('Check username error:', error);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}

