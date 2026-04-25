# WC26 Tipps

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

For LAN/mobile testing, start Next on all interfaces:

```bash
npm run dev -- --hostname 0.0.0.0
```

The current Windows dev setup forwards `10.0.0.233:3000` to the WSL dev
server. If that IP changes, update `allowedDevOrigins` in `next.config.ts` and
the Windows port proxy/firewall rule.

### Local Test User

Development can use a local login bypass by setting
`LOCAL_TEST_USER_ENABLED=true` in `.env.local`. The default test identity is
`Alex 1` / `alex1@example.test`; this is for local testing only and must stay
disabled in production.

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

Each Supabase project should identify its role in `app_metadata`. The current
testing database uses `database_environment=dev`; production must use a
separate Supabase project and marker.

App users are stored in `profiles`, keyed by the Supabase Auth user id. Besides
email, username, and display name, profiles can store `full_name`,
and `phone_number`.

League participation lives in `league_members`. The
`uses_two_prediction_rows` flag belongs there because it is league-specific:
`false` means one prediction row, `true` means two. Predictions include a
`prediction_row` column and reference the member through `(league_id, user_id)`.

Visualize the database locally with Drizzle Studio:

```bash
npm run db:studio
```

You can also inspect and edit tables in the Supabase dashboard under Table
Editor. Use the app's admin screens for live tournament hotfixes once they are
implemented, so changes can be written to the audit log.

After migrations, run `supabase/rls.sql` in the Supabase SQL editor to enable
private league policies.

## Prediction App Behavior

- All concrete group-stage matches are visible and tippbar on `/predict`.
- Knockout placeholder matches stay hidden until both teams are known.
- Saved tips stay in place without scrolling the page to the top.
- A saved tip is visually locked in; changing the score shows an unsaved-change
  state until it is saved again.
- Deadlines use the German countdown label `Noch 00d 00h 00m 00s`.
- Dates, team names, stage labels, and the main dashboard copy are German-first.

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
