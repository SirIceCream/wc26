# WC26 Predictions

Private friends-only World Cup 2026 prediction app starter.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Drizzle ORM
- npm
- Vercel-ready Next.js deployment

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in `.env.local` with your Supabase values:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=...
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

## Database

The starter schema lives in `src/db/schema/index.ts`.

Generate migrations after configuring `DATABASE_URL`:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

Seed the opening fixtures:

```bash
npm run db:seed
```

After migrations, run `supabase/rls.sql` in the Supabase SQL editor to enable
private league policies.

Open Drizzle Studio:

```bash
npm run db:studio
```

## Deployment

Connect this repository to Vercel and add the same environment variables in the
Vercel project settings.

The Vercel CLI is optional. If you want to use it without installing it globally:

```bash
npx vercel
```

## Next Steps

- Create a Supabase project.
- Configure email magic-link auth in Supabase.
- Copy the three environment values into `.env.local`.
- Run `npm run db:migrate`.
- Run `npm run db:seed`.
- Run `supabase/rls.sql` in Supabase.
- Extend the fixture seed from the opening slate to all 104 matches.
