/**
 * Signup API Route
 * 
 * Handles user registration:
 * 1. Validates input (username, email, password)
 * 2. Checks if user already exists
 * 3. Hashes password
 * 4. Creates user in database
 * 5. Generates JWT token
 * 6. Sets HttpOnly cookie with token
 * 
 * Endpoint: POST /api/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator'; // Library for input validation (email, etc.)
import { db } from '@/lib/db'; // Database client
import { hashPassword, generateToken } from '@/lib/auth'; // Auth utilities

/**
 * POST Handler for Signup
 * 
 * This function runs when a POST request is made to /api/auth/signup
 * 
 * @param request - Next.js request object (contains request body, headers, etc.)
 * @returns NextResponse - JSON response with user data and cookie set
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body (JSON string → JavaScript object)
    // Example: { username: "johndoe", email: "john@example.com", password: "SecurePass123!" }
    const body = await request.json();
    
    // Extract username, email, and password from request body
    // Using 'let' because we'll sanitize these values later
    let { username, email, password } = body;

    // ✅ VALIDATION: Check input types
    // Make sure all inputs are strings (prevents injection attacks)
    // If attacker sends { username: { malicious: "code" } }, this catches it
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      // Return 400 Bad Request with error message
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 } // HTTP status code: 400 = Bad Request
      );
    }

    // ✅ SANITIZATION: Clean and normalize input
    // Remove whitespace and normalize data
    username = username.trim();              // Remove leading/trailing spaces
    email = email.trim().toLowerCase();      // Remove spaces, convert to lowercase (emails are case-insensitive)
    password = password.trim();               // Remove leading/trailing spaces

    // ✅ VALIDATION: Username length
    // Username must be between 3 and 30 characters
    // Too short = not unique enough, too long = database/UI issues
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Username format
    // Only allow: letters (a-z, A-Z), numbers (0-9), and underscore (_)
    // Regex explanation: /^[a-zA-Z0-9_]+$/
    //   ^ = start of string
    //   [a-zA-Z0-9_] = character class (letters, numbers, underscore)
    //   + = one or more characters
    //   $ = end of string
    // This prevents special characters that could cause issues
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Email format
    // Use validator library to check if email is valid format
    // Checks for: user@domain.com format, valid domain, etc.
    if (!validator.isEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Email length
    // Maximum email length is 254 characters (RFC 5321 standard)
    // Prevents database issues and potential attacks
    if (email.length > 254) {
      return NextResponse.json(
        { error: 'Email too long' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Password strength requirements
    // Strong passwords prevent brute force attacks
    
    // Check 1: Minimum length (12 characters)
    // Longer passwords are exponentially harder to crack
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters' },
        { status: 400 }
      );
    }

    // Check 2: Must contain uppercase letter
    // Regex: /[A-Z]/ = at least one uppercase letter (A-Z)
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    // Check 3: Must contain symbol
    // Regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
    // This matches common special characters
    // Symbols make passwords harder to guess
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one symbol' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Check for XSS (Cross-Site Scripting) patterns
    // This is "defense in depth" - even though we sanitize, we also check for malicious patterns
    // These patterns are common in XSS attacks
    
    // Array of regex patterns that indicate XSS attempts
    const xssPatterns = [
      /<script/i,        // <script> tag (case-insensitive)
      /javascript:/i,    // javascript: protocol (can execute code)
      /onerror=/i,       // onerror attribute (can execute code on error)
      /onclick=/i,       // onclick attribute (can execute code on click)
      /<iframe/i,        // <iframe> tag (can embed malicious content)
    ];

    // Combine all inputs into one string to check
    const allInputs = [username, email, password].join(' ');
    
    // Check if any XSS pattern matches the input
    // .some() returns true if ANY pattern matches
    if (xssPatterns.some(pattern => pattern.test(allInputs))) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      );
    }

    // ✅ Check if user already exists (check separately for specific error messages)
    // Check username first
    const existingUserByUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 } // HTTP 409 = Conflict
      );
    }

    // Check email separately
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email has been registered, Please login' },
        { status: 409 } // HTTP 409 = Conflict
      );
    }

    // ✅ Hash password before storing
    // NEVER store plain text passwords! Always hash them.
    // hashPassword() uses bcrypt to create a secure hash
    // This is async because hashing takes time (intentionally slow to prevent brute force)
    const passwordHash = await hashPassword(password);

    // ✅ Create new user in database
    // db.user.create() inserts a new record into the users table
    const user = await db.user.create({
      data: {
        username,           // Username (already sanitized)
        email,              // Email (already sanitized and normalized)
        passwordHash,       // Hashed password (NOT plain text!)
        tokenVersion: 0,    // Start at 0, increments when password changes (invalidates old tokens)
      },
    });

    // ✅ Generate JWT token
    // Create a token containing user information
    // This token will be used to authenticate the user in future requests
    const token = generateToken({
      userId: user.id,              // User's unique ID
      email: user.email,            // User's email
      tokenVersion: user.tokenVersion, // Token version (for invalidation)
    });

    // ✅ Create response with user data
    // NextResponse.json() creates a JSON response
    const response = NextResponse.json({
      success: true,                // Indicates successful signup
      user: {
        id: user.id,               // User ID (don't send passwordHash!)
        email: user.email,         // User email
        username: user.username,   // Username
      },
    });

    // ✅ Set HttpOnly cookie with token
    // HttpOnly = JavaScript cannot access (prevents XSS token theft)
    // This is more secure than sending token in response body
    response.cookies.set('token', token, {
      httpOnly: true,                              // JavaScript cannot read this cookie
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',                          // Prevents CSRF attacks
      maxAge: 60 * 60 * 24 * 7,                   // Cookie expires in 7 days (seconds)
      path: '/',                                   // Cookie available for all paths
    });

    // Return response (cookie is automatically sent to browser)
    return response;
  } catch (error: any) {
    // Log error for debugging (in production, use proper logging service)
    // Log full error details in development to help debug
    console.error('Signup error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Handle Prisma unique constraint errors
    // P2002 = Unique constraint violation (email or username already exists)
    // This can happen if two users sign up simultaneously with same email/username
    if (error.code === 'P2002') {
      // Check which field caused the conflict
      const target = (error.meta as any)?.target as string[];
      if (target?.includes('username')) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      } else if (target?.includes('email')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 } // HTTP 409 = Conflict
      );
    }

    // Handle database connection errors
    // P1001 = Can't reach database server
    // P1017 = Server closed the connection
    if (error.code === 'P1001' || error.code === 'P1017') {
      console.error('Database connection error. Check DATABASE_URL in .env.local');
      return NextResponse.json(
        { error: 'Database connection failed. Please check server configuration.' },
        { status: 500 }
      );
    }

    // Handle Prisma Client not generated error
    if (error.message?.includes('PrismaClient') || error.message?.includes('generated')) {
      console.error('Prisma Client not generated. Run: npx prisma generate');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Generic error response for any other errors
    // In development, include error message for debugging
    // In production, don't reveal internal error details (security best practice)
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Registration failed. Please try again.'
      : 'Registration failed. Please try again.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 } // HTTP 500 = Internal Server Error
    );
  }
}

