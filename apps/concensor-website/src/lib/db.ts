/**
 * Database Client Singleton
 * 
 * This file creates a single Prisma Client instance that's reused across the application.
 * This is important because:
 * 1. In development, Next.js hot-reloading can create multiple instances
 * 2. Multiple instances can cause connection pool exhaustion
 * 3. This pattern ensures only one instance exists
 * 
 * Prisma Client automatically reads DATABASE_URL from environment variables.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Type definition for global Prisma instance
 * 
 * In Node.js, globalThis is the global object (like window in browser).
 * We store the Prisma Client here so it persists across hot-reloads in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined; // Prisma Client instance or undefined
};

/**
 * Create PostgreSQL connection pool
 * Prisma 7 requires an adapter for PostgreSQL connections
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * Export database client
 * 
 * This uses the "singleton pattern":
 * - If Prisma Client already exists in global, use it
 * - Otherwise, create a new one
 * 
 * The ?? operator means "use left side if not null/undefined, otherwise use right side"
 */
export const db =
  globalForPrisma.prisma ?? // Use existing instance if it exists
  new PrismaClient({
    // Prisma 7: Provide adapter for PostgreSQL connection
    adapter,
    // Logging configuration:
    // - Development: Log queries, errors, and warnings (helpful for debugging)
    // - Production: Only log errors (less verbose, better performance)
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']  // Development: verbose logging
      : ['error'],                   // Production: only errors
  });

/**
 * Store Prisma Client in global object (development only)
 * 
 * In development, Next.js hot-reloading can reset modules.
 * By storing the client in globalThis, it persists across hot-reloads.
 * 
 * In production, we don't need this because modules aren't hot-reloaded.
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

