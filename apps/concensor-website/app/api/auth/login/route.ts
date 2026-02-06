/**
 * Login API Route
 * 
 * Handles user authentication:
 * 1. Validates email and password
 * 2. Finds user in database
 * 3. Verifies password matches
 * 4. Generates JWT token
 * 5. Sets HttpOnly cookie with token
 * 
 * Endpoint: POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator'; // Library for input validation
import { db } from '@/lib/db'; // Database client
import { verifyPassword, generateToken } from '@/lib/auth'; // Auth utilities
import { applyBadgeDecayOnLogin } from '@/lib/decayService';

/**
 * POST Handler for Login
 * 
 * This function runs when a POST request is made to /api/auth/login
 * 
 * @param request - Next.js request object (contains email and password in body)
 * @returns NextResponse - JSON response with user data and cookie set
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body (JSON string → JavaScript object)
    // Example: { email: "john@example.com", password: "SecurePass123!" }
    const body = await request.json();
    
    // Extract email and password from request body
    // Using 'let' because we'll sanitize these values
    let { email, password } = body;

    // ✅ VALIDATION: Check input types
    // Ensure email and password are strings (prevents injection attacks)
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 } // HTTP 400 = Bad Request
      );
    }

    // ✅ SANITIZATION: Clean and normalize input
    // Remove whitespace and normalize email
    email = email.trim().toLowerCase();  // Remove spaces, lowercase (emails are case-insensitive)
    password = password.trim();          // Remove leading/trailing spaces

    // ✅ VALIDATION: Email format
    // Check if email is in valid format (user@domain.com)
    if (!validator.isEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Email length
    // Maximum email length is 254 characters (RFC standard)
    if (email.length > 254) {
      return NextResponse.json(
        { error: 'Email too long' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Password exists
    // Make sure password was provided (not empty)
    if (!password || password.length === 0) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Check for XSS (Cross-Site Scripting) patterns
    // Defense in depth: Check for malicious patterns even though we sanitize
    const xssPatterns = [
      /<script/i,        // <script> tag
      /javascript:/i,  // javascript: protocol
      /onerror=/i,       // onerror attribute
      /onclick=/i,       // onclick attribute
    ];

    // Check if email or password contains XSS patterns
    if (xssPatterns.some(pattern => pattern.test(email) || pattern.test(password))) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // ✅ Query database for user by email
    // findUnique() finds a single record matching the condition
    // Returns the user object if found, null if not found
    const user = await db.user.findUnique({
      where: { email }, // Find user where email matches
    });

    // ✅ Security: Don't reveal if email exists
    // If we said "Email not found", attacker could enumerate valid emails
    // Generic message "Invalid email or password" prevents information leakage
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 } // HTTP 401 = Unauthorized
      );
    }

    // ✅ Check if user has a password
    // If user registered with Google only (no password), they can't use password login
    // But if they have both (email + Google linked), allow password login
    if (!user.passwordHash) {
      // User has no password - they must use Google login
      if (user.googleId) {
        return NextResponse.json(
          { error: 'This account uses Google login. Please login with Google.' },
          { status: 401 } // HTTP 401 = Unauthorized
        );
      } else {
        // Edge case: user has no password and no Google ID (shouldn't happen)
        return NextResponse.json(
          { error: 'Account configuration error. Please contact support.' },
          { status: 500 } // HTTP 500 = Internal Server Error
        );
      }
    }

    // ✅ Verify password
    // Compare the provided password with the hashed password in database
    // verifyPassword() uses bcrypt to securely compare passwords
    // Returns true if password matches, false otherwise
    const isValid = await verifyPassword(password, user.passwordHash);

    // If password doesn't match, return generic error (same as email not found)
    // This prevents attackers from knowing if email exists or password is wrong
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 } // HTTP 401 = Unauthorized
      );
    }

    // ✅ Check if email is verified (for email/password users only)
    // Google OAuth users don't need email verification (Google already verified their email)
    if (user.provider === 'email' && !user.emailVerified) {
      return NextResponse.json(
        { 
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          requiresVerification: true, // Flag to indicate email verification needed
        },
        { status: 403 } // HTTP 403 = Forbidden (account exists but not verified)
      );
    }

    // ✅ Generate JWT token
    // Create a token containing user information
    // This token proves the user is authenticated
    const token = generateToken({
      userId: user.id,              // User's unique ID
      email: user.email,            // User's email
      tokenVersion: user.tokenVersion, // Token version (for invalidation on password change)
    });

    // ✅ Create response with user data
    // Don't include passwordHash in response (security!)
    const response = NextResponse.json({
      success: true,                // Indicates successful login
      user: {
        id: user.id,               // User ID
        email: user.email,         // User email
        username: user.username,   // Username
      },
    });

    // ✅ Set HttpOnly cookie with token
    // HttpOnly = JavaScript cannot access (prevents XSS attacks)
    // Browser automatically sends this cookie with every request
    response.cookies.set('token', token, {
      httpOnly: true,                              // JavaScript cannot read (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',                          // Prevents CSRF attacks
      maxAge: 60 * 60 * 24 * 7,                   // Cookie expires in 7 days (in seconds)
      path: '/',                                   // Cookie available for all paths on domain
    });

    // ✅ Apply badge decay on login (non-blocking)
    // This updates points based on inactivity and updates lastLoginDate
    try {
      await applyBadgeDecayOnLogin(db, user.id);
    } catch (decayError) {
      // Log error but don't fail login if decay calculation fails
      console.error('Error applying badge decay on login:', decayError);
    }

    // Return response (cookie is automatically sent to browser)
    return response;
  } catch (error: any) {
    // Log error for debugging
    console.error('Login error:', error);
    
    // Return generic error (don't reveal internal error details)
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 } // HTTP 500 = Internal Server Error
    );
  }
}

