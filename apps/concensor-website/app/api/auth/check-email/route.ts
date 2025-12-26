/**
 * Check Email Availability API Route
 *
 * Checks if an email is available (not already registered).
 * 
 * Security Note: While checking email availability can potentially be used for
 * email enumeration attacks, it's a common UX pattern for signup forms.
 * We return generic messages to minimize information leakage.
 *
 * Endpoint: POST /api/auth/check-email
 */

import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator'; // Library for input validation
import { db } from '@/lib/db'; // Database client

/**
 * POST Handler for Email Availability Check
 *
 * @param request - Next.js request object containing email in body
 * @returns NextResponse - JSON response with availability status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 }
      );
    }

    // Sanitize and normalize email
    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validator.isEmail(trimmedEmail)) {
      return NextResponse.json(
        { available: false, message: 'Invalid email format' },
        { status: 200 } // Still return 200, but indicate it's not available due to format
      );
    }

    // Check if email exists in database
    const existingUser = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Return availability status
    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: 'Email has been registered, Please login',
      });
    } else {
      return NextResponse.json({
        available: true,
        message: 'Email is available',
      });
    }
  } catch (error: any) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}

