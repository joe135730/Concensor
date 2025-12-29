/**
 * Email Service Export
 * 
 * This file exports the email service implementation.
 * To switch providers, just change the import here!
 * 
 * Current: Resend (free tier: 3,000 emails/month)
 * Future: AWS SES, SendGrid, etc.
 */

import { ResendEmailService } from './resend';
import type { EmailService } from './types';

// Export the interface for type checking
export type { EmailService } from './types';

// Create and export the email service instance
// To switch providers, just change this line:
// Example: export const emailService: EmailService = new SESEmailService();
export const emailService: EmailService = new ResendEmailService();

