# Concensor

This is a [Next.js](https://nextjs.org) project bootstrapped for the Concensor political discussion platform.

## Prerequisites

Before you begin, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/download/) (v12 or higher)
- npm or yarn package manager

## Quick Start (For Experienced Developers)

If you're familiar with Next.js and Prisma, here's the quick setup:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Create .env.local with: DATABASE_URL="postgresql://user:password@localhost:5432/concensor_dev"

# 3. Generate Prisma Client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed database
npm run db:seed

# 6. Start dev server
npm run dev
```

## Getting Started (Detailed)

### 1. Install Dependencies

First, install the project dependencies:

```bash
npm install
```

### 2. Database Setup

#### Create PostgreSQL Database

Create a new PostgreSQL database for the project:

```bash
# Using psql command line
psql -U postgres
CREATE DATABASE concensor_dev;
\q

# Or using pgAdmin GUI
# Right-click Databases → Create → Database → Name: concensor_dev
```

#### Set Up Environment Variables

Create a `.env.local` file in the root directory (or `.env` if preferred):

```bash
# Database connection string
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/concensor_dev"

# Example:
# DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/concensor_dev"
```

**Important Notes:**
- Replace `your_password` with your PostgreSQL password
- Replace `postgres` with your PostgreSQL username if different
- Replace `concensor_dev` with your database name if different
- The default PostgreSQL port is `5432`

### 3. Prisma Setup

#### Generate Prisma Client

Generate the Prisma Client based on your schema:

```bash
npm run db:generate
```

This command reads `prisma/schema.prisma` and generates the Prisma Client in `node_modules/@prisma/client`.

#### Run Database Migrations

Apply all database migrations to set up your database schema:

```bash
npm run db:migrate
```

This will:
- Create all tables (users, categories, posts, votes, comments, etc.)
- Set up relationships and constraints
- Apply all migration files from `prisma/migrations/`

**Note:** If you encounter any errors, make sure:
- PostgreSQL is running
- Database exists
- `DATABASE_URL` is correct in `.env.local`

#### Seed the Database

Populate the database with initial category data:

```bash
npm run db:seed
```

This will create:
- 11 main categories (Politics, Economics, Technology, etc.)
- 100+ sub categories with proper parent-child relationships

**Note:** You can run this command multiple times safely - it uses `upsert` to avoid duplicates.

### 4. Start Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Prisma Commands Reference

The following Prisma commands are available:

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Create and apply a new migration
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Open Prisma Studio (database GUI)
npm run db:studio

# Push schema changes directly (development only)
npm run db:push

# Seed the database with initial data
npm run db:seed
```

## Troubleshooting Prisma Setup

### Issue: "DATABASE_URL environment variable is not set"

**Solution:**
- Make sure you have a `.env.local` file in the root directory
- Verify the `DATABASE_URL` is correctly formatted
- Restart your terminal/IDE after creating `.env.local`

### Issue: "Can't reach database server"

**Solution:**
- Verify PostgreSQL is running: `pg_isready` or check services
- Check your `DATABASE_URL` connection string
- Verify database name exists: `psql -U postgres -l`

### Issue: "PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions"

**Solution:**
- Make sure you've run `npm run db:generate` first
- Verify `DATABASE_URL` is set correctly
- Try deleting `node_modules/.prisma` and running `npm run db:generate` again

### Issue: "Migration failed" or "Table already exists"

**Solution:**
- If starting fresh, you can reset: `npx prisma migrate reset` (⚠️ deletes all data)
- Or manually drop tables and re-run migrations
- Check migration status: `npx prisma migrate status`

### Issue: "Module not found: @prisma/client"

**Solution:**
- Run `npm install` to install dependencies
- Run `npm run db:generate` to generate Prisma Client
- Make sure you're in the correct directory (`apps/concensor-website`)

## Database Schema Overview

The project uses the following main models:

- **User** - User accounts and authentication
- **Category** - Hierarchical categories (main and sub categories)
- **Post** - User posts with categories and engagement metrics
- **Vote** - User votes on posts (5-point scale: -2 to +2)
- **Comment** - Comments on posts (with nested replies support)
- **UserCategoryPoints** - Points and badges per category
- **UserCategoryView** - Recently viewed categories (LRU)

See `prisma/schema.prisma` for the complete schema definition.

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/app/api` - API routes (Next.js API routes)
- `/prisma` - Prisma schema and migrations
  - `schema.prisma` - Database schema definition
  - `migrations/` - Database migration files
  - `seed.ts` - Database seeding script
- `/src/components` - React components
- `/src/contexts` - React context providers
- `/src/layouts` - Layout components
- `/src/lib` - Library utilities (database, API, auth)
- `/src/types` - TypeScript type definitions
- `/src/assets` - Static assets (images, SVGs)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
