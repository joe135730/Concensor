## Cursor Cloud specific instructions

### Overview

Concensor is a political discussion platform — a single Next.js 15 app located in `apps/concensor-website/`. It uses PostgreSQL via Prisma 7 (with the `@prisma/adapter-pg` driver adapter) and npm as the package manager.

### Services

| Service | How to run | Port |
|---------|-----------|------|
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | 5432 |
| Next.js dev server | `npm run dev` (from `apps/concensor-website/`) | 3000 |

### Non-obvious gotchas

- **Prisma 7 config**: The Prisma schema (`prisma/schema.prisma`) does not contain a `url` field in its datasource block. The database URL is provided via `prisma.config.ts` which reads `DATABASE_URL` from a `.env` file using `dotenv/config`. Both `.env` (for Prisma CLI) and `.env.local` (for Next.js) are needed.
- **Resend API key at import time**: The email module (`src/lib/email/resend.ts`) instantiates the `Resend` client at module scope. Without `RESEND_API_KEY` in env, any route that imports the email service (e.g. signup) will crash at import time. Set a dummy value like `re_dummy_key_for_local_dev` in `.env.local` for local development; actual email sends will fail gracefully in the signup handler's try/catch.
- **Email verification required for login**: After signup, users must have `emailVerified = true` to log in. In dev, manually update the DB: `sudo -u postgres psql -d concensor_dev -c "UPDATE users SET \"emailVerified\" = true WHERE email = '...';"`.
- **Lint**: `npm run lint` (in `apps/concensor-website/`) uses `next lint`. It exits with code 1 due to pre-existing warnings/errors in the codebase (unescaped entities, `<img>` vs `<Image />`, hooks rules). The linter itself works correctly.
- **Database migrations**: Use `npx prisma migrate deploy` (not `prisma migrate dev`) to apply existing migrations non-interactively. Seed with `npm run db:seed`.
- **Standard commands**: See `apps/concensor-website/README.md` for the full list of Prisma and dev commands.
