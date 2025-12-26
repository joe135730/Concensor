/**
 * Authentication Utilities
 * 
 * This file contains helper functions for:
 * - Password hashing and verification (bcrypt)
 * - JWT token generation and verification
 * 
 * These functions are used in login and signup routes.
 */

import bcrypt from 'bcryptjs'; // Library for password hashing
import jwt from 'jsonwebtoken'; // Library for JWT token creation and verification

/**
 * JWT Secret Key
 * 
 * This is used to sign and verify JWT tokens.
 * IMPORTANT: Change this in production! Use a strong random string.
 * 
 * Get from environment variable, or use default (for development only)
 * 
 * Type assertion ensures TypeScript knows it's a string (not undefined)
 */
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT Expiration Time
 * 
 * How long the token is valid. Default: 7 days.
 * Format: '7d' (days), '1h' (hours), '30m' (minutes)
 */
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

/**
 * JWT Payload Interface
 * 
 * This defines what data is stored inside the JWT token.
 * When you decode a token, you'll get an object with these fields.
 */
export interface JWTPayload {
  userId: string;        // User's unique ID
  email: string;         // User's email
  tokenVersion: number;  // Version number (increments when password changes, invalidates old tokens)
}

/**
 * Hash Password
 * 
 * Converts plain text password into a secure hash.
 * The hash cannot be reversed to get the original password.
 * 
 * @param password - Plain text password from user
 * @returns Promise<string> - Hashed password (to store in database)
 * 
 * Example:
 *   const hash = await hashPassword('MyPassword123!');
 *   // Returns: '$2a$10$N9qo8uLOickgx2ZMRZoMye...' (long hash string)
 */
export async function hashPassword(password: string): Promise<string> {
  // bcrypt.hash(password, rounds)
  // - password: The plain text password to hash
  // - 10: Number of hashing rounds (higher = more secure but slower)
  //   - 10 rounds = good balance of security and speed
  return bcrypt.hash(password, 10);
}

/**
 * Verify Password
 * 
 * Compares a plain text password with a hashed password.
 * Returns true if they match, false otherwise.
 * 
 * @param password - Plain text password from user (login attempt)
 * @param hash - Hashed password from database
 * @returns Promise<boolean> - True if password matches, false otherwise
 * 
 * Example:
 *   const isValid = await verifyPassword('MyPassword123!', storedHash);
 *   // Returns: true or false
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // bcrypt.compare() automatically:
  // 1. Extracts the salt from the hash
  // 2. Hashes the plain password with the same salt
  // 3. Compares the two hashes
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT Token
 * 
 * Creates a JWT token containing user information.
 * This token is used to authenticate the user in future requests.
 * 
 * @param payload - User data to include in token
 * @returns string - JWT token (long string like "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
 * 
 * Example:
 *   const token = generateToken({
 *     userId: '123',
 *     email: 'user@example.com',
 *     tokenVersion: 0
 *   });
 */
export function generateToken(payload: JWTPayload): string {
  // jwt.sign(payload, secret, options)
  // - payload: Data to encode in token
  // - JWT_SECRET: Secret key to sign token (prevents tampering)
  // - expiresIn: How long token is valid
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string, // Token expires in 7 days (or from env)
  } as jwt.SignOptions);
}

/**
 * Verify JWT Token
 * 
 * Validates a JWT token and extracts the data from it.
 * Throws an error if token is invalid or expired.
 * 
 * @param token - JWT token string to verify
 * @returns JWTPayload - Decoded token data (userId, email, tokenVersion)
 * @throws Error - If token is invalid, expired, or tampered with
 * 
 * Example:
 *   try {
 *     const decoded = verifyToken(token);
 *     console.log(decoded.userId); // '123'
 *   } catch (error) {
 *     // Token invalid or expired
 *   }
 */
export function verifyToken(token: string): JWTPayload {
  // jwt.verify(token, secret)
  // - token: JWT token to verify
  // - JWT_SECRET: Secret key used to sign token
  // Returns: Decoded payload if valid
  // Throws: Error if invalid, expired, or tampered with
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

