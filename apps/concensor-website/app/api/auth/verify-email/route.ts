/**
 * Email Verification API Route
 * 
 * Handles email verification:
 * 1. Validates verification token from query parameter
 * 2. Checks if token exists and hasn't expired
 * 3. Updates user's emailVerified status to true
 * 4. Clears verification token (security: one-time use)
 * 5. Optionally logs user in (sets authentication cookie)
 * 
 * Endpoint: GET /api/auth/verify-email?token=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Database client
import { generateToken } from '@/lib/auth'; // Auth utilities for generating JWT

/**
 * GET Handler for Email Verification
 * 
 * This function runs when a GET request is made to /api/auth/verify-email?token=xxx
 * 
 * @param request - Next.js request object (contains query parameters)
 * @returns NextResponse - Redirects to login page with success message, or error page
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from URL query parameters
    // Example URL: /api/auth/verify-email?token=abc123...
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    // ✅ VALIDATION: Check if token exists
    if (!token || typeof token !== 'string') {
      // Redirect to login page with error message
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', request.url)
      );
    }

    // ✅ Find user with matching verification token
    // Also check that token hasn't expired (emailVerificationExpires > now)
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token, // Token must match
        emailVerificationExpires: {
          gt: new Date(), // Expiration time must be greater than current time (not expired)
        },
      },
    });

    // ✅ Check if user exists and token is valid
    if (!user) {
      // Token invalid or expired
      return NextResponse.redirect(
        new URL('/login?error=invalid_or_expired_token', request.url)
      );
    }

    // ✅ Check if email is already verified
    if (user.emailVerified) {
      // Email already verified - redirect to login
      return NextResponse.redirect(
        new URL('/login?message=email_already_verified', request.url)
      );
    }

    // ✅ Verify email and clear verification token
    // Update user: set emailVerified to true, clear token and expiration
    // This makes the token one-time use (security best practice)
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,              // Mark email as verified
        emailVerificationToken: null,     // Clear token (one-time use)
        emailVerificationExpires: null,   // Clear expiration
      },
    });

    // ✅ Generate JWT token for automatic login
    // After verifying email, automatically log user in
    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    // ✅ Create redirect response to home page
    // User is now verified and logged in
    const response = NextResponse.redirect(
      new URL('/?verified=true', request.url)
    );

    // ✅ Set HttpOnly cookie with JWT token
    // User is automatically logged in after email verification
    response.cookies.set('token', jwtToken, {
      httpOnly: true,                              // JavaScript cannot read (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',                          // Prevents CSRF attacks
      maxAge: 60 * 60 * 24 * 7,                   // Cookie expires in 7 days (seconds)
      path: '/',                                   // Cookie available for all paths
    });

    // Return response (cookie is automatically sent to browser)
    return response;
  } catch (error: any) {
    // Log error for debugging
    console.error('Email verification error:', error);
    
    // Redirect to login page with generic error
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    );
  }
}

