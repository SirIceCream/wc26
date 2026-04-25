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

Seed the tournament data:

```bash
npm run db:seed
```

The seed script fetches the official FIFA World Cup 2026 season data and
upserts teams, stadiums, all 104 matches, and FIFA provider mappings.

Visualize the database locally with Drizzle Studio:

```bash
npm run db:studio
```

You can also inspect and edit tables in the Supabase dashboard under Table
Editor. Use the app's admin screens for live tournament hotfixes once they are
implemented, so changes can be written to the audit log.

After migrations, run `supabase/rls.sql` in the Supabase SQL editor to enable
private league policies.

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
- Add football-data match mappings once the World Cup competition is available.
- Build admin screens for match hotfixes, provider sync status, and audit log review.
