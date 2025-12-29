/**
 * Google OAuth Callback Route
 * 
 * This route handles the callback from Google after user authorization.
 * 
 * Endpoint: GET /api/auth/google/callback
 * 
 * Flow:
 * 1. Google redirects here with authorization code
 * 2. Exchange code for access token and user info
 * 3. Create or find user in database
 * 4. Generate JWT token
 * 5. Set HttpOnly cookie
 * 6. Redirect to /home
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * GET Handler - Handles Google OAuth callback
 * 
 * @param request - Next.js request object with authorization code and state
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization code and state from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check if user denied authorization
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/login?error=google_denied', request.url)
      );
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.url)
      );
    }

    // Verify state parameter (CSRF protection)
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!state || state !== storedState) {
      console.error('Invalid state parameter - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/login?error=invalid_state', request.url)
      );
    }

    // Validate environment variables
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        new URL('/login?error=config_error', request.url)
      );
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.id_token) {
      throw new Error('No ID token received from Google');
    }

    // Verify and decode the ID token to get user information
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Failed to decode Google ID token');
    }

    // Extract user information from Google payload
    const googleId = payload.sub; // Google user ID
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;
    const emailVerified = payload.email_verified;

    // Validate email
    if (!email || !emailVerified) {
      return NextResponse.redirect(
        new URL('/login?error=email_not_verified', request.url)
      );
    }

    // Check if user already exists (by email or googleId)
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId },
        ],
      },
    });

    if (user) {
      // User exists - check if they already have Google linked
      if (!user.googleId) {
        // Email account exists but Google is not linked
        // Block automatic linking - require user to link manually in profile settings
        // This is more secure and gives user explicit control
        return NextResponse.redirect(
          new URL('/login?error=email_exists_use_password', request.url)
        );
      } else {
        // Google account already linked - just update profile picture if needed
        if (picture) {
          user = await db.user.update({
            where: { id: user.id },
            data: {
              profilePicture: picture,
            },
          });
        }
      }
    } else {
      // Create new user from Google account
      // Generate username from email prefix (part before @)
      let baseUsername = email.split('@')[0];
      
      // Clean username: remove invalid characters, keep only alphanumeric and underscore
      // This ensures username matches the format required by the database
      baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '_');
      
      // Ensure username is at least 3 characters (database requirement)
      // If email prefix is too short, pad it
      if (baseUsername.length < 3) {
        baseUsername = baseUsername + '_user';
      }
      
      // Truncate if too long (database limit is usually 30 characters)
      // Leave room for counter suffix (e.g., "_123")
      if (baseUsername.length > 25) {
        baseUsername = baseUsername.substring(0, 25);
      }
      
      // Ensure username is unique
      // Check against both email/password users and Google users
      let username = baseUsername;
      let counter = 1;
      while (await db.user.findUnique({ where: { username } })) {
        username = `${baseUsername}_${counter}`;
        counter++;
        // Safety check: prevent infinite loop (very unlikely but good practice)
        if (counter > 1000) {
          // Fallback: use timestamp if too many conflicts
          username = `${baseUsername}_${Date.now()}`;
          break;
        }
      }

      user = await db.user.create({
        data: {
          email,
          username,
          googleId,
          provider: 'google',
          profilePicture: picture || null,
          passwordHash: null, // OAuth users don't have passwords
          tokenVersion: 0,
        },
      });
    }

    // Generate JWT token (same as email/password login)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    // Create response to redirect to home page
    const response = NextResponse.redirect(
      new URL('/home', request.url)
    );

    // Set HttpOnly cookie with JWT token (same as email/password login)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days (same as JWT_EXPIRES_IN)
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url)
    );
  }
}

