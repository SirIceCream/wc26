import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  matchProviderMappings,
  matches,
  providerSyncLog,
} from "@/db/schema";

export const FOOTBALL_DATA_PROVIDER = "football-data";

const FOOTBALL_DATA_LOCK_KEY = 260260;
const ACTIVE_WINDOW_BEFORE_MS = 30 * 60 * 1000;
const ACTIVE_WINDOW_AFTER_MS = 4 * 60 * 60 * 1000;
const MATCH_ID_CHUNK_SIZE = 50;

const TEAM_CODE_ALIASES: Record<string, string> = {
  URY: "URU",
};

export type FootballDataStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED"
  | "AWARDED";

type FootballDataScorePart =
  | {
      home?: number | null;
      away?: number | null;
      homeTeam?: number | null;
      awayTeam?: number | null;
    }
  | null
  | undefined;

export type FootballDataTeam = {
  id: number | null;
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: FootballDataStatus | string;
  minute?: number | null;
  injuryTime?: number | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score?: {
    duration?: string | null;
    fullTime?: FootballDataScorePart;
    regularTime?: FootballDataScorePart;
    extraTime?: FootballDataScorePart;
    penalties?: FootballDataScorePart;
  } | null;
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[];
};

type Db = ReturnType<typeof getDb>;

type SyncOptions = {
  db?: Db;
  fetchMatchesByIds?: (ids: number[]) => Promise<FootballDataMatch[]>;
  now?: Date;
  revalidate?: boolean;
};

export type FootballDataSyncResult = {
  candidateCount: number;
  fetchedCount: number;
  skippedCount: number;
  status: "finished" | "skipped";
  updatedCount: number;
};

function footballDataBaseUrl() {
  return (
    process.env.FOOTBALL_DATA_BASE_URL ??
    "https://api.football-data.org/v4"
  ).replace(/\/+$/, "");
}

function footballDataCompetitionCode() {
  return process.env.FOOTBALL_DATA_COMPETITION_CODE ?? "WC";
}

function footballDataSeason() {
  return process.env.FOOTBALL_DATA_SEASON ?? "2026";
}

function footballDataToken() {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;

  if (!token) {
    throw new Error("Missing required environment variable: FOOTBALL_DATA_API_TOKEN");
  }

  return token;
}

async function fetchFootballDataJson<T>(path: string): Promise<T> {
  const response = await fetch(`${footballDataBaseUrl()}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Api-Version": "v4.1",
      "X-Auth-Token": footballDataToken(),
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(
      `football-data request failed ${response.status}: ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function fetchFootballDataCompetitionMatches() {
  const response = await fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${footballDataCompetitionCode()}/matches?season=${footballDataSeason()}`,
  );

  return response.matches ?? [];
}

export async function fetchFootballDataMatchesByIds(ids: number[]) {
  if (!ids.length) return [];

  const response = await fetchFootballDataJson<FootballDataMatchesResponse>(
    `/matches?ids=${ids.join(",")}`,
  );

  return response.matches ?? [];
}

export function normalizeFootballDataTeamCode(code: string | null | undefined) {
  if (!code) return null;

  const normalized = code.trim().toUpperCase();

  return TEAM_CODE_ALIASES[normalized] ?? normalized;
}

export function getFootballDataMatchMappingKey(match: FootballDataMatch) {
  const homeCode = normalizeFootballDataTeamCode(match.homeTeam.tla);
  const awayCode = normalizeFootballDataTeamCode(match.awayTeam.tla);
  const kickoff = Date.parse(match.utcDate);

  if (!homeCode || !awayCode || Number.isNaN(kickoff)) {
    return null;
  }

  const kickoffMinute = Math.floor(kickoff / 60_000) * 60_000;

  return `${kickoffMinute}:${homeCode}:${awayCode}`;
}

function scoreValue(part: FootballDataScorePart, side: "home" | "away") {
  const legacyKey = side === "home" ? "homeTeam" : "awayTeam";
  const value = part?.[side] ?? part?.[legacyKey];

  return typeof value === "number" ? value : null;
}

function scorePair(part: FootballDataScorePart) {
  const home = scoreValue(part, "home");
  const away = scoreValue(part, "away");

  return home === null || away === null ? null : { home, away };
}

function scoreAfterExtraTime(score: NonNullable<FootballDataMatch["score"]>) {
  const regularTime = scorePair(score.regularTime);
  const extraTime = scorePair(score.extraTime);

  if (regularTime && extraTime) {
    return {
      home: regularTime.home + extraTime.home,
      away: regularTime.away + extraTime.away,
    };
  }

  const fullTime = scorePair(score.fullTime);
  const penalties = scorePair(score.penalties);

  if (fullTime && penalties) {
    return {
      home: fullTime.home - penalties.home,
      away: fullTime.away - penalties.away,
    };
  }

  return regularTime;
}

export function mapFootballDataStatus(status: string) {
  if (status === "IN_PLAY" || status === "PAUSED") return "live";
  if (status === "FINISHED") return "done";
  if (
    status === "POSTPONED" ||
    status === "SUSPENDED" ||
    status === "CANCELLED" ||
    status === "AWARDED"
  ) {
    return "upcoming";
  }

  return null;
}

export function mapFootballDataScore(match: FootballDataMatch) {
  const score = match.score;
  const duration = score?.duration ?? null;
  const penalties = scorePair(score?.penalties);
  const fullTime = scorePair(score?.fullTime);
  const finalScore =
    match.status === "FINISHED" && duration === "PENALTY_SHOOTOUT" && score
      ? scoreAfterExtraTime(score)
      : fullTime;

  return {
    awayPenaltyScore: penalties?.away ?? null,
    awayScore: finalScore?.away ?? null,
    homePenaltyScore: penalties?.home ?? null,
    homeScore: finalScore?.home ?? null,
    resultType: duration,
  };
}

export function buildFootballDataMatchUpdate(
  match: FootballDataMatch,
  now = new Date(),
) {
  const appStatus = mapFootballDataStatus(match.status);
  const mappedScore = mapFootballDataScore(match);
  const isLive = appStatus === "live";
  const isDone = appStatus === "done";
  const shouldApplyScore = isLive || isDone;
  const update: Partial<typeof matches.$inferInsert> = {
    lastProviderSyncAt: now,
    providerStatus: match.status,
    updatedAt: now,
  };

  if (appStatus) {
    update.status = appStatus;
  }

  if (isLive) {
    update.liveMinute =
      typeof match.minute === "number" && Number.isFinite(match.minute)
        ? match.minute
        : null;
    update.liveInjuryTime =
      typeof match.injuryTime === "number" && Number.isFinite(match.injuryTime)
        ? match.injuryTime
        : null;
  } else if (appStatus) {
    update.liveMinute = null;
    update.liveInjuryTime = null;
  }

  if (
    shouldApplyScore &&
    mappedScore.homeScore !== null &&
    mappedScore.awayScore !== null
  ) {
    update.homeScore = mappedScore.homeScore;
    update.awayScore = mappedScore.awayScore;
  }

  if (shouldApplyScore && (isDone || mappedScore.homePenaltyScore !== null)) {
    update.homePenaltyScore = mappedScore.homePenaltyScore;
  }

  if (shouldApplyScore && (isDone || mappedScore.awayPenaltyScore !== null)) {
    update.awayPenaltyScore = mappedScore.awayPenaltyScore;
  }

  if (shouldApplyScore && (mappedScore.resultType || isDone)) {
    update.resultType = mappedScore.resultType;
  }

  return update;
}

function chunkIds(ids: number[]) {
  const chunks: number[][] = [];

  for (let index = 0; index < ids.length; index += MATCH_ID_CHUNK_SIZE) {
    chunks.push(ids.slice(index, index + MATCH_ID_CHUNK_SIZE));
  }

  return chunks;
}

async function createSyncLog(db: Db) {
  const [log] = await db
    .insert(providerSyncLog)
    .values({
      provider: FOOTBALL_DATA_PROVIDER,
      syncType: "live",
      status: "started",
      message: "Starting football-data live sync",
    })
    .returning({ id: providerSyncLog.id });

  return log.id;
}

async function finishSyncLog({
  db,
  error,
  logId,
  payload,
  status,
}: {
  db: Db;
  error?: unknown;
  logId: string;
  payload?: unknown;
  status: "finished" | "failed" | "skipped";
}) {
  await db
    .update(providerSyncLog)
    .set({
      finishedAt: new Date(),
      message:
        error instanceof Error
          ? error.message
          : error
            ? String(error)
            : status === "skipped"
              ? "Another football-data sync is already running"
              : "Football-data live sync completed",
      payload: payload ?? null,
      status,
    })
    .where(eq(providerSyncLog.id, logId));
}

async function acquireSyncLock(db: Db) {
  const [row] = await db.execute<{ locked: boolean }>(
    sql`select pg_try_advisory_lock(${FOOTBALL_DATA_LOCK_KEY}) as locked`,
  );

  return Boolean(row?.locked);
}

async function releaseSyncLock(db: Db) {
  await db.execute(sql`select pg_advisory_unlock(${FOOTBALL_DATA_LOCK_KEY})`);
}

async function getActiveMappedMatches(db: Db, now: Date) {
  const rows = await db
    .select({
      footballDataMatchId: matches.footballDataMatchId,
      kickoffAt: matches.kickoffAt,
      status: matches.status,
    })
    .from(matches)
    .where(sql`${matches.footballDataMatchId} is not null`);
  const from = now.getTime() - ACTIVE_WINDOW_BEFORE_MS;
  const to = now.getTime() + ACTIVE_WINDOW_AFTER_MS;

  return rows.filter((match) => {
    const kickoff = match.kickoffAt.getTime();

    return (
      match.footballDataMatchId !== null &&
      ((kickoff >= from && kickoff <= to) || match.status === "live")
    );
  });
}

async function applyFootballDataMatchUpdate({
  db,
  match,
  now,
}: {
  db: Db;
  match: FootballDataMatch;
  now: Date;
}) {
  const update = buildFootballDataMatchUpdate(match, now);
  const [updatedMatch] = await db
    .update(matches)
    .set(update)
    .where(eq(matches.footballDataMatchId, match.id))
    .returning({ id: matches.id });

  if (!updatedMatch) {
    return false;
  }

  await db
    .insert(matchProviderMappings)
    .values({
      lastSyncedAt: now,
      matchId: updatedMatch.id,
      provider: FOOTBALL_DATA_PROVIDER,
      providerMatchId: String(match.id),
      providerPayload: match,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        matchProviderMappings.provider,
        matchProviderMappings.providerMatchId,
      ],
      set: {
        lastSyncedAt: now,
        matchId: updatedMatch.id,
        providerPayload: match,
        updatedAt: now,
      },
    });

  return true;
}

function revalidateMatchViews(matchIds: string[]) {
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/leaderboard");
  revalidatePath("/predict");
  revalidatePath("/profile");

  for (const matchId of matchIds) {
    revalidatePath(`/match/${matchId}`);
  }
}

export async function syncFootballDataMatches(
  options: SyncOptions = {},
): Promise<FootballDataSyncResult> {
  const db = options.db ?? getDb();
  const fetchByIds = options.fetchMatchesByIds ?? fetchFootballDataMatchesByIds;
  const now = options.now ?? new Date();
  const shouldRevalidate = options.revalidate ?? true;
  const logId = await createSyncLog(db);
  let locked = false;

  try {
    locked = await acquireSyncLock(db);

    if (!locked) {
      const result = {
        candidateCount: 0,
        fetchedCount: 0,
        skippedCount: 0,
        status: "skipped",
        updatedCount: 0,
      } satisfies FootballDataSyncResult;

      await finishSyncLog({ db, logId, payload: result, status: "skipped" });
      return result;
    }

    const activeMatches = await getActiveMappedMatches(db, now);
    const providerIds = [
      ...new Set(
        activeMatches
          .map((match) => match.footballDataMatchId)
          .filter((id): id is number => id !== null),
      ),
    ];

    if (!providerIds.length) {
      const result = {
        candidateCount: 0,
        fetchedCount: 0,
        skippedCount: 0,
        status: "finished",
        updatedCount: 0,
      } satisfies FootballDataSyncResult;

      await finishSyncLog({ db, logId, payload: result, status: "finished" });
      return result;
    }

    const providerMatches = (
      await Promise.all(chunkIds(providerIds).map((ids) => fetchByIds(ids)))
    ).flat();
    let updatedCount = 0;
    const updatedMatchIds: string[] = [];

    for (const providerMatch of providerMatches) {
      const updated = await applyFootballDataMatchUpdate({
        db,
        match: providerMatch,
        now,
      });

      if (updated) {
        updatedCount += 1;
        const localMatch = activeMatches.find(
          (match) => match.footballDataMatchId === providerMatch.id,
        );

        if (localMatch?.footballDataMatchId !== null) {
          const [updatedRow] = await db
            .select({ id: matches.id })
            .from(matches)
            .where(eq(matches.footballDataMatchId, providerMatch.id))
            .limit(1);

          if (updatedRow) {
            updatedMatchIds.push(updatedRow.id);
          }
        }
      }
    }

    if (updatedCount > 0 && shouldRevalidate) {
      revalidateMatchViews(updatedMatchIds);
    }

    const result = {
      candidateCount: providerIds.length,
      fetchedCount: providerMatches.length,
      skippedCount: Math.max(0, providerMatches.length - updatedCount),
      status: "finished",
      updatedCount,
    } satisfies FootballDataSyncResult;

    await finishSyncLog({ db, logId, payload: result, status: "finished" });
    return result;
  } catch (error) {
    await finishSyncLog({ db, error, logId, status: "failed" }).catch(() => {});
    throw error;
  } finally {
    if (locked) {
      await releaseSyncLock(db).catch(() => {});
    }
  }
}
