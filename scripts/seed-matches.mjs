import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import postgres from "postgres";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const connectionString = process.env.DATABASE_URL;
const fifaBaseUrl = process.env.FIFA_API_BASE_URL ?? "https://api.fifa.com/api/v3";
const fifaSeasonId = process.env.FIFA_SEASON_ID ?? "285023";

if (!connectionString) {
  console.error("DATABASE_URL is required. Add it to .env.local before seeding.");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

function localizedName(value) {
  if (!Array.isArray(value) || value.length === 0) return null;

  return (
    value.find((entry) => entry.Locale === "en-GB")?.Description ??
    value[0]?.Description ??
    null
  );
}

async function fetchFifaJson(path) {
  const response = await fetch(`${fifaBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(
      `FIFA API request failed ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

function mapFifaStatus(status) {
  const statuses = {
    0: "done",
    1: "upcoming",
    3: "live",
    4: "abandoned",
    7: "postponed",
    8: "cancelled",
    9: "forfeited",
    10: "delayed",
    11: "interrupted",
    12: "lineups",
    13: "rescheduled",
    99: "suspended",
  };

  return statuses[status] ?? "upcoming";
}

function teamCode(team) {
  return team?.Abbreviation ?? team?.IdCountry ?? null;
}

async function seedTeam(team) {
  const code = teamCode(team);
  const name = localizedName(team.Name ?? team.TeamName) ?? team.ShortClubName;

  if (!code || !name) return;

  await sql`
    insert into teams (
      code,
      fifa_team_id,
      name,
      short_name,
      country_code,
      confederation,
      flag_url,
      updated_at
    )
    values (
      ${code},
      ${team.IdTeam ?? null},
      ${name},
      ${team.ShortClubName ?? name},
      ${team.IdCountry ?? code},
      ${team.IdConfederation ?? null},
      ${team.PictureUrl ?? null},
      now()
    )
    on conflict (code) do update set
      fifa_team_id = excluded.fifa_team_id,
      name = excluded.name,
      short_name = excluded.short_name,
      country_code = excluded.country_code,
      confederation = excluded.confederation,
      flag_url = excluded.flag_url,
      updated_at = now()
  `;
}

async function upsertStadium(stadium) {
  if (!stadium) return null;

  const name = localizedName(stadium.Name);
  const city = localizedName(stadium.CityName);

  if (!stadium.IdStadium || !name) return null;

  const [row] = await sql`
    insert into stadiums (
      fifa_stadium_id,
      name,
      city,
      country_code,
      updated_at
    )
    values (
      ${stadium.IdStadium},
      ${name},
      ${city},
      ${stadium.IdCountry ?? null},
      now()
    )
    on conflict (fifa_stadium_id) do update set
      name = excluded.name,
      city = excluded.city,
      country_code = excluded.country_code,
      updated_at = now()
    returning id
  `;

  return row?.id ?? null;
}

async function seedMatch(match, gameId) {
  const kickoffAt = match.Date;
  const stadiumId = await upsertStadium(match.Stadium);
  const venue = localizedName(match.Stadium?.Name);
  const stage = localizedName(match.StageName) ?? "Unknown";
  const groupName = localizedName(match.GroupName);
  const homeCode = teamCode(match.Home);
  const awayCode = teamCode(match.Away);
  const status = mapFifaStatus(match.MatchStatus);

  const [row] = await sql`
    insert into matches (
      game_id,
      fifa_match_id,
      fifa_match_number,
      stage,
      group_name,
      stadium_id,
      venue,
      home_team_code,
      away_team_code,
      home_placeholder,
      away_placeholder,
      scheduled_kickoff_at,
      kickoff_at,
      locked_at,
      status,
      provider_status,
      home_score,
      away_score,
      home_penalty_score,
      away_penalty_score,
      result_type,
      last_provider_sync_at,
      updated_at
    )
    values (
      ${gameId},
      ${match.IdMatch},
      ${match.MatchNumber ?? null},
      ${stage},
      ${groupName},
      ${stadiumId},
      ${venue},
      ${homeCode},
      ${awayCode},
      ${match.PlaceHolderA ?? null},
      ${match.PlaceHolderB ?? null},
      ${kickoffAt},
      ${kickoffAt},
      ${kickoffAt},
      ${status},
      ${status},
      ${match.HomeTeamScore ?? match.Home?.Score ?? null},
      ${match.AwayTeamScore ?? match.Away?.Score ?? null},
      ${match.HomeTeamPenaltyScore ?? null},
      ${match.AwayTeamPenaltyScore ?? null},
      ${match.ResultType === null ? null : String(match.ResultType)},
      now(),
      now()
    )
    on conflict (fifa_match_id) do update set
      game_id = excluded.game_id,
      fifa_match_number = excluded.fifa_match_number,
      stage = excluded.stage,
      group_name = excluded.group_name,
      stadium_id = excluded.stadium_id,
      venue = excluded.venue,
      home_team_code = excluded.home_team_code,
      away_team_code = excluded.away_team_code,
      home_placeholder = excluded.home_placeholder,
      away_placeholder = excluded.away_placeholder,
      scheduled_kickoff_at = coalesce(
        matches.scheduled_kickoff_at,
        excluded.scheduled_kickoff_at
      ),
      kickoff_at = excluded.kickoff_at,
      locked_at = excluded.locked_at,
      status = excluded.status,
      provider_status = excluded.provider_status,
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      home_penalty_score = excluded.home_penalty_score,
      away_penalty_score = excluded.away_penalty_score,
      result_type = excluded.result_type,
      last_provider_sync_at = now(),
      updated_at = now()
    returning id
  `;

  if (row?.id) {
    await sql`
      insert into match_provider_mappings (
        match_id,
        provider,
        provider_match_id,
        last_synced_at,
        updated_at
      )
      values (
        ${row.id},
        'fifa',
        ${match.IdMatch},
        now(),
        now()
      )
      on conflict (provider, provider_match_id) do update set
        match_id = excluded.match_id,
        last_synced_at = now(),
        updated_at = now()
    `;
  }
}

try {
  const [teamsResponse, matchesResponse] = await Promise.all([
    fetchFifaJson(`/competitions/teams/${fifaSeasonId}?language=en`),
    fetchFifaJson(
      `/calendar/matches?idSeason=${fifaSeasonId}&language=en&count=120`,
    ),
  ]);

  const fifaTeams = teamsResponse.Results ?? [];
  const fifaMatches = [...(matchesResponse.Results ?? [])].sort((a, b) => {
    const dateDiff = new Date(a.Date).getTime() - new Date(b.Date).getTime();
    return dateDiff || (a.MatchNumber ?? 0) - (b.MatchNumber ?? 0);
  });

  await sql`
    insert into provider_sync_log (provider, sync_type, status, message)
    values ('fifa', 'seed', 'started', 'Starting FIFA tournament seed')
  `;

  await sql`
    delete from matches
    where game_id is null
      and fifa_match_id ~ '^[0-9]{1,3}$'
  `;

  for (const team of fifaTeams) {
    await seedTeam(team);
  }

  for (const [index, match] of fifaMatches.entries()) {
    await seedMatch(match, index + 1);
  }

  await sql`
    insert into provider_sync_log (provider, sync_type, status, message)
    values (
      'fifa',
      'seed',
      'finished',
      ${`Seeded ${fifaTeams.length} teams and ${fifaMatches.length} matches.`}
    )
  `;

  console.log(`Seeded ${fifaTeams.length} teams.`);
  console.log(`Seeded ${fifaMatches.length} matches.`);
} catch (error) {
  await sql`
    insert into provider_sync_log (provider, sync_type, status, message)
    values (
      'fifa',
      'seed',
      'failed',
      ${error instanceof Error ? error.message : String(error)}
    )
  `.catch(() => {});

  throw error;
} finally {
  await sql.end();
}
