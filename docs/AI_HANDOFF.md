# AI Handoff Notes

Purpose: fast context restore for future AI sessions working on this repo. This is internal/operational, not product docs.

## Repo State

- Repo path: `/home/aab/dev/wc26`
- GitHub repo: `SirIceCream/wc26`
- Active branch: `dev`
- Remote: `git@github.com:SirIceCream/wc26.git`
- Baseline before the current checkpoint: `e0973c8 Add Supabase tournament fixtures schema`
- Current checkpoint scope: local Alex test user, profile/league prediction rows, all group matches open for tips, German-first UI labels, mobile dev access, prediction save UX, and first special-tip implementation.
- Local git author was set repo-local to the GitHub noreply identity.
- Repo-local `core.sshCommand` points at `/home/aab/.ssh/id_ed25519_github`.

## Runtime

- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind, Supabase Auth/Postgres, Drizzle ORM.
- Package manager: npm.
- Key scripts:
  - `npm run dev`
  - `npm run lint`
  - `npm run build`
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:seed`
  - `npm run db:studio`
- `drizzle.config.ts` loads `.env.local` and accepts `DATABASE_URL`, `POSTGRES_URL`, or `POSTGRES_PRISMA_URL`.
- `next-env.d.ts` is generated differently by `next build`; after builds, restore the import to `./.next/dev/types/routes.d.ts` if it changes and should not be part of the diff.

## Environment And Secrets

- `.env.local` exists locally and is gitignored. Do not print its secrets in chat or docs.
- It contains Supabase URL/key, DB connection string, football-data token, FIFA config, and `APP_DATABASE_ENV=dev`.
- Current Supabase project ref is `kyiranqlzthhqagolcat`.
- This Supabase project is explicitly marked as the dev/testing database.
- Live DB marker: `app_metadata` row `database_environment=dev`.
- Use the Supabase session pooler in WSL. It can hit `maxconnsession`; keep long-lived DB clients minimal.

## Current Local Services

- Next dev server is running in tmux session `wc26-dev`.
- It is bound to all interfaces for phone testing:
  - `npm run dev -- --hostname 0.0.0.0`
- Local URL: `http://127.0.0.1:3000`
- Current Windows LAN URL: `http://10.0.0.233:3000`
- Windows forwards `10.0.0.233:3000` to the WSL server through portproxy and has an inbound firewall rule for TCP 3000.
- `next.config.ts` currently allows dev origin `10.0.0.233`; update this if the Windows LAN IP changes.
- Drizzle Studio may still exist in an old tmux session, but it should not be kept open while running migrations because Supabase pooler connections are limited.

## Database Baseline

Applied and verified earlier:

- FIFA seed fetched official 2026 data and inserted:
  - `48` teams
  - `16` stadiums
  - `104` matches
- `matches.game_id` is our chronological display id: 1 earliest kickoff through 104 final.
- `matches.fifa_match_number` keeps FIFA's official match number, which is not always chronological.
- Knockout placeholders are stored as strings in `home_placeholder` / `away_placeholder` until real teams are known.
- Provider/live scaffolding exists:
  - `match_provider_mappings`
  - `provider_sync_log`
  - live fields on `matches`
  - `admin_audit_log`
- RLS is managed in `supabase/rls.sql`; after relevant migrations, apply it manually with a one-connection Node script or Supabase SQL editor.

## Current Migration Chain

These migrations were generated/applied after `e0973c8` and are part of the current checkpoint:

- `drizzle/0004_ambitious_sabretooth.sql`
  - creates `app_metadata`
  - seeds `database_environment=dev`
- `drizzle/0005_cloudy_skin.sql`
  - adds `profiles.full_name`
  - adds `profiles.phone_number`
  - initially added `profiles.uses_two_prediction_rows`
- `drizzle/0006_shiny_edwin_jarvis.sql`
  - moves `uses_two_prediction_rows` to `league_members`
  - adds `predictions.prediction_row`
  - changes prediction uniqueness to `(league_id, user_id, match_id, prediction_row)`
  - adds FK `predictions(league_id,user_id) -> league_members(league_id,user_id)`
  - adds check that `prediction_row in (1,2)`
  - migrates any old profile flag values into league memberships before dropping the profile column

Important: `0005` and `0006` together are intentional. Do not squash casually unless also reconciling Drizzle metadata and already-applied migration history in the dev DB.

## User/Profile/League Model

- Supabase Auth owns authentication.
- Local development can bypass Supabase Auth with `LOCAL_TEST_USER_ENABLED=true`.
- Current local test user defaults:
  - id: `11111111-1111-4111-8111-111111111111`
  - email: `alex1@example.test`
  - display name: `Alex 1`
  - username: `alex-1`
- The local test user helper is development-only and returns `null` outside `NODE_ENV=development`.
- App user table is `profiles`, keyed by Supabase Auth user id.
- `profiles` fields include:
  - `id`
  - `email`
  - `username`
  - `full_name`
  - `display_name`
  - `phone_number`
  - `avatar_url`
  - `app_role`
- League membership table is `league_members`.
- `league_members.user_id -> profiles.id`.
- `league_members.uses_two_prediction_rows` is the correct location for "1 row vs 2 rows" because it is league-specific.
- `predictions.user_id -> profiles.id`.
- `predictions(league_id,user_id) -> league_members(league_id,user_id)` now enforces that predictions belong to real memberships.
- `predictions.prediction_row` is `1` or `2`.
- Row 2 predictions require `league_members.uses_two_prediction_rows=true`.

## App Data Behavior

- Main loader: `src/lib/app-data.ts`.
- User upsert happens in `ensureUserContext()`.
- Default league:
  - slug: `the-usual-suspects`
  - name: `The Usual Suspects`
- If DB/Supabase missing or errors, app falls back to JSON seed data.
- Match mapping supports team placeholders because knockout rows may not have real teams yet.
- `/predict` shows all open matches with concrete home/away team codes. This currently means the group-stage matches are tippbar.
- Knockout placeholder matches stay hidden/unpredictable until real pairings are known.
- Leaderboard now expands each member into one or two rows based on `league_members.uses_two_prediction_rows`.
- Prediction UI posts hidden `predictionRow`.
- `savePrediction` validates membership and blocks row 2 unless enabled.
- `savePrediction` also rejects matches without concrete teams and locked matches.
- `src/components/app/prediction-form-client.tsx` saves through a client submit handler so mobile users stay at the same scroll position after saving.
- Saved tips get a green saved state and a `Tipp ändern` button; edited saved tips get an amber `Ungespeicherte Änderung` state until saved again.
- `src/components/app/lock-countdown.tsx` renders deadline copy as `Noch 00d 00h 00m 00s`.
- Dates use `de-AT` formatting, for example `11. Juni · 21:00 MESZ`.
- Full team names are German via `getTeamLabel`; team abbreviations remain unchanged.
- Prediction cards show the German full team names below flags/abbreviations on mobile too.
- Stage labels are localized through `getStageLabel`, for example `Group A -> Gruppe A`.
- The dashboard progress tracker no longer shows the old `Open` count; it shows `Gespielt` and `KO-Phase`.

## Jackpot Rules Context

- The official rule PDF is stored in `/rules`.
- Additional product checklist: `docs/JACKPOT_TODO.md`.
- The game is private, invite-only, and played only among friends.
- The complete stake is paid out; there is no margin/rake.
- Accounting unit is `Tippreihe`, not only user.
- One complete row costs `115 EUR`: 104 match Euros, 5 EUR world champion pot, 5 EUR total-goals pot, 1 EUR lucky-loser pot.
- Match pots split evenly to two decimal places when multiple rows hit the exact result.
- Special pots for world champion and total goals are separate.
- Lucky loser is per `Tippreihe`.
- Match and special tips lock at the planned kickoff/deadline time. For special tips this is the planned opening kickoff: `2026-06-11T19:00:00.000Z`.
- Admin does not need unpaid-row deletion in the first flow because accounts are only created for already-paid participants.

## Special Tips Implementation

- Route: `/special-picks`.
- Persistence table: `special_predictions`.
- Persistence grain: `(league_id, user_id, prediction_row)`.
- Stored fields:
  - `champion_team_code`
  - `total_goals`
- Server actions:
  - `saveChampionPrediction`
  - `saveTotalGoalsPrediction`
- Dashboard cards are rendered by `src/components/app/special-pick-card.tsx`.
- Special-pick form/search UI is rendered by `src/components/app/special-picks-client.tsx`.
- The team picker shows flag, German country name, and abbreviation; search matches German name and code.
- RLS allows users to read their own special tips before deadline; other special tips become visible only after tournament-start lock.
- The local dev DB has been migrated through migration 0007 and `supabase/rls.sql` was reapplied.

## RLS Notes

- RLS enabled on all app tables.
- `app_metadata` can be read by anon/authenticated; admins can manage it.
- Tournament fixture/team/stadium reads are open to authenticated users.
- Admin-only writes for teams/stadiums/matches/provider mappings/provider logs/audit logs.
- Prediction insert/update policy requires:
  - current user owns prediction
  - user is league member
  - `prediction_row` is 1 or 2
  - row 2 requires membership flag
  - match is unlocked and has real home/away team codes

## Known Operational Gotchas

- Supabase session pooler free tier can hit `maxconnsession`. Stop `wc26-dev` and/or `wc26-studio`, wait a few seconds, then retry.
- Drizzle Studio keeps DB connections open. Avoid running migrations while Studio and Next dev are both open.
- `npm run db:migrate` has applied migrations 0004-0006 to the dev DB already.
- After RLS edits, rerun `supabase/rls.sql`; Drizzle migrations do not apply that file automatically.
- Do not commit `.env.local`.
- `next-env.d.ts` is rewritten by `next build`; restore it to `./.next/dev/types/routes.d.ts` before committing local dev checkpoints if needed.

## Validation Already Run For Current Local Diff

- `npm run lint`: passed.
- `npm run build`: passed.
- Rendered HTML checks were run against `/`, `/predict`, and `/fixtures` for:
  - German date strings such as `11. Juni`
  - German team names such as `Südafrika` and `Tschechien`
  - German stage labels such as `Gruppe A`
  - removal of the old progress tracker `Open` field on the dashboard
- Live DB verification showed:
  - `league_members.uses_two_prediction_rows` exists, boolean default false, not null.
  - `predictions.prediction_row` exists, integer default 1, not null.
  - constraints `predictions_league_user_membership_fk` and `predictions_prediction_row_check` exist.

## Likely Next Steps

- Decide user/admin workflow for toggling `league_members.uses_two_prediction_rows`.
- Build the mechanism that reveals R32 matches once group standings are final.
- Build admin UI/menu for:
  - users/profiles
  - league members and row-count toggle
  - match hotfixes
  - provider sync status
  - audit log
