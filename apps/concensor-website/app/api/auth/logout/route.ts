/**
 * Logout API Route
 *
 * Handles user logout by clearing the HttpOnly cookie.
 * Since the cookie is HttpOnly, it can only be cleared by the server.
 *
 * Endpoint: POST /api/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST Handler for Logout
 *
 * This function runs when a POST request is made to /api/auth/logout
 * It clears the HttpOnly cookie by setting it to expire immediately.
 *
 * @param request - Next.js request object
 * @returns NextResponse - JSON response with success status and cleared cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Create response with success message
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the HttpOnly cookie by setting it to expire immediately
    // This is done by setting maxAge to 0 or expires to a past date
    response.cookies.set('token', '', {
      httpOnly: true,                              // Must match original cookie settings
      secure: process.env.NODE_ENV === 'production', // Must match original cookie settings
      sameSite: 'strict',                          // Must match original cookie settings
      maxAge: 0,                                   // Expire immediately (0 seconds)
      path: '/',                                   // Must match original cookie path
    });

    // Return response (cookie is automatically cleared in browser)
    return response;
  } catch (error: any) {
    // Log error for debugging
    console.error('Logout error:', error);
    // Return generic error message
    return NextResponse.json(
      { error: 'Logout failed. Please try again.' },
      { status: 500 } // HTTP 500 = Internal Server Error
    );
  }
}

