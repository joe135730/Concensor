/**
 * Resend Verification Email API Route
 * 
 * Allows users to request a new verification email if:
 * 1. They didn't receive the original email
 * 2. The verification link expired
 * 3. They need a new verification link
 * 
 * Endpoint: POST /api/auth/resend-verification
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator'; // Library for input validation
import crypto from 'crypto'; // Node.js crypto module for generating secure random tokens
import { db } from '@/lib/db'; // Database client
import { emailService } from '@/lib/email'; // Email service for sending verification emails

/**
 * POST Handler for Resending Verification Email
 * 
 * @param request - Next.js request object containing email in body
 * @returns NextResponse - JSON response with success or error message
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // ✅ VALIDATION: Check input type
    if (typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 } // HTTP 400 = Bad Request
      );
    }

    // ✅ SANITIZATION: Clean and normalize email
    const trimmedEmail = email.trim().toLowerCase();

    // ✅ VALIDATION: Check email format
    if (!validator.isEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ✅ Find user by email
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    // ✅ Check if user exists
    if (!user) {
      // Don't reveal if email exists (security: prevent email enumeration)
      // Return success message even if user doesn't exist
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    // ✅ Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true, // Flag to indicate email is already verified
        message: 'This email is already verified. You can log in now.',
      });
    }

    // ✅ Check if user registered with Google (no email verification needed)
    if (user.provider === 'google') {
      return NextResponse.json({
        success: true,
        message: 'This account uses Google login. No email verification needed.',
      });
    }

    // ✅ Generate new verification token
    // Create a new secure random token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // ✅ Set token expiration (24 hours from now)
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // ✅ Update user with new verification token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // ✅ Send verification email
    try {
      await emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.username || undefined
      );
    } catch (emailError) {
      // If email sending fails, log error
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 } // HTTP 500 = Internal Server Error
      );
    }

    // ✅ Return success response
    return NextResponse.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
    });
  } catch (error: any) {
    // Log error for debugging
    console.error('Resend verification error:', error);
    
    // Return generic error
    return NextResponse.json(
      { error: 'Failed to resend verification email. Please try again later.' },
      { status: 500 }
    );
  }
}

