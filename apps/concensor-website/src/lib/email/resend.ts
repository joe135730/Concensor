/**
 * Resend Email Service Implementation
 * 
 * This is the Resend implementation of the EmailService interface.
 * Resend provides 3,000 free emails per month.
 * 
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get your API key from the dashboard
 * 3. Add RESEND_API_KEY to your .env file
 * 4. Verify your domain (or use Resend's test domain for development)
 * 
 * Documentation: https://resend.com/docs
 */

import { Resend } from 'resend';
import type { EmailService } from './types';

// Initialize Resend client
// RESEND_API_KEY should be in your .env file
const resend = new Resend(process.env.RESEND_API_KEY);

// Get base URL from environment (for email links)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Get "from" email address (must be verified in Resend dashboard)
// For development, you can use Resend's test domain: onboarding@resend.dev
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Resend Email Service Implementation
 * 
 * Implements the EmailService interface using Resend API.
 */
export class ResendEmailService implements EmailService {
  /**
   * Send email verification link
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    username?: string
  ): Promise<void> {
    // Construct verification URL
    // User will click this link to verify their email
    const verificationUrl = `${BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    try {
      // Send email using Resend API
      await resend.emails.send({
        from: FROM_EMAIL, // Sender email (must be verified in Resend)
        to: email, // Recipient email
        subject: 'Verify your email address', // Email subject
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Email</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                <h1 style="color: #1A4B7C;">Verify Your Email Address</h1>
                <p>Hello${username ? ` ${username}` : ''},</p>
                <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background-color: #1A4B7C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email Address
                  </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                  This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
        // Plain text version (for email clients that don't support HTML)
        text: `
          Verify Your Email Address
          
          Hello${username ? ` ${username}` : ''},
          
          Thank you for signing up! Please verify your email address by visiting this link:
          
          ${verificationUrl}
          
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        `,
      });
    } catch (error) {
      // Log error for debugging
      console.error('Failed to send verification email:', error);
      // Re-throw so calling code can handle it
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }

  /**
   * Send password reset link
   * (Implementation for future use)
   */
  async sendPasswordResetEmail(
    email: string,
    token: string,
    username?: string
  ): Promise<void> {
    // Construct reset URL
    const resetUrl = `${BASE_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Reset your password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reset Your Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                <h1 style="color: #1A4B7C;">Reset Your Password</h1>
                <p>Hello${username ? ` ${username}` : ''},</p>
                <p>You requested to reset your password. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background-color: #1A4B7C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                  </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">
                  This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
        text: `
          Reset Your Password
          
          Hello${username ? ` ${username}` : ''},
          
          You requested to reset your password. Visit this link to create a new password:
          
          ${resetUrl}
          
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        `,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email. Please try again later.');
    }
  }
}

