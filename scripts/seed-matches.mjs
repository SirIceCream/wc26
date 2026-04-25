import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import postgres from "postgres";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required. Add it to .env.local before seeding.");
  process.exit(1);
}

const seedPath = new URL("../src/data/tournament-seed.json", import.meta.url);
const seed = JSON.parse(readFileSync(seedPath, "utf8"));
const sql = postgres(connectionString, { prepare: false });

try {
  for (const match of seed.matches) {
    await sql`
      insert into matches (
        fifa_match_id,
        stage,
        venue,
        home_team_code,
        away_team_code,
        kickoff_at,
        locked_at,
        status,
        updated_at
      )
      values (
        ${match.fifaMatchId},
        ${match.stage},
        ${match.venue},
        ${match.home},
        ${match.away},
        ${match.kickoffAt},
        ${match.kickoffAt},
        'open',
        now()
      )
      on conflict (fifa_match_id) do update set
        stage = excluded.stage,
        venue = excluded.venue,
        home_team_code = excluded.home_team_code,
        away_team_code = excluded.away_team_code,
        kickoff_at = excluded.kickoff_at,
        locked_at = excluded.locked_at,
        updated_at = now()
    `;
  }

  console.log(`Seeded ${seed.matches.length} opening fixtures.`);
} finally {
  await sql.end();
}
