-- Run this in the Supabase SQL editor after Drizzle migrations.
-- These policies keep the app private to authenticated league members and
-- reserve tournament hotfixes/provider logs for app admins.

alter table public.profiles enable row level security;
alter table public.app_metadata enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.teams enable row level security;
alter table public.stadiums enable row level security;
alter table public.matches enable row level security;
alter table public.match_provider_mappings enable row level security;
alter table public.provider_sync_log enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.predictions enable row level security;

create or replace function public.is_league_member(target_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members
    where league_members.league_id = target_league_id
      and league_members.user_id = auth.uid()
  );
$$;

create or replace function public.current_app_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select profiles.app_role
      from public.profiles
      where profiles.id = auth.uid()
      limit 1
    ),
    'user'
  );
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin';
$$;

grant execute on function public.is_league_member(uuid) to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "profiles are visible to authenticated users" on public.profiles;
drop policy if exists "users can insert their own profile" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;
drop policy if exists "admins can update profiles" on public.profiles;
drop policy if exists "anyone can read app metadata" on public.app_metadata;
drop policy if exists "admins can manage app metadata" on public.app_metadata;
drop policy if exists "members can read their leagues" on public.leagues;
drop policy if exists "members can read their league memberships" on public.league_members;
drop policy if exists "authenticated users can read teams" on public.teams;
drop policy if exists "admins can manage teams" on public.teams;
drop policy if exists "authenticated users can read stadiums" on public.stadiums;
drop policy if exists "admins can manage stadiums" on public.stadiums;
drop policy if exists "authenticated users can read fixtures" on public.matches;
drop policy if exists "admins can manage fixtures" on public.matches;
drop policy if exists "admins can read provider mappings" on public.match_provider_mappings;
drop policy if exists "admins can manage provider mappings" on public.match_provider_mappings;
drop policy if exists "admins can read provider sync logs" on public.provider_sync_log;
drop policy if exists "admins can create provider sync logs" on public.provider_sync_log;
drop policy if exists "admins can read audit logs" on public.admin_audit_log;
drop policy if exists "admins can create audit logs" on public.admin_audit_log;
drop policy if exists "members can read league predictions after joining" on public.predictions;
drop policy if exists "members can create their own unlocked predictions" on public.predictions;
drop policy if exists "members can update their own unlocked predictions" on public.predictions;

create policy "profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users can insert their own profile"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and app_role = 'user'
);

create policy "users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and app_role = public.current_app_role()
);

create policy "admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_app_admin())
with check (true);

create policy "anyone can read app metadata"
on public.app_metadata for select
to anon, authenticated
using (true);

create policy "admins can manage app metadata"
on public.app_metadata for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "members can read their leagues"
on public.leagues for select
to authenticated
using (public.is_league_member(id));

create policy "members can read their league memberships"
on public.league_members for select
to authenticated
using (public.is_league_member(league_id));

create policy "authenticated users can read teams"
on public.teams for select
to authenticated
using (true);

create policy "admins can manage teams"
on public.teams for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "authenticated users can read stadiums"
on public.stadiums for select
to authenticated
using (true);

create policy "admins can manage stadiums"
on public.stadiums for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "authenticated users can read fixtures"
on public.matches for select
to authenticated
using (true);

create policy "admins can manage fixtures"
on public.matches for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "admins can read provider mappings"
on public.match_provider_mappings for select
to authenticated
using (public.is_app_admin());

create policy "admins can manage provider mappings"
on public.match_provider_mappings for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "admins can read provider sync logs"
on public.provider_sync_log for select
to authenticated
using (public.is_app_admin());

create policy "admins can create provider sync logs"
on public.provider_sync_log for insert
to authenticated
with check (public.is_app_admin());

create policy "admins can read audit logs"
on public.admin_audit_log for select
to authenticated
using (public.is_app_admin());

create policy "admins can create audit logs"
on public.admin_audit_log for insert
to authenticated
with check (public.is_app_admin());

create policy "members can read league predictions after joining"
on public.predictions for select
to authenticated
using (public.is_league_member(league_id));

create policy "members can create their own unlocked predictions"
on public.predictions for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_league_member(league_id)
  and prediction_row in (1, 2)
  and (
    prediction_row = 1
    or exists (
      select 1
      from public.league_members
      where league_members.league_id = predictions.league_id
        and league_members.user_id = auth.uid()
        and league_members.uses_two_prediction_rows
    )
  )
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.locked_at > now()
      and matches.home_team_code is not null
      and matches.away_team_code is not null
  )
);

create policy "members can update their own unlocked predictions"
on public.predictions for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_league_member(league_id)
  and prediction_row in (1, 2)
  and (
    prediction_row = 1
    or exists (
      select 1
      from public.league_members
      where league_members.league_id = predictions.league_id
        and league_members.user_id = auth.uid()
        and league_members.uses_two_prediction_rows
    )
  )
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.locked_at > now()
      and matches.home_team_code is not null
      and matches.away_team_code is not null
  )
)
with check (
  user_id = auth.uid()
  and public.is_league_member(league_id)
  and prediction_row in (1, 2)
  and (
    prediction_row = 1
    or exists (
      select 1
      from public.league_members
      where league_members.league_id = predictions.league_id
        and league_members.user_id = auth.uid()
        and league_members.uses_two_prediction_rows
    )
  )
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.locked_at > now()
      and matches.home_team_code is not null
      and matches.away_team_code is not null
  )
);
