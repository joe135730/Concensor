/**
 * Google OAuth Initiation Route
 * 
 * This route initiates the Google OAuth flow by redirecting the user to Google's login page.
 * 
 * Endpoint: GET /api/auth/google
 * 
 * Flow:
 * 1. User clicks "Login with Google"
 * 2. Frontend redirects to this endpoint
 * 3. This route redirects to Google's OAuth consent page
 * 4. User authorizes on Google
 * 5. Google redirects to /api/auth/google/callback with authorization code
 */

import { NextRequest, NextResponse } from 'next/server';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

/**
 * GET Handler - Initiates Google OAuth flow
 * 
 * Redirects user to Google's OAuth consent page
 */
export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not set in environment variables');
      return NextResponse.json(
        { error: 'Google OAuth is not configured' },
        { status: 500 }
      );
    }

    // Generate a random state parameter for CSRF protection
    // In production, you should store this in a session or encrypted cookie
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Store state in a cookie (for verification in callback)
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` +
      `prompt=consent`
    );

    // Store state in HttpOnly cookie for verification
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google login' },
      { status: 500 }
    );
  }
}

