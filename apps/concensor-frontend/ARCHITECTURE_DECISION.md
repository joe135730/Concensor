# Architecture Decision: Next.js Full-Stack

## Decision: Use Next.js API Routes (Full-Stack)

**Why:**
1. ✅ Faster development - single codebase
2. ✅ Better performance - Server Components + API routes
3. ✅ Scales well with proper architecture
4. ✅ Easy migration path if needed later
5. ✅ Industry standard for modern web apps

## Project Structure

```
apps/concensor-frontend/
├── app/                          # Next.js Routes & API
│   ├── api/                     # 🔥 BACKEND LOGIC HERE
│   │   ├── auth/
│   │   │   └── login/route.ts  # POST /api/auth/login
│   │   ├── posts/
│   │   │   ├── route.ts        # GET/POST /api/posts
│   │   │   ├── [id]/route.ts   # GET/PUT/DELETE /api/posts/:id
│   │   │   └── [id]/vote/route.ts # POST /api/posts/:id/vote
│   │   └── user/
│   │       └── profile/route.ts # GET/PUT /api/user/profile
│   ├── page.tsx                 # Frontend routes
│   ├── login/page.tsx
│   └── profile/page.tsx
│
├── src/                          # Frontend Code
│   ├── components/              # React components
│   ├── lib/                     # Utilities & API client
│   │   ├── api.ts              # API client (abstracts API calls)
│   │   └── constants.ts
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript types
│   └── assets/                  # Images, SVGs
```

## Key Principles

### 1. Clear Separation
- **Backend:** All logic in `app/api/`
- **Frontend:** All UI in `src/components/` and `app/*/page.tsx`
- **API Client:** `src/lib/api.ts` abstracts all API calls

### 2. Migration Path
If you need to extract backend later:
1. Copy `app/api/` to separate service
2. Update `src/lib/api.ts` to point to new backend URL
3. Done! Frontend code doesn't change

### 3. Team Collaboration
- **Frontend Devs:** Work in `src/` and `app/*/page.tsx`
- **Backend Devs:** Work in `app/api/`
- Clear boundaries, no conflicts

## Scaling Strategy

### Phase 1: Start (Now)
- Next.js API routes for everything
- Single database
- Simple deployment

### Phase 2: Growth
- Add caching (Redis)
- Database optimization
- API route optimization
- Still in Next.js

### Phase 3: Scale (If Needed)
- Extract heavy endpoints to separate service
- Keep Next.js for web-specific routes
- Microservices for complex logic
- **Migration is easy** - just move `app/api/` code

## Complex Logic Example

Your ideology scoring can be complex and still work in Next.js:

```typescript
// app/api/posts/[id]/vote/route.ts
export async function POST(request, { params }) {
  // 1. Save vote
  await saveVote(postId, userId, vote);
  
  // 2. Recalculate post ideology (complex calculation)
  const ideology = await calculatePostIdeology(postId);
  
  // 3. Update user's ideology scores (complex algorithm)
  await updateUserIdeology(userId, postTopic, vote);
  
  // 4. Update post metadata
  await updatePostMetadata(postId, ideology);
  
  return NextResponse.json({ success: true, ideology });
}
```

This can be as complex as you need. Next.js API routes are just Node.js functions.

## When to Migrate to Separate Backend

**Only if:**
- You need to serve mobile apps (separate API)
- You need background jobs (workers, queues)
- You need microservices architecture
- Team wants strict separation

**Otherwise:** Next.js API routes work great!

## Big Company Examples

- **Vercel** (Next.js creators): Use Next.js full-stack
- **Netflix**: Uses Next.js for web, separate APIs for mobile
- **TikTok**: Uses Next.js for web layer
- **Many startups**: Start with Next.js full-stack, migrate if needed

## Conclusion

**Start with Next.js full-stack.** It's the right choice because:
1. Faster to build
2. Scales well
3. Easy to migrate later
4. Industry standard
5. Your project structure supports it

You're not locked in - you can always extract the backend later if needed!

