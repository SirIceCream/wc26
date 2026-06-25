# Knockout Team-Code Sync Runbook

Purpose: safely copy already-known FIFA knockout team sides into existing match rows without running the full seed script.

## When To Use

Use this when FIFA has started resolving Round-of-32 or later knockout placeholders, but not all pairings are complete yet.

This is useful because:

- fully known matches become tippable automatically;
- partially known matches can already show the known team/flag;
- partially known matches stay locked for predictions until both sides are known.

## What Not To Run

Do not run `npm run db:seed` for this.

`scripts/seed-matches.mjs` is a broad FIFA seed/upsert. It can update all 104 matches, including kickoff data, placeholders, scores, statuses, and provider sync metadata. For knockout reveal work, use a targeted update instead.

## Safety Rules

- Only update existing `matches` rows.
- Only target knockout match rows, currently `game_id between 73 and 88` for the Round of 32.
- Only update `home_team_code` and/or `away_team_code`.
- Keep placeholders unchanged.
- Do not create users, profiles, league members, predictions, or special predictions.
- Do not delete or recreate matches.
- Validate every FIFA team code exists in our `teams` table before writing.
- Prefer a dry-run table before the write.
- Run the write in one transaction.

## Why This Opens Matches Safely

The app has no separate knockout unlock flag.

In `src/lib/app-data.ts`, a match is considered:

- `upcoming` if either `home_team_code` or `away_team_code` is missing;
- `locked` if both teams exist but `locked_at <= now()`;
- `open` if both teams exist and `locked_at > now()`.

The `/predict` page only shows `open` matches. The prediction save action also rejects matches without both concrete team codes.

So setting only one side is safe: the match displays the known team but remains unavailable for predictions.

## Exact Command Used

From repo root:

```bash
node --env-file=.env.local - <<'NODE'
import postgres from 'postgres';

const fifaUrl = 'https://api.fifa.com/api/v3/calendar/matches?idSeason=285023&language=de&count=120';
const sqlUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!sqlUrl) throw new Error('Missing DB URL');

function code(team) {
  return team?.IdCountry ?? team?.Abbreviation ?? team?.ShortClubName ?? null;
}

const fifaRes = await fetch(fifaUrl);
if (!fifaRes.ok) {
  throw new Error(`FIFA ${fifaRes.status} ${fifaRes.statusText}`);
}

const fifaData = await fifaRes.json();
const fifaById = new Map(
  (fifaData.Results ?? []).map((match) => [String(match.IdMatch), match]),
);

const sql = postgres(sqlUrl, { max: 1 });

try {
  await sql.begin(async (tx) => {
    const dbRows = await tx`
      select
        game_id,
        fifa_match_number,
        fifa_match_id,
        home_team_code,
        away_team_code,
        home_placeholder,
        away_placeholder
      from matches
      where game_id between 73 and 88
      order by game_id asc
      for update
    `;

    const teamRows = await tx`select code from teams`;
    const knownTeamCodes = new Set(teamRows.map((row) => row.code));
    const updates = [];

    for (const row of dbRows) {
      const fifa = fifaById.get(String(row.fifa_match_id));
      const home = code(fifa?.Home);
      const away = code(fifa?.Away);

      if (
        (home && !knownTeamCodes.has(home)) ||
        (away && !knownTeamCodes.has(away))
      ) {
        throw new Error(
          `Unknown team code from FIFA for game ${row.game_id}: ${home ?? '-'}-${away ?? '-'}`,
        );
      }

      if (home || away) {
        const [updated] = await tx`
          update matches
          set
            home_team_code = coalesce(${home}, home_team_code),
            away_team_code = coalesce(${away}, away_team_code),
            updated_at = now()
          where id = (
            select id from matches where game_id = ${row.game_id}
          )
          returning
            game_id,
            fifa_match_number,
            home_team_code,
            away_team_code,
            home_placeholder,
            away_placeholder
        `;

        updates.push({
          game: updated.game_id,
          fifaNo: updated.fifa_match_number,
          before: `${row.home_team_code ?? row.home_placeholder}-${row.away_team_code ?? row.away_placeholder}`,
          after: `${updated.home_team_code ?? updated.home_placeholder}-${updated.away_team_code ?? updated.away_placeholder}`,
        });
      }
    }

    console.table(updates);
    console.log(`updated rows: ${updates.length}`);
  });
} finally {
  await sql.end();
}
NODE
```

## Verification Query Used

```bash
node --env-file=.env.local - <<'NODE'
import postgres from 'postgres';

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

const sql = postgres(url, { max: 1 });

try {
  await sql`begin read only`;

  const rows = await sql`
    select
      game_id,
      fifa_match_number,
      home_team_code,
      away_team_code,
      home_placeholder,
      away_placeholder,
      locked_at,
      case
        when home_team_code is not null
          and away_team_code is not null
          and locked_at > now()
          then 'open'
        when home_team_code is not null
          or away_team_code is not null
          then 'partial'
        else 'placeholder'
      end as app_visibility
    from matches
    where game_id between 73 and 88
    order by game_id asc
  `;

  await sql`commit`;

  console.table(
    rows.map((row) => ({
      game: row.game_id,
      fifaNo: row.fifa_match_number,
      match: `${row.home_team_code ?? row.home_placeholder}-${row.away_team_code ?? row.away_placeholder}`,
      visibility: row.app_visibility,
    })),
  );

  console.log(
    JSON.stringify(
      {
        openForTips: rows
          .filter((row) => row.app_visibility === 'open')
          .map((row) => row.game_id),
        partialOnly: rows
          .filter((row) => row.app_visibility === 'partial')
          .map((row) => row.game_id),
      },
      null,
      2,
    ),
  );
} finally {
  await sql.end();
}
NODE
```

## Result On 2026-06-25

The sync updated these existing rows:

| Game ID | FIFA No. | Before | After |
| --- | ---: | --- | --- |
| 73 | 73 | `2A-2B` | `RSA-CAN` |
| 74 | 76 | `1C-2F` | `BRA-2F` |
| 75 | 74 | `1E-3ABCDF` | `GER-3ABCDF` |
| 76 | 75 | `1F-2C` | `1F-MAR` |
| 79 | 79 | `1A-3CEFHI` | `MEX-3CEFHI` |
| 82 | 81 | `1D-3BEFIJ` | `USA-3BEFIJ` |
| 85 | 85 | `1B-3EFGIJ` | `SUI-3EFGIJ` |
| 87 | 86 | `1J-2H` | `ARG-2H` |

Verification after the update:

- `openForTips`: `[73]`
- `partialOnly`: `[74, 75, 76, 79, 82, 85, 87]`

