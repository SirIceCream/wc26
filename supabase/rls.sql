-- Run this in the Supabase SQL editor after Drizzle migrations.
-- These policies keep the app private to league members.

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.matches enable row level security;
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

grant execute on function public.is_league_member(uuid) to authenticated;

create policy "profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "members can read their leagues"
on public.leagues for select
to authenticated
using (public.is_league_member(id));

create policy "members can read their league memberships"
on public.league_members for select
to authenticated
using (public.is_league_member(league_id));

create policy "authenticated users can read fixtures"
on public.matches for select
to authenticated
using (true);

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
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.locked_at > now()
  )
);

create policy "members can update their own unlocked predictions"
on public.predictions for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_league_member(league_id)
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.locked_at > now()
  )
)
with check (
  user_id = auth.uid()
  and public.is_league_member(league_id)
  and exists (
    select 1
    from public.matches
    where matches.id = predictions.match_id
      and matches.locked_at > now()
  )
);
