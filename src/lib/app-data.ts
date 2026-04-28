import { asc, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import {
  leagueMembers,
  leagues,
  matches,
  predictions,
  profiles,
  specialPredictions,
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
} from "@/lib/tournament-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SPECIAL_PICKS_LOCK_AT } from "@/lib/special-picks/constants";
import { formatViennaMatchTime } from "@/lib/time";
import { getCurrentUser } from "./auth/session";

export const DEFAULT_LEAGUE_SLUG = "the-usual-suspects";
const DEFAULT_LEAGUE_NAME = "The Usual Suspects";

type UserContext = {
  displayName: string | null;
  leagueId: string | null;
  profileId: string | null;
  userEmail: string | null;
};

export type AppData = {
  connected: boolean;
  hasAdditionalTippreihe: boolean;
  leagueId: string | null;
  leaderboard: LeaderboardRow[];
  predictionMatches: Match[];
  predictionEntries: PredictionEntry[];
  recentResults: Match[];
  specialPickDeadlineAt: string;
  specialPredictions: SpecialPredictionsByRow;
  todayMatches: Match[];
  tournamentProgress: TournamentProgress;
  upcomingMatches: Match[];
  userDisplayName: string | null;
  userEmail: string | null;
};

export type SpecialPrediction = {
  championTeamCode: string | null;
  predictionRow: number;
  totalGoals: number | null;
};

export type SpecialPredictionsByRow = Record<number, SpecialPrediction>;

export type TournamentStageProgress = {
  completed: number;
  label: string;
  total: number;
};

export type TournamentProgress = {
  completedMatches: number;
  nextKnockoutDate: string;
  stages: TournamentStageProgress[];
  totalMatches: number;
};

const tournamentStageTotals = [
  { label: "Gruppe", total: 72 },
  { label: "R32", total: 16 },
  { label: "R16", total: 8 },
  { label: "QF", total: 4 },
  { label: "SF", total: 2 },
  { label: "F", total: 2 },
];

function buildTournamentProgress(completedMatches = 0): TournamentProgress {
  let remainingCompleted = completedMatches;

  return {
    completedMatches,
    nextKnockoutDate: "28. Juni",
    stages: tournamentStageTotals.map((stage) => {
      const completed = Math.min(stage.total, Math.max(0, remainingCompleted));
      remainingCompleted -= completed;

      return {
        ...stage,
        completed,
      };
    }),
    totalMatches: tournamentStageTotals.reduce(
      (total, stage) => total + stage.total,
      0,
    ),
  };
}

function seedData(
  userEmail: string | null = null,
  userDisplayName = "Alex 1",
): AppData {
  return {
    connected: false,
    hasAdditionalTippreihe: seedPredictionEntries.some(
      (entry) => entry.isAdditional,
    ),
    leagueId: null,
    leaderboard: seedLeaderboard,
    predictionMatches: [...seedTodayMatches, ...seedUpcomingMatches].filter(
      (match) => match.status === "open",
    ),
    predictionEntries: seedPredictionEntries,
    recentResults: seedRecentResults,
    specialPickDeadlineAt: SPECIAL_PICKS_LOCK_AT,
    specialPredictions: {},
    todayMatches: seedTodayMatches,
    tournamentProgress: buildTournamentProgress(0),
    upcomingMatches: seedUpcomingMatches,
    userDisplayName,
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

function stringMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function ensureUserContext(): Promise<UserContext> {
  const user = await getCurrentUser();

  if (!user || !isDatabaseConfigured()) {
    return {
      displayName:
        stringMetadata(user?.user_metadata, "display_name") ??
        stringMetadata(user?.user_metadata, "full_name") ??
        (user?.email ? displayNameFromUser(user.email) : null),
      leagueId: null,
      profileId: user?.id ?? null,
      userEmail: user?.email ?? null,
    };
  }

  const db = getDb();
  const email = user.email ?? null;
  const metadata = user.user_metadata;
  const displayName =
    stringMetadata(metadata, "display_name") ??
    stringMetadata(metadata, "full_name") ??
    displayNameFromUser(email ?? undefined);
  const fullName = stringMetadata(metadata, "full_name") ?? displayName;
  const username =
    stringMetadata(metadata, "username") ??
    usernameFromUser(user.id, email ?? undefined);
  const phoneNumber = stringMetadata(metadata, "phone_number");
  const avatarUrl = stringMetadata(metadata, "avatar_url");

  await db
    .insert(profiles)
    .values({
      id: user.id,
      email,
      username,
      fullName,
      displayName,
      phoneNumber,
      avatarUrl,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email,
        username,
        fullName,
        displayName,
        phoneNumber,
        avatarUrl,
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
      displayName,
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
    displayName,
    leagueId: league.id,
    profileId: user.id,
    userEmail: email,
  };
}

function inferStatus(match: {
  status: string;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  lockedAt: Date;
}): MatchStatus {
  if (match.status === "live") return "live";
  if (match.status === "done" || (match.homeScore !== null && match.awayScore !== null)) {
    return "done";
  }
  if (!match.homeTeamCode || !match.awayTeamCode) return "upcoming";
  if (match.lockedAt <= new Date()) return "locked";
  return "open";
}

function mapMatch(
  match: typeof matches.$inferSelect,
  matchPredictions: (typeof predictions.$inferSelect)[] = [],
): Match {
  const status = inferStatus(match);
  const viennaTime = formatViennaMatchTime(match.kickoffAt);
  const predictionsByRow = Object.fromEntries(
    matchPredictions.map((prediction) => [
      prediction.predictionRow,
      { home: prediction.homeScore, away: prediction.awayScore },
    ]),
  );
  const primaryPrediction = matchPredictions.find(
    (prediction) => prediction.predictionRow === 1,
  );

  return {
    id: match.id,
    home: match.homeTeamCode ?? match.homePlaceholder ?? "TBD",
    away: match.awayTeamCode ?? match.awayPlaceholder ?? "TBD",
    time: viennaTime.compact,
    kickoffAt: match.kickoffAt.toISOString(),
    stage: match.groupName ?? match.stage,
    status,
    venue: match.venue ?? undefined,
    deadline: status === "open" ? "Sperrt vor Anpfiff" : undefined,
    score:
      match.homeScore !== null && match.awayScore !== null
        ? { home: match.homeScore, away: match.awayScore }
        : undefined,
    prediction: primaryPrediction
      ? { home: primaryPrediction.homeScore, away: primaryPrediction.awayScore }
      : null,
    predictionsByRow,
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

  const dbMatches = await db.select().from(matches).orderBy(asc(matches.kickoffAt));
  const dbPredictions = league
    ? await db
        .select()
        .from(predictions)
        .where(eq(predictions.leagueId, league.id))
    : [];
  const dbSpecialPredictions = league
    ? await db
        .select()
        .from(specialPredictions)
        .where(eq(specialPredictions.leagueId, league.id))
    : [];

  if (dbMatches.length === 0) {
    return null;
  }

  const currentUserPredictionsByMatch = new Map<
    string,
    (typeof predictions.$inferSelect)[]
  >();

  for (const prediction of dbPredictions) {
    if (prediction.userId !== context.profileId) continue;

    const matchPredictions =
      currentUserPredictionsByMatch.get(prediction.matchId) ?? [];
    matchPredictions.push(prediction);
    currentUserPredictionsByMatch.set(prediction.matchId, matchPredictions);
  }

  const currentUserSpecialPredictions = Object.fromEntries(
    dbSpecialPredictions
      .filter((prediction) => prediction.userId === context.profileId)
      .map((prediction) => [
        prediction.predictionRow,
        {
          championTeamCode: prediction.championTeamCode,
          predictionRow: prediction.predictionRow,
          totalGoals: prediction.totalGoals,
        },
      ]),
  ) as SpecialPredictionsByRow;

  const mappedMatches = dbMatches.map((match) =>
    mapMatch(match, currentUserPredictionsByMatch.get(match.id)),
  );
  const completedMatchCount = dbMatches.filter(
    (match) =>
      match.status === "done" ||
      (match.homeScore !== null && match.awayScore !== null),
  ).length;

  const memberRows = league
    ? await db
        .select({
          userId: leagueMembers.userId,
          usesTwoPredictionRows: leagueMembers.usesTwoPredictionRows,
          displayName: profiles.displayName,
        })
        .from(leagueMembers)
        .innerJoin(profiles, eq(leagueMembers.userId, profiles.id))
        .where(eq(leagueMembers.leagueId, league.id))
    : [];

  const matchById = new Map(mappedMatches.map((match) => [match.id, match]));
  const leaderboardRows = memberRows
    .flatMap((member) => {
      const predictionRows = member.usesTwoPredictionRows ? [1, 2] : [1];

      return predictionRows.map((predictionRow) => {
        const memberPredictions = dbPredictions.filter(
          (prediction) =>
            prediction.userId === member.userId &&
            prediction.predictionRow === predictionRow,
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
          entryLabel: `Tippreihe ${predictionRow}`,
          hasAdditionalTippreihe: member.usesTwoPredictionRows,
          isAdditionalEntry: predictionRow === 2,
          points,
          exact,
          total: memberPredictions.length,
          isCurrentUser: member.userId === context.profileId,
        };
      });
    })
    .sort((a, b) => b.points - a.points || b.exact - a.exact)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      previousRank: index + 1,
    }));

  const incompleteMatches = mappedMatches.filter((match) => match.status !== "done");
  const predictionMatches = mappedMatches.filter(
    (match) => match.status === "open",
  );
  const todayMatches = incompleteMatches.slice(0, OPENING_SLATE_MATCH_COUNT);
  const recentResults = mappedMatches.filter((match) => match.status === "done");
  const upcomingMatches = incompleteMatches.slice(OPENING_SLATE_MATCH_COUNT);
  const currentMember = memberRows.find(
    (member) => member.userId === context.profileId,
  );
  const currentUserHasTwoRows = Boolean(currentMember?.usesTwoPredictionRows);
  const currentOwnerName =
    currentMember?.displayName ??
    context.displayName ??
    context.userEmail?.split("@")[0] ??
    "Player";

  return {
    connected: true,
    hasAdditionalTippreihe: currentUserHasTwoRows,
    leagueId: league?.id ?? null,
    leaderboard: leaderboardRows,
    predictionMatches,
    predictionEntries: [
      {
        id: "row-1",
        label: "Tippreihe 1",
        ownerName: currentOwnerName,
        predictionRow: 1,
        isAdditional: false,
      },
      ...(currentUserHasTwoRows
        ? [
            {
              id: "row-2",
              label: "Tippreihe 2",
              ownerName: currentOwnerName,
              predictionRow: 2,
              isAdditional: true,
            },
          ]
        : []),
    ],
    recentResults,
    specialPickDeadlineAt: SPECIAL_PICKS_LOCK_AT,
    specialPredictions: currentUserSpecialPredictions,
    todayMatches: todayMatches.length
      ? todayMatches
      : mappedMatches.slice(0, OPENING_SLATE_MATCH_COUNT),
    tournamentProgress: buildTournamentProgress(completedMatchCount),
    upcomingMatches,
    userDisplayName: currentOwnerName,
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

  return seedData(context.userEmail, context.displayName ?? "Alex 1");
}
