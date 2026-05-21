# WC26 MVP Week-1 Execution Plan (May 18-22, 2026)

Purpose: ship a stable private beta by Friday with account creation, persistent tips, and group-stage betting.

## Product Decisions (Locked)

- Use **Supabase** for final architecture (Auth + Postgres + RLS).
- Use **email magic-link / OTP flow** for MVP login/signup (password UX can wait).
- Start with a **fresh Supabase project** for this app (`wc26`, Europe region).
- Keep Supabase Data API enabled and **auto-expose new tables disabled**.
- Move group-stage fixtures from hardcoded rendering to DB-backed records (seeded from existing source).
- Preserve user tips across future releases by enforcing immutable IDs and migration-only schema updates.

## MVP Scope By Friday

### In Scope

- Landing route (`/`) is login-first for signed-out users (logo + email login flow)
- Login/signup via magic-link email
- User profile persistence in `profiles`
- Group-stage fixtures in DB and displayed in `/predict`
- Save and update score tips until kickoff
- Server-side lock enforcement after kickoff
- Basic leaderboard/points continuity
- First-login onboarding to choose `Tippreihe` count (1 or 2)

### Out of Scope (Week 1)

- Password reset/change UX polish
- Social auth providers
- Advanced admin panel
- Non-essential payout automation

## Technical Guardrails (No-ReSubmit Promise)

1. **Stable identifiers**
   - Never rotate `matches.id` once published.
   - Never detach predictions from `(league_id, user_id, prediction_row, match_id)` identity.

2. **No destructive writes**
   - No hard deletes for fixtures or predictions in normal operations.
   - Use status/state transitions and audit-friendly updates.

3. **Server-enforced deadlines**
   - Kickoff lock validated in server actions + DB constraints/policies.

4. **Migration discipline**
   - All schema changes through Drizzle migrations committed to git.
   - No production-only manual schema edits.

5. **Scoring versioning**
   - Keep scoring logic deterministic and versioned before major rule changes.

## Delivery Plan (5 Days)

## Day 1 — Monday, May 18, 2026

- Confirm Supabase `wc26` auth configuration:
  - Email provider enabled
  - Site URL set to `https://jackpotspiel.at` for production
  - Redirect allow-list includes:
    - `https://jackpotspiel.at/auth/callback`
    - `https://www.jackpotspiel.at/auth/callback` (if applicable)
    - `https://<project>.vercel.app/auth/callback`
    - `http://localhost:3000/auth/callback`
- Ensure Vercel env vars point to `wc26` (not old placeholder project).
- Apply existing Drizzle migrations.
- Run `supabase/rls.sql`.
- Seed teams + matches.

## Day 2 — Tuesday, May 19, 2026

- Verify login flow end-to-end (request link → callback → session).
- Verify `profiles` and `league_members` bootstrap logic.
- Persist predictions for all visible group-stage matches.

## Day 3 — Wednesday, May 20, 2026

- Enforce lock behavior after kickoff (server-side).
- Add user-facing lock state in UI where needed.
- Implement/save first-login `Tippreihe` selection (1 or 2 rows).

## Day 4 — Thursday, May 21, 2026

- Add minimal admin operations path:
  - verify logged-in users (`profiles`)
  - set/change `uses_two_prediction_rows` in `league_members`
- Execute full regression pass on `/predict`, `/special-picks`, `/leaderboard`.
- Verify no-tip-loss scenarios during deploy/restart.

## Day 5 — Friday, May 22, 2026

- Freeze schema for launch.
- Run launch checklist (below).
- Merge and deploy to production domain.

## Launch Checklist

- [ ] Supabase prod project = `wc26` (Europe)
- [ ] Site URL set to `https://jackpotspiel.at`
- [ ] Redirect URLs configured for localhost, Vercel preview, and prod callback
- [ ] Correct prod env vars in Vercel (all `wc26`)
- [ ] Migrations applied on prod
- [ ] `supabase/rls.sql` applied on prod
- [ ] Seed completed and verified
- [ ] Test account can log in and submit a tip
- [ ] Tip edit is rejected after kickoff
- [ ] Admin can verify users and update 1/2 `Tippreihe` membership
- [ ] Backup/export plan documented

## Supabase Project Setup (From Scratch)

1. Create project in Supabase dashboard (`wc26`, Europe).
2. Set strong DB password and store in team password manager.
3. In Authentication:
   - Enable Email provider
   - Configure URL settings (Site URL + redirect allow-list)
4. In SQL editor:
   - Run Drizzle migrations (via CI or local `npm run db:migrate`)
   - Run `supabase/rls.sql`
5. Run seed script: `npm run db:seed`
6. Validate app flows with production-like domain.

## Vercel + Branch Promotion Workflow

1. Keep `main` on placeholder only until auth + DB checks pass.
2. Deploy `dev` branch to preview and test auth callback end-to-end.
3. After verification, merge `dev` → `main`.
4. Trigger production deployment for `jackpotspiel.at`.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL=https://jackpotspiel.at`
- `SIGNUP_INVITE_CODE`
- `ADMIN_EMAILS`
- `LOCAL_TEST_USER_ENABLED=false` in production

## Risks + Mitigations

- **Old Supabase project still referenced in Vercel** → rotate env vars to `wc26` and redeploy.
- **Auth callback mismatch** → keep explicit callback allow-list for prod/preview/local.
- **Email deliverability issues** → verify sender/domain early and keep manual admin fallback.
- **Late schema changes** → freeze schema on Friday and defer non-critical changes.
- **Fixture update surprises** → update fixture rows in place; never recreate IDs.

## Immediate Next Action

Execute Day-1 checklist now: finish auth URL config, switch Vercel env vars to `wc26`, run migrations + RLS + seed, and verify magic-link callback works on both preview and `https://jackpotspiel.at`.
