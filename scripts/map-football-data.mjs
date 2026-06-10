import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import postgres from "postgres";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const provider = "football-data";
const connectionString = process.env.DATABASE_URL;
const baseUrl = (
  process.env.FOOTBALL_DATA_BASE_URL ?? "https://api.football-data.org/v4"
).replace(/\/+$/, "");
const competitionCode = process.env.FOOTBALL_DATA_COMPETITION_CODE ?? "WC";
const season = process.env.FOOTBALL_DATA_SEASON ?? "2026";
const token = process.env.FOOTBALL_DATA_API_TOKEN;
const dryRun = process.argv.includes("--dry-run");

const teamCodeAliases = {
  URY: "URU",
};

if (!connectionString) {
  console.error("DATABASE_URL is required. Add it to .env.local before mapping.");
  process.exit(1);
}

if (!token) {
  console.error(
    "FOOTBALL_DATA_API_TOKEN is required. Add it to .env.local before mapping.",
  );
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

function normalizeTeamCode(code) {
  if (!code) return null;

  const normalized = String(code).trim().toUpperCase();

  return teamCodeAliases[normalized] ?? normalized;
}

function kickoffMinute(value) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return null;

  return Math.floor(time / 60_000) * 60_000;
}

function localMatchKey(match) {
  const kickoff = kickoffMinute(match.kickoff_at);
  const home = normalizeTeamCode(match.home_team_code);
  const away = normalizeTeamCode(match.away_team_code);

  if (kickoff === null || !home || !away) return null;

  return `${kickoff}:${home}:${away}`;
}

function matchKickoffKey(value) {
  const kickoff = kickoffMinute(value);

  return kickoff === null ? null : String(kickoff);
}

function providerMatchKey(match) {
  const kickoff = kickoffMinute(match.utcDate);
  const home = normalizeTeamCode(match.homeTeam?.tla);
  const away = normalizeTeamCode(match.awayTeam?.tla);

  if (kickoff === null || !home || !away) return null;

  return `${kickoff}:${home}:${away}`;
}

function addUnique(map, key, value, label) {
  if (!key) return;

  const existing = map.get(key);

  if (existing) {
    throw new Error(`Duplicate ${label} mapping key ${key}`);
  }

  map.set(key, value);
}

function addUniqueKickoff(map, duplicates, key, value) {
  if (!key) return;

  if (map.has(key)) {
    duplicates.add(key);
    map.delete(key);
    return;
  }

  if (!duplicates.has(key)) {
    map.set(key, value);
  }
}

async function fetchFootballDataMatches() {
  const response = await fetch(
    `${baseUrl}/competitions/${competitionCode}/matches?season=${season}`,
    {
      headers: {
        Accept: "application/json",
        "X-Auth-Token": token,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `football-data request failed ${response.status}: ${response.statusText}`,
    );
  }

  const payload = await response.json();

  return payload.matches ?? [];
}

try {
  const [providerMatches, localMatches] = await Promise.all([
    fetchFootballDataMatches(),
    sql`
      select
        id,
        kickoff_at,
        home_team_code,
        away_team_code
      from matches
    `,
  ]);
  const localByKey = new Map();
  const localByKickoff = new Map();
  const localDuplicateKickoffs = new Set();
  const providerByKey = new Map();
  const providerByKickoff = new Map();
  const providerDuplicateKickoffs = new Set();

  for (const match of localMatches) {
    addUnique(localByKey, localMatchKey(match), match, "local match");
    addUniqueKickoff(
      localByKickoff,
      localDuplicateKickoffs,
      matchKickoffKey(match.kickoff_at),
      match,
    );
  }

  for (const match of providerMatches) {
    addUnique(providerByKey, providerMatchKey(match), match, "provider match");
    addUniqueKickoff(
      providerByKickoff,
      providerDuplicateKickoffs,
      matchKickoffKey(match.utcDate),
      match,
    );
  }

  const mappings = [];
  const missing = [];

  for (const providerMatch of providerMatches) {
    const key = providerMatchKey(providerMatch);
    const kickoffKey = matchKickoffKey(providerMatch.utcDate);
    const localMatch =
      (key ? localByKey.get(key) : null) ??
      (kickoffKey &&
      !providerDuplicateKickoffs.has(kickoffKey) &&
      !localDuplicateKickoffs.has(kickoffKey) &&
      providerByKickoff.get(kickoffKey)?.id === providerMatch.id
        ? localByKickoff.get(kickoffKey)
        : null);

    if (!localMatch) {
      missing.push({
        id: providerMatch.id,
        key,
        home: providerMatch.homeTeam?.tla ?? null,
        away: providerMatch.awayTeam?.tla ?? null,
        utcDate: providerMatch.utcDate,
      });
      continue;
    }

    mappings.push({ localMatch, providerMatch });
  }

  if (missing.length) {
    console.error(
      `Could not map ${missing.length} of ${providerMatches.length} football-data matches.`,
    );
    console.error(JSON.stringify(missing, null, 2));
    process.exit(1);
  }

  console.log(
    `${dryRun ? "Would map" : "Mapping"} ${mappings.length} football-data matches.`,
  );

  if (!dryRun) {
    await sql.begin(async (tx) => {
      for (const { localMatch, providerMatch } of mappings) {
        const homeCode = normalizeTeamCode(providerMatch.homeTeam?.tla);
        const awayCode = normalizeTeamCode(providerMatch.awayTeam?.tla);

        if (homeCode && providerMatch.homeTeam?.id) {
          await tx`
            update teams
            set football_data_team_id = ${providerMatch.homeTeam.id},
                updated_at = now()
            where code = ${homeCode}
          `;
        }

        if (awayCode && providerMatch.awayTeam?.id) {
          await tx`
            update teams
            set football_data_team_id = ${providerMatch.awayTeam.id},
                updated_at = now()
            where code = ${awayCode}
          `;
        }

        await tx`
          update matches
          set football_data_match_id = ${providerMatch.id},
              provider_status = ${providerMatch.status},
              last_provider_sync_at = now(),
              updated_at = now()
          where id = ${localMatch.id}
        `;

        await tx`
          insert into match_provider_mappings (
            match_id,
            provider,
            provider_match_id,
            provider_payload,
            last_synced_at,
            updated_at
          )
          values (
            ${localMatch.id},
            ${provider},
            ${String(providerMatch.id)},
            ${JSON.stringify(providerMatch)}::jsonb,
            now(),
            now()
          )
          on conflict (provider, provider_match_id) do update set
            match_id = excluded.match_id,
            provider_payload = excluded.provider_payload,
            last_synced_at = now(),
            updated_at = now()
        `;
      }

      await tx`
        insert into provider_sync_log (provider, sync_type, status, message)
        values (
          ${provider},
          'mapping',
          'finished',
          ${`Mapped ${mappings.length} football-data matches.`}
        )
      `;
    });
  }

  console.log("Football-data mapping complete.");
} catch (error) {
  await sql`
    insert into provider_sync_log (provider, sync_type, status, message)
    values (
      ${provider},
      'mapping',
      'failed',
      ${error instanceof Error ? error.message : String(error)}
    )
  `.catch(() => {});

  throw error;
} finally {
  await sql.end();
}
