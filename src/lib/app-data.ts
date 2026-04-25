import { asc, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import {
  leagueMembers,
  leagues,
  matches,
  predictions,
  profiles,
} from "@/db/schema";
import {
  OPENING_SLATE_MATCH_COUNT,
  leaderboard as seedLeaderboard,
  predictionEntries as seedPredictionEntries,
  recentResults as seedRecentResults,
  todayMatches as seedTodayMatches,
  upcomingMatches as seedUpcomingMatches,
  type LeaderboardRow,
  type Match,
  type MatchStatus,
  type PredictionEntry,
  type TeamCode,
} from "@/lib/tournament-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatViennaMatchTime } from "@/lib/time";
import { getCurrentUser } from "./auth/session";

export const DEFAULT_LEAGUE_SLUG = "the-usual-suspects";
const DEFAULT_LEAGUE_NAME = "The Usual Suspects";

type UserContext = {
  leagueId: string | null;
  profileId: string | null;
  userEmail: string | null;
};

export type AppData = {
  connected: boolean;
  hasAdditionalTippreihe: boolean;
  leagueId: string | null;
  leaderboard: LeaderboardRow[];
  predictionEntries: PredictionEntry[];
  recentResults: Match[];
  todayMatches: Match[];
  tournamentProgress: TournamentProgress;
  upcomingMatches: Match[];
  userEmail: string | null;
};

export type TournamentStageProgress = {
  completed: number;
  label: string;
  total: number;
};

export type TournamentProgress = {
  completedMatches: number;
  nextKnockoutDate: string;
  stages: TournamentStageProgress[];
  todayMatches: number;
  totalMatches: number;
};

const tournamentStageTotals = [
  { label: "Group", total: 72 },
  { label: "R32", total: 16 },
  { label: "R16", total: 8 },
  { label: "QF", total: 4 },
  { label: "SF", total: 2 },
  { label: "F", total: 2 },
];

function buildTournamentProgress(
  completedMatches = 0,
  todayMatches = OPENING_SLATE_MATCH_COUNT,
): TournamentProgress {
  let remainingCompleted = completedMatches;

  return {
    completedMatches,
    nextKnockoutDate: "Jun 28",
    stages: tournamentStageTotals.map((stage) => {
      const completed = Math.min(stage.total, Math.max(0, remainingCompleted));
      remainingCompleted -= completed;

      return {
        ...stage,
        completed,
      };
    }),
    todayMatches,
    totalMatches: tournamentStageTotals.reduce(
      (total, stage) => total + stage.total,
      0,
    ),
  };
}

function seedData(userEmail: string | null = null): AppData {
  return {
    connected: false,
    hasAdditionalTippreihe: seedPredictionEntries.some(
      (entry) => entry.isAdditional,
    ),
    leagueId: null,
    leaderboard: seedLeaderboard,
    predictionEntries: seedPredictionEntries,
    recentResults: seedRecentResults,
    todayMatches: seedTodayMatches,
    tournamentProgress: buildTournamentProgress(0, seedTodayMatches.length),
    upcomingMatches: seedUpcomingMatches,
    userEmail,
  };
}

function usernameFromUser(id: string, email?: string) {
  const prefix = email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "-") || "player";
  return `${prefix}-${id.slice(0, 8)}`.toLowerCase();
}

function displayNameFromUser(email?: string) {
  return email?.split("@")[0] || "Player";
}

async function ensureUserContext(): Promise<UserContext> {
  const user = await getCurrentUser();

  if (!user || !isDatabaseConfigured()) {
    return {
      leagueId: null,
      profileId: user?.id ?? null,
      userEmail: user?.email ?? null,
    };
  }

  const db = getDb();
  const email = user.email ?? null;
  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : displayNameFromUser(email ?? undefined);

  await db
    .insert(profiles)
    .values({
      id: user.id,
      email,
      username: usernameFromUser(user.id, email ?? undefined),
      displayName,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email,
        displayName,
        updatedAt: new Date(),
      },
    });

  await db
    .insert(leagues)
    .values({
      slug: DEFAULT_LEAGUE_SLUG,
      name: DEFAULT_LEAGUE_NAME,
      createdBy: user.id,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.slug, DEFAULT_LEAGUE_SLUG))
    .limit(1);

  if (!league) {
    return {
      leagueId: null,
      profileId: user.id,
      userEmail: email,
    };
  }

  await db
    .insert(leagueMembers)
    .values({
      leagueId: league.id,
      userId: user.id,
      role: "member",
    })
    .onConflictDoNothing();

  return {
    leagueId: league.id,
    profileId: user.id,
    userEmail: email,
  };
}

function inferStatus(match: {
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  lockedAt: Date;
}): MatchStatus {
  if (match.status === "live") return "live";
  if (match.status === "done" || (match.homeScore !== null && match.awayScore !== null)) {
    return "done";
  }
  if (match.lockedAt <= new Date()) return "locked";
  return "open";
}

function mapMatch(
  match: typeof matches.$inferSelect,
  prediction?: typeof predictions.$inferSelect,
): Match {
  const status = inferStatus(match);
  const viennaTime = formatViennaMatchTime(match.kickoffAt);

  return {
    id: match.id,
    home: match.homeTeamCode as TeamCode,
    away: match.awayTeamCode as TeamCode,
    time: viennaTime.compact,
    kickoffAt: match.kickoffAt.toISOString(),
    stage: match.stage,
    status,
    venue: match.venue ?? undefined,
    deadline: status === "open" ? "Locks before kickoff" : undefined,
    score:
      match.homeScore !== null && match.awayScore !== null
        ? { home: match.homeScore, away: match.awayScore }
        : undefined,
    prediction: prediction
      ? { home: prediction.homeScore, away: prediction.awayScore }
      : null,
  };
}

function scorePrediction(match: Match, prediction?: typeof predictions.$inferSelect) {
  if (!match.score || !prediction) return 0;

  return match.score.home === prediction.homeScore &&
    match.score.away === prediction.awayScore
    ? 3
    : 0;
}

async function loadDatabaseData(context: UserContext): Promise<AppData | null> {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.slug, DEFAULT_LEAGUE_SLUG))
    .limit(1);

  if (!league) {
    return null;
  }

  const dbMatches = await db.select().from(matches).orderBy(asc(matches.kickoffAt));
  const dbPredictions = await db
    .select()
    .from(predictions)
    .where(eq(predictions.leagueId, league.id));

  if (dbMatches.length === 0) {
    return null;
  }

  const currentUserPredictions = new Map(
    dbPredictions
      .filter((prediction) => prediction.userId === context.profileId)
      .map((prediction) => [prediction.matchId, prediction]),
  );
  const mappedMatches = dbMatches.map((match) =>
    mapMatch(match, currentUserPredictions.get(match.id)),
  );
  const completedMatchCount = dbMatches.filter(
    (match) =>
      match.status === "done" ||
      (match.homeScore !== null && match.awayScore !== null),
  ).length;

  const memberRows = await db
    .select({
      userId: leagueMembers.userId,
      displayName: profiles.displayName,
    })
    .from(leagueMembers)
    .innerJoin(profiles, eq(leagueMembers.userId, profiles.id))
    .where(eq(leagueMembers.leagueId, league.id));

  const matchById = new Map(mappedMatches.map((match) => [match.id, match]));
  const leaderboardRows = memberRows
    .map((member) => {
      const memberPredictions = dbPredictions.filter(
        (prediction) => prediction.userId === member.userId,
      );
      const points = memberPredictions.reduce((total, prediction) => {
        const match = matchById.get(prediction.matchId);
        return total + (match ? scorePrediction(match, prediction) : 0);
      }, 0);
      const exact = points / 3;

      return {
        rank: 0,
        previousRank: 0,
        name:
          member.userId === context.profileId
            ? "You"
            : member.displayName,
        ownerName: member.displayName,
        entryLabel: "Tippreihe 1",
        hasAdditionalTippreihe: false,
        isAdditionalEntry: false,
        points,
        exact,
        total: memberPredictions.length,
        isCurrentUser: member.userId === context.profileId,
      };
    })
    .sort((a, b) => b.points - a.points || b.exact - a.exact)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      previousRank: index + 1,
    }));

  if (leaderboardRows.length === 0) {
    return null;
  }

  const incompleteMatches = mappedMatches.filter((match) => match.status !== "done");
  const todayMatches = incompleteMatches.slice(0, OPENING_SLATE_MATCH_COUNT);
  const recentResults = mappedMatches.filter((match) => match.status === "done");
  const upcomingMatches = incompleteMatches.slice(OPENING_SLATE_MATCH_COUNT);

  return {
    connected: true,
    hasAdditionalTippreihe: false,
    leagueId: league.id,
    leaderboard: leaderboardRows,
    predictionEntries: [
      {
        id: "primary",
        label: "Tippreihe 1",
        ownerName: context.userEmail?.split("@")[0] ?? "Player",
        isAdditional: false,
      },
    ],
    recentResults,
    todayMatches: todayMatches.length
      ? todayMatches
      : mappedMatches.slice(0, OPENING_SLATE_MATCH_COUNT),
    tournamentProgress: buildTournamentProgress(
      completedMatchCount,
      todayMatches.length || seedTodayMatches.length,
    ),
    upcomingMatches,
    userEmail: context.userEmail,
  };
}

export async function getAppData(): Promise<AppData> {
  const context = await ensureUserContext();

  try {
    const data = await loadDatabaseData(context);

    if (data) {
      return data;
    }
  } catch (error) {
    console.error("Falling back to seeded app data:", error);
  }

  return seedData(context.userEmail);
}
