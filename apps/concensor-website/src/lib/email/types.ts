/**
 * Email Service Interface
 * 
 * This interface defines the contract for email services.
 * By using this abstraction, we can easily switch between email providers
 * (Resend, AWS SES, SendGrid, etc.) without changing the rest of the codebase.
 * 
 * To switch providers:
 * 1. Create a new implementation (e.g., src/lib/email/ses.ts)
 * 2. Update src/lib/email/index.ts to use the new implementation
 * 3. No other code changes needed!
 */

export interface EmailService {
  /**
   * Send email verification link to user
   * 
   * @param email - User's email address
   * @param token - Verification token (will be included in the link)
   * @param username - User's username (for personalization)
   * @returns Promise that resolves when email is sent
   */
  sendVerificationEmail(
    email: string,
    token: string,
    username?: string
  ): Promise<void>;

  /**
   * Send password reset link to user
   * 
   * @param email - User's email address
   * @param token - Reset token (will be included in the link)
   * @param username - User's username (for personalization)
   * @returns Promise that resolves when email is sent
   */
  sendPasswordResetEmail(
    email: string,
    token: string,
    username?: string
  ): Promise<void>;
}

