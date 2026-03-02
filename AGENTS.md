# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
Concensor is a full-stack Next.js 15 app (App Router) in a monorepo at `apps/concensor-website/`. It uses Prisma 7 with the `@prisma/adapter-pg` driver adapter for PostgreSQL. All backend logic lives in `app/api/` routes; frontend in `src/` and `app/*/page.tsx`. See `apps/concensor-website/README.md` for detailed setup and `ARCHITECTURE_DECISION.md` for design rationale.

### Required services
- **PostgreSQL 16** must be running (`sudo pg_ctlcluster 16 main start`). Database: `concensor_dev`, user: `postgres`, password: `postgres`.
- **Next.js dev server**: `npm run dev` from `apps/concensor-website/` (port 3000).

### Environment files
Both `.env` and `.env.local` are needed in `apps/concensor-website/`. Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — any string for local dev
- `RESEND_API_KEY` — must be set to a non-empty placeholder (e.g. `re_placeholder_for_dev`) even for local dev, because the Resend client constructor throws at module load time if it's missing. Email sending will fail gracefully; signup still works.

### Common commands (run from `apps/concensor-website/`)
- **Lint**: `npm run lint`
- **Dev server**: `npm run dev`
- **Prisma generate**: `npm run db:generate`
- **Prisma migrate**: `npm run db:migrate`
- **Seed database**: `npm run db:seed`
- See `package.json` for the full list.

### Gotchas
- `next lint` is deprecated in Next.js 16 but still works in 15.x. Pre-existing lint errors/warnings exist in the codebase.
- The signup flow requires email verification. For local testing, manually verify users via SQL: `UPDATE users SET "emailVerified" = true WHERE email = '...';`
- When killing the Next.js dev server, also kill its child `next-server` process to avoid port conflicts. Use specific PIDs, not `pkill -f`.
- No automated test suite exists yet; there is no `tests/` directory.
