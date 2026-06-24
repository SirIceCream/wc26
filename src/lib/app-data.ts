import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, isDatabaseConfigured } from "@/db";
import {
  leagueMembers,
  leagues,
  matches,
  predictions,
  profiles,
  specialPredictions,
  userChangelogAcknowledgements,
} from "@/db/schema";
import { ACTIVE_CHANGELOG, type ActiveChangelog } from "@/lib/changelog";
import {
  OPENING_SLATE_MATCH_COUNT,
  leaderboard as seedLeaderboard,
  predictionEntries as seedPredictionEntries,
  recentResults as seedRecentResults,
  todayMatches as seedTodayMatches,
  upcomingMatches as seedUpcomingMatches,
  type LeaderboardRow,
  type Match,
  type MatchSide,
  type MatchStatus,
  type PredictionEntry,
} from "@/lib/tournament-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SPECIAL_PICKS_LOCK_AT } from "@/lib/special-picks/constants";
import { formatViennaMatchTime } from "@/lib/time";
import { getCurrentUser } from "./auth/session";

export const DEFAULT_LEAGUE_SLUG = "the-usual-suspects";
const DEFAULT_LEAGUE_NAME = "Private League";

type UserContext = {
  displayName: string | null;
  leagueId: string | null;
  onboardingCompleted: boolean;
  profileId: string | null;
  userEmail: string | null;
};

export type AppData = {
  activeChangelog: ActiveChangelog | null;
  connected: boolean;
  hasAdditionalTippreihe: boolean;
  leagueId: string | null;
  leaderboard: LeaderboardRow[];
  missedPredictionCount: number;
  predictionMatches: Match[];
  predictionEntries: PredictionEntry[];
  profileResults: ProfileResultRow[];
  recentResults: Match[];
  specialPickDeadlineAt: string;
  specialPickRevealEntries: SpecialPickRevealEntry[];
  specialPicksRevealable: boolean;
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

export type SpecialPickRevealEntry = {
  id: string;
  championTeamCode: string | null;
  entryLabel: string;
  entryName: string;
  ownerName: string;
  predictionRow: number;
  totalGoals: number | null;
  isCurrentUser: boolean;
};

export type ProfileResultRow = {
  id: string;
  matchId: string;
  gameId: number | null;
  kickoffAt: string;
  time: string;
  stage: string;
  home: MatchSide;
  away: MatchSide;
  entryLabel: string;
  predictionRow: number;
  predictedScore: { home: number; away: number } | null;
  finalScore: { home: number; away: number };
  outcome: "hit" | "miss" | "no-tip";
  payoutEuros: number;
};

export type MatchPredictionSubmission = {
  id: string;
  displayName: string;
  entryName: string;
  entryLabel: string;
  predictionRow: number;
  username?: string;
  homeScore: number;
  awayScore: number;
  isCurrentUser: boolean;
  isNoTip?: boolean;
};

export type MatchPredictionGroup = {
  scoreline: string;
  homeScore: number | null;
  awayScore: number | null;
  count: number;
  possibleWinEuros: number;
  isCurrentScore: boolean;
  isFinalScore: boolean;
  isImpossible: boolean;
  isNoTip: boolean;
  submissions: MatchPredictionSubmission[];
};

export type UserPotentialWin = {
  entryLabel: string;
  scoreline: string;
  isImpossible?: boolean;
  possibleWinEuros: number | null;
};

export type MatchIntegrityData = {
  connected: boolean;
  leagueId: string;
  match: Match;
  pot: NonNullable<Match["pot"]>;
  predictionEntries: PredictionEntry[];
  revealAllPredictions: boolean;
  submissions: MatchPredictionSubmission[];
  groups: MatchPredictionGroup[];
  userPotentialWins: UserPotentialWin[];
  totalTippreihen: number;
};

export type PlayerProfileData = {
  connected: boolean;
  displayName: string;
  isCurrentUser: boolean;
  leaderboardEntries: LeaderboardRow[];
  leagueId: string | null;
  predictionEntries: PredictionEntry[];
  profileResults: ProfileResultRow[];
  specialPickDeadlineAt: string;
  specialPicksRevealable: boolean;
  specialPredictions: SpecialPredictionsByRow;
  tournamentProgress: TournamentProgress;
  username: string;
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
  totalGoals: number;
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

function buildTournamentProgress(
  completedMatches = 0,
  totalGoals = 0,
): TournamentProgress {
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
    totalGoals,
    totalMatches: tournamentStageTotals.reduce(
      (total, stage) => total + stage.total,
      0,
    ),
  };
}

function countTournamentGoals(matchRows: (typeof matches.$inferSelect)[]) {
  return matchRows.reduce((total, match) => {
    if (match.homeScore === null || match.awayScore === null) return total;

    return total + match.homeScore + match.awayScore;
  }, 0);
}

function seedData(
  userEmail: string | null = null,
  userDisplayName = "Alex 1",
): AppData {
  return {
    activeChangelog: null,
    connected: false,
    hasAdditionalTippreihe: seedPredictionEntries.some(
      (entry) => entry.isAdditional,
    ),
    leagueId: null,
    leaderboard: seedLeaderboard,
    missedPredictionCount: 0,
    predictionMatches: [...seedTodayMatches, ...seedUpcomingMatches].filter(
      (match) => match.status === "open",
    ),
    predictionEntries: seedPredictionEntries,
    profileResults: [],
    recentResults: seedRecentResults,
    specialPickDeadlineAt: SPECIAL_PICKS_LOCK_AT,
    specialPickRevealEntries: [],
    specialPicksRevealable: false,
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
      onboardingCompleted: false,
      profileId: user?.id ?? null,
      userEmail: user?.email ?? null,
    };
  }

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
  const isLocalTestUser = user.app_metadata.provider === "local-test";

  try {
    const db = getDb();

    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile && isLocalTestUser) {
      [profile] = await db
        .insert(profiles)
        .values({
          id: user.id,
          email,
          username,
          fullName,
          displayName,
          phoneNumber,
          avatarUrl,
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .returning();
    }

    if (!profile) {
      return {
        displayName,
        leagueId: null,
        onboardingCompleted: false,
        profileId: user.id,
        userEmail: email,
      };
    }

    const currentDisplayName = profile.displayName ?? displayName;

    if (isLocalTestUser) {
      await db
        .insert(leagues)
        .values({
          slug: DEFAULT_LEAGUE_SLUG,
          name: DEFAULT_LEAGUE_NAME,
          createdBy: user.id,
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.slug, DEFAULT_LEAGUE_SLUG))
      .limit(1);

    if (!league) {
      return {
        displayName: currentDisplayName,
        leagueId: null,
        onboardingCompleted: Boolean(profile.onboardingCompleted),
        profileId: user.id,
        userEmail: email,
      };
    }

    if (isLocalTestUser) {
      await db
        .insert(leagueMembers)
        .values({
          leagueId: league.id,
          userId: user.id,
          role: "member",
        })
        .onConflictDoNothing();
    }

    return {
      displayName: currentDisplayName,
      leagueId: league.id,
      onboardingCompleted: Boolean(profile.onboardingCompleted),
      profileId: user.id,
      userEmail: email,
    };
  } catch (error) {
    console.error("Falling back to seeded user context:", error);

    return {
      displayName,
      leagueId: null,
      onboardingCompleted: true,
      profileId: user.id,
      userEmail: email,
    };
  }
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
  if (match.status === "done") {
    return "done";
  }
  if (!match.homeTeamCode || !match.awayTeamCode) return "upcoming";
  if (match.lockedAt <= new Date()) return "locked";
  return "open";
}

function mapMatch(
  match: typeof matches.$inferSelect,
  matchPredictions: (typeof predictions.$inferSelect)[] = [],
  pot?: Match["pot"],
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
  const liveMinute =
    status === "live" && match.liveMinute !== null
      ? `${match.liveMinute}${match.liveInjuryTime ? `+${match.liveInjuryTime}` : ""}'`
      : undefined;

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
    minute: liveMinute,
    score:
      (status === "live" || status === "done") &&
      match.homeScore !== null &&
      match.awayScore !== null
        ? { home: match.homeScore, away: match.awayScore }
        : undefined,
    prediction: primaryPrediction
      ? { home: primaryPrediction.homeScore, away: primaryPrediction.awayScore }
      : null,
    predictionsByRow,
    pot,
  };
}

function isExactPrediction(
  match: typeof matches.$inferSelect,
  prediction: typeof predictions.$inferSelect,
) {
  return (
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.homeScore === prediction.homeScore &&
    match.awayScore === prediction.awayScore
  );
}

function floorToCents(value: number) {
  return Math.floor(value * 100) / 100;
}

type DbMatch = typeof matches.$inferSelect;
type DbPrediction = typeof predictions.$inferSelect;
type DbSpecialPrediction = typeof specialPredictions.$inferSelect;
type LeagueMemberRead = {
  userId: string;
  username: string;
  usesTwoPredictionRows: boolean;
  displayName: string;
};

function predictionEntryKey(userId: string, predictionRow: number) {
  return `${userId}:${predictionRow}`;
}

function predictionMatchEntryKey(
  matchId: string,
  userId: string,
  predictionRow: number,
) {
  return `${matchId}:${predictionEntryKey(userId, predictionRow)}`;
}

function getEntryName(member: LeagueMemberRead, predictionRow: number) {
  return member.usesTwoPredictionRows
    ? `${member.displayName} ${predictionRow}`
    : member.displayName;
}

function getPredictionRows(member: Pick<LeagueMemberRead, "usesTwoPredictionRows">) {
  return member.usesTwoPredictionRows ? [1, 2] : [1];
}

function buildJackpotState(
  dbMatches: DbMatch[],
  dbPredictions: DbPrediction[],
  memberRows: LeagueMemberRead[],
) {
  const totalTippreihen = memberRows.reduce(
    (total, member) => total + (member.usesTwoPredictionRows ? 2 : 1),
    0,
  );
  const basePotEuros = totalTippreihen;
  const winningsByEntry = new Map<string, number>();
  const payoutByMatchEntry = new Map<string, number>();
  const potByMatchId = new Map<string, NonNullable<Match["pot"]>>();
  let carryInEuros = 0;
  let hasPendingUnsettledMatch = false;

  const sortedPotMatches = [...dbMatches].sort((a, b) => {
    const kickoffDiff = a.kickoffAt.getTime() - b.kickoffAt.getTime();

    return kickoffDiff || (a.gameId ?? 0) - (b.gameId ?? 0);
  });

  for (const match of sortedPotMatches) {
    const carryForMatch = hasPendingUnsettledMatch ? 0 : carryInEuros;
    const totalPotEuros = basePotEuros + carryForMatch;
    const matchPredictions = dbPredictions.filter(
      (prediction) => prediction.matchId === match.id,
    );
    const isSettled =
      match.status === "done" &&
      match.homeScore !== null &&
      match.awayScore !== null;
    const winningPredictions = isSettled
      ? matchPredictions.filter((prediction) =>
          isExactPrediction(match, prediction),
        )
      : [];
    const winnerCount = winningPredictions.length;
    const payoutPerWinnerEuros =
      winnerCount > 0 ? floorToCents(totalPotEuros / winnerCount) : 0;

    potByMatchId.set(match.id, {
      baseEuros: basePotEuros,
      carryInEuros: carryForMatch,
      isJackpot: carryForMatch > 0,
      payoutPerWinnerEuros,
      totalEuros: totalPotEuros,
      winnerCount,
    });

    if (!isSettled) {
      hasPendingUnsettledMatch = true;
      continue;
    }

    if (winnerCount === 0) {
      carryInEuros = totalPotEuros;
      continue;
    }

    for (const prediction of winningPredictions) {
      const entryKey = predictionEntryKey(
        prediction.userId,
        prediction.predictionRow,
      );
      const matchEntryKey = predictionMatchEntryKey(
        match.id,
        prediction.userId,
        prediction.predictionRow,
      );

      payoutByMatchEntry.set(matchEntryKey, payoutPerWinnerEuros);
      winningsByEntry.set(
        entryKey,
        (winningsByEntry.get(entryKey) ?? 0) + payoutPerWinnerEuros,
      );
    }

    carryInEuros = 0;
  }

  return {
    potByMatchId,
    payoutByMatchEntry,
    totalTippreihen,
    winningsByEntry,
  };
}

function buildProfileResults({
  currentMember,
  currentUserId,
  dbMatches,
  dbPredictions,
  payoutByMatchEntry,
}: {
  currentMember: LeagueMemberRead | undefined;
  currentUserId: string | null;
  dbMatches: DbMatch[];
  dbPredictions: DbPrediction[];
  payoutByMatchEntry: Map<string, number>;
}): ProfileResultRow[] {
  if (!currentMember || !currentUserId) return [];

  const predictionRows = getPredictionRows(currentMember);
  const doneMatches = dbMatches.filter(
    (match) =>
      match.status === "done" &&
      match.homeScore !== null &&
      match.awayScore !== null,
  );

  return doneMatches.flatMap((match) => {
    const matchTime = formatViennaMatchTime(match.kickoffAt);

    return predictionRows.map((predictionRow) => {
      const prediction =
        dbPredictions.find(
          (candidate) =>
            candidate.userId === currentUserId &&
            candidate.matchId === match.id &&
            candidate.predictionRow === predictionRow,
        ) ?? null;
      const hit = prediction ? isExactPrediction(match, prediction) : false;
      const payoutEuros =
        payoutByMatchEntry.get(
          predictionMatchEntryKey(match.id, currentUserId, predictionRow),
        ) ?? 0;

      return {
        id: `${match.id}-${predictionRow}`,
        matchId: match.id,
        gameId: match.gameId,
        kickoffAt: match.kickoffAt.toISOString(),
        time: matchTime.compact,
        stage: match.groupName ?? match.stage,
        home: match.homeTeamCode ?? match.homePlaceholder ?? "TBD",
        away: match.awayTeamCode ?? match.awayPlaceholder ?? "TBD",
        entryLabel: `Tippreihe ${predictionRow}`,
        predictionRow,
        predictedScore: prediction
          ? { home: prediction.homeScore, away: prediction.awayScore }
          : null,
        finalScore: {
          home: match.homeScore ?? 0,
          away: match.awayScore ?? 0,
        },
        outcome: prediction ? (hit ? "hit" : "miss") : "no-tip",
        payoutEuros,
      };
    });
  });
}

function buildSpecialPickRevealEntries({
  currentUserId,
  memberRows,
  specialPredictions,
}: {
  currentUserId: string | null;
  memberRows: LeagueMemberRead[];
  specialPredictions: DbSpecialPrediction[];
}) {
  return memberRows.flatMap((member) =>
    getPredictionRows(member).map((predictionRow) => {
      const prediction = specialPredictions.find(
        (candidate) =>
          candidate.userId === member.userId &&
          candidate.predictionRow === predictionRow,
      );

      return {
        id: `${member.userId}-${predictionRow}`,
        championTeamCode: prediction?.championTeamCode ?? null,
        entryLabel: `Tippreihe ${predictionRow}`,
        entryName: getEntryName(member, predictionRow),
        ownerName: member.displayName,
        predictionRow,
        totalGoals: prediction?.totalGoals ?? null,
        isCurrentUser: member.userId === currentUserId,
      };
    }),
  );
}

function buildSpecialPredictionsByRowForUser(
  specialPredictionRows: DbSpecialPrediction[],
  userId: string | null,
) {
  return Object.fromEntries(
    specialPredictionRows
      .filter((prediction) => prediction.userId === userId)
      .map((prediction) => [
        prediction.predictionRow,
        {
          championTeamCode: prediction.championTeamCode,
          predictionRow: prediction.predictionRow,
          totalGoals: prediction.totalGoals,
        },
      ]),
  ) as SpecialPredictionsByRow;
}

function countMissedPredictions({
  matches,
  predictionEntries,
}: {
  matches: Match[];
  predictionEntries: PredictionEntry[];
}) {
  return matches.reduce((total, match) => {
    if (!["done", "live", "locked"].includes(match.status)) {
      return total;
    }

    return (
      total +
      predictionEntries.filter(
        (entry) => !match.predictionsByRow?.[entry.predictionRow],
      ).length
    );
  }, 0);
}

function buildSubmissions({
  currentUserId,
  matchPredictions,
  memberRows,
}: {
  currentUserId: string | null;
  matchPredictions: DbPrediction[];
  memberRows: LeagueMemberRead[];
}): MatchPredictionSubmission[] {
  const memberByUserId = new Map(
    memberRows.map((member) => [member.userId, member]),
  );

  return matchPredictions
    .map((prediction) => {
      const member = memberByUserId.get(prediction.userId);
      const displayName = member?.displayName ?? "Unbekannt";
      const entryName = member
        ? getEntryName(member, prediction.predictionRow)
        : `${displayName} ${prediction.predictionRow}`;

      return {
        id: prediction.id,
        displayName,
        entryName,
        entryLabel: `Tippreihe ${prediction.predictionRow}`,
        predictionRow: prediction.predictionRow,
        username: member?.username,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        isCurrentUser: prediction.userId === currentUserId,
      };
    })
    .sort((a, b) => {
      const scorelineDiff =
        a.homeScore - b.homeScore || a.awayScore - b.awayScore;

      if (scorelineDiff) return scorelineDiff;

      return (
        a.displayName.localeCompare(b.displayName, "de-AT") ||
        a.predictionRow - b.predictionRow
      );
    });
}

function buildNoTipSubmissions({
  currentUserId,
  matchPredictions,
  memberRows,
}: {
  currentUserId: string | null;
  matchPredictions: DbPrediction[];
  memberRows: LeagueMemberRead[];
}): MatchPredictionSubmission[] {
  const submittedEntries = new Set(
    matchPredictions.map((prediction) =>
      predictionEntryKey(prediction.userId, prediction.predictionRow),
    ),
  );

  return memberRows
    .flatMap((member) =>
      getPredictionRows(member)
        .filter(
          (predictionRow) =>
            !submittedEntries.has(
              predictionEntryKey(member.userId, predictionRow),
            ),
        )
        .map((predictionRow) => ({
          id: `no-tip-${member.userId}-${predictionRow}`,
          displayName: member.displayName,
          entryName: getEntryName(member, predictionRow),
          entryLabel: `Tippreihe ${predictionRow}`,
          predictionRow,
          username: member.username,
          homeScore: -1,
          awayScore: -1,
          isCurrentUser: member.userId === currentUserId,
          isNoTip: true,
        })),
    )
    .sort(
      (a, b) =>
        a.displayName.localeCompare(b.displayName, "de-AT") ||
        a.predictionRow - b.predictionRow,
    );
}

function buildPredictionGroups({
  match,
  noTipSubmissions = [],
  pot,
  submissions,
}: {
  match: DbMatch;
  noTipSubmissions?: MatchPredictionSubmission[];
  pot: NonNullable<Match["pot"]>;
  submissions: MatchPredictionSubmission[];
}): MatchPredictionGroup[] {
  const groups = new Map<string, MatchPredictionSubmission[]>();
  const currentScoreline =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore}:${match.awayScore}`
      : null;
  const finalScoreline = match.status === "done" ? currentScoreline : null;

  for (const submission of submissions) {
    const scoreline = `${submission.homeScore}:${submission.awayScore}`;
    const group = groups.get(scoreline) ?? [];
    group.push(submission);
    groups.set(scoreline, group);
  }

  const predictionGroups: MatchPredictionGroup[] = [...groups.entries()].map(
    ([scoreline, groupedSubmissions]) => {
      const [homeScore, awayScore] = scoreline
        .split(":")
        .map((value) => Number.parseInt(value, 10));

      return {
        scoreline,
        homeScore,
        awayScore,
        count: groupedSubmissions.length,
        possibleWinEuros: floorToCents(
          pot.totalEuros / groupedSubmissions.length,
        ),
        isCurrentScore:
          match.status === "live" && currentScoreline === scoreline,
        isFinalScore: finalScoreline === scoreline,
        isImpossible:
          match.homeScore !== null &&
          match.awayScore !== null &&
          (match.status === "done"
            ? finalScoreline !== scoreline
            : homeScore < match.homeScore || awayScore < match.awayScore),
        isNoTip: false,
        submissions: groupedSubmissions,
      };
    },
  );

  const noTipGroups: MatchPredictionGroup[] = noTipSubmissions.length
    ? [
        {
          scoreline: "Kein Tipp",
          homeScore: null,
          awayScore: null,
          count: noTipSubmissions.length,
          possibleWinEuros: 0,
          isCurrentScore: false,
          isFinalScore: false,
          isImpossible: true,
          isNoTip: true,
          submissions: noTipSubmissions,
        },
      ]
    : [];

  return [...predictionGroups, ...noTipGroups].sort((a, b) => {
    if (a.isNoTip !== b.isNoTip) return a.isNoTip ? 1 : -1;

    const aHighlighted = a.isFinalScore || a.isCurrentScore;
    const bHighlighted = b.isFinalScore || b.isCurrentScore;

    if (aHighlighted !== bHighlighted) return aHighlighted ? -1 : 1;
    if (a.isImpossible !== b.isImpossible) return a.isImpossible ? 1 : -1;

    return (
      b.count - a.count ||
      b.possibleWinEuros - a.possibleWinEuros ||
      (a.homeScore ?? Number.POSITIVE_INFINITY) -
        (b.homeScore ?? Number.POSITIVE_INFINITY) ||
      (a.awayScore ?? Number.POSITIVE_INFINITY) -
        (b.awayScore ?? Number.POSITIVE_INFINITY)
    );
  });
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

  const dbMatches = await db
    .select()
    .from(matches)
    .orderBy(asc(matches.kickoffAt), asc(matches.gameId));
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

  const currentUserSpecialPredictions = buildSpecialPredictionsByRowForUser(
    dbSpecialPredictions,
    context.profileId,
  );

  const memberRows = league
    ? await db
        .select({
          userId: leagueMembers.userId,
          username: profiles.username,
          usesTwoPredictionRows: leagueMembers.usesTwoPredictionRows,
          displayName: profiles.displayName,
        })
        .from(leagueMembers)
        .innerJoin(profiles, eq(leagueMembers.userId, profiles.id))
        .where(eq(leagueMembers.leagueId, league.id))
    : [];

  const { potByMatchId, payoutByMatchEntry, winningsByEntry } =
    buildJackpotState(dbMatches, dbPredictions, memberRows);

  const mapDbMatch = (match: typeof matches.$inferSelect) =>
    mapMatch(
      match,
      currentUserPredictionsByMatch.get(match.id),
      potByMatchId.get(match.id),
    );
  const mappedMatches = dbMatches.map(mapDbMatch);
  const completedMatchCount = dbMatches.filter(
    (match) =>
      match.status === "done" ||
      (match.homeScore !== null && match.awayScore !== null),
  ).length;
  const tournamentGoalCount = countTournamentGoals(dbMatches);

  const leaderboardRows = memberRows
    .flatMap((member) => {
      const predictionRows = getPredictionRows(member);

      return predictionRows.map((predictionRow) => {
        const memberPredictions = dbPredictions.filter(
          (prediction) =>
            prediction.userId === member.userId &&
            prediction.predictionRow === predictionRow,
        );
        const exact = memberPredictions.filter((prediction) => {
          const match = dbMatches.find((dbMatch) => dbMatch.id === prediction.matchId);

          return match?.status === "done"
            ? isExactPrediction(match, prediction)
            : false;
        }).length;
        const winningsEuros =
          winningsByEntry.get(predictionEntryKey(member.userId, predictionRow)) ??
          0;
        const entryName = getEntryName(member, predictionRow);

        return {
          rank: 0,
          previousRank: 0,
          userId: member.userId,
          username: member.username,
          name: entryName,
          ownerName: member.displayName,
          entryLabel: `Tippreihe ${predictionRow}`,
          hasAdditionalTippreihe: member.usesTwoPredictionRows,
          isAdditionalEntry: predictionRow === 2,
          points: winningsEuros,
          winningsEuros,
          exact,
          total: memberPredictions.length,
          isCurrentUser: member.userId === context.profileId,
        };
      });
    })
    .sort((a, b) => b.points - a.points)
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
  const recentResults = dbMatches
    .filter((match) => inferStatus(match) === "done")
    .sort((a, b) => {
      const kickoffDiff = b.kickoffAt.getTime() - a.kickoffAt.getTime();

      return kickoffDiff || (b.gameId ?? 0) - (a.gameId ?? 0);
    })
    .map(mapDbMatch);
  const upcomingMatches = incompleteMatches.slice(OPENING_SLATE_MATCH_COUNT);
  const currentMember = memberRows.find(
    (member) => member.userId === context.profileId,
  );
  const currentUserHasTwoRows = Boolean(currentMember?.usesTwoPredictionRows);
  const specialPicksRevealable = new Date(SPECIAL_PICKS_LOCK_AT) <= new Date();
  const currentOwnerName =
    currentMember?.displayName ??
    context.displayName ??
    context.userEmail?.split("@")[0] ??
    "Player";
  const predictionEntries: PredictionEntry[] = [
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
  ];
  const profileResults = buildProfileResults({
    currentMember,
    currentUserId: context.profileId,
    dbMatches,
    dbPredictions,
    payoutByMatchEntry,
  });
  const missedPredictionCount = countMissedPredictions({
    matches: mappedMatches,
    predictionEntries,
  });
  let activeChangelog: ActiveChangelog | null = null;

  if (context.profileId) {
    try {
      const [changelogAcknowledgement] = await db
        .select({ id: userChangelogAcknowledgements.id })
        .from(userChangelogAcknowledgements)
        .where(
          and(
            eq(userChangelogAcknowledgements.userId, context.profileId),
            eq(userChangelogAcknowledgements.changelogKey, ACTIVE_CHANGELOG.key),
          ),
        )
        .limit(1);

      activeChangelog = changelogAcknowledgement ? null : ACTIVE_CHANGELOG;
    } catch (error) {
      console.error("Unable to load changelog acknowledgement:", error);
    }
  }

  return {
    activeChangelog,
    connected: true,
    hasAdditionalTippreihe: currentUserHasTwoRows,
    leagueId: league?.id ?? null,
    leaderboard: leaderboardRows,
    missedPredictionCount,
    predictionMatches,
    predictionEntries,
    profileResults,
    recentResults,
    specialPickDeadlineAt: SPECIAL_PICKS_LOCK_AT,
    specialPickRevealEntries: specialPicksRevealable
      ? buildSpecialPickRevealEntries({
          currentUserId: context.profileId,
          memberRows,
          specialPredictions: dbSpecialPredictions,
        })
      : [],
    specialPicksRevealable,
    specialPredictions: currentUserSpecialPredictions,
    todayMatches: todayMatches.length
      ? todayMatches
      : mappedMatches.slice(0, OPENING_SLATE_MATCH_COUNT),
    tournamentProgress: buildTournamentProgress(
      completedMatchCount,
      tournamentGoalCount,
    ),
    upcomingMatches,
    userDisplayName: currentOwnerName,
    userEmail: context.userEmail,
  };
}

export async function getAppData(): Promise<AppData> {
  const context = await ensureReadyUserContext();

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

export async function getPlayerProfileData(
  username: string,
): Promise<PlayerProfileData | null> {
  const context = await ensureReadyUserContext();
  const normalizedUsername = username.trim().toLowerCase();

  if (
    !context.profileId ||
    !normalizedUsername ||
    !isSupabaseConfigured() ||
    !isDatabaseConfigured()
  ) {
    return null;
  }

  try {
    const db = getDb();
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.slug, DEFAULT_LEAGUE_SLUG))
      .limit(1);

    if (!league) return null;

    const [dbMatches, dbPredictions, dbSpecialPredictions, memberRows] =
      await Promise.all([
        db
          .select()
          .from(matches)
          .orderBy(asc(matches.kickoffAt), asc(matches.gameId)),
        db
          .select()
          .from(predictions)
          .where(eq(predictions.leagueId, league.id)),
        db
          .select()
          .from(specialPredictions)
          .where(eq(specialPredictions.leagueId, league.id)),
        db
          .select({
            userId: leagueMembers.userId,
            username: profiles.username,
            usesTwoPredictionRows: leagueMembers.usesTwoPredictionRows,
            displayName: profiles.displayName,
          })
          .from(leagueMembers)
          .innerJoin(profiles, eq(leagueMembers.userId, profiles.id))
          .where(eq(leagueMembers.leagueId, league.id)),
      ]);

    const targetMember = memberRows.find(
      (member) => member.username.toLowerCase() === normalizedUsername,
    );

    if (!targetMember || dbMatches.length === 0) return null;

    const { payoutByMatchEntry, winningsByEntry } = buildJackpotState(
      dbMatches,
      dbPredictions,
      memberRows,
    );
    const completedMatchCount = dbMatches.filter(
      (match) =>
        match.status === "done" ||
        (match.homeScore !== null && match.awayScore !== null),
    ).length;
    const tournamentGoalCount = countTournamentGoals(dbMatches);
    const leaderboardEntries = memberRows
      .flatMap((member) => {
        const predictionRows = getPredictionRows(member);

        return predictionRows.map((predictionRow) => {
          const memberPredictions = dbPredictions.filter(
            (prediction) =>
              prediction.userId === member.userId &&
              prediction.predictionRow === predictionRow,
          );
          const exact = memberPredictions.filter((prediction) => {
            const match = dbMatches.find(
              (dbMatch) => dbMatch.id === prediction.matchId,
            );

            return match?.status === "done"
              ? isExactPrediction(match, prediction)
              : false;
          }).length;
          const winningsEuros =
            winningsByEntry.get(
              predictionEntryKey(member.userId, predictionRow),
            ) ?? 0;
          const entryName = getEntryName(member, predictionRow);

          return {
            rank: 0,
            previousRank: 0,
            userId: member.userId,
            username: member.username,
            name: entryName,
            ownerName: member.displayName,
            entryLabel: `Tippreihe ${predictionRow}`,
            hasAdditionalTippreihe: member.usesTwoPredictionRows,
            isAdditionalEntry: predictionRow === 2,
            points: winningsEuros,
            winningsEuros,
            exact,
            total: memberPredictions.length,
            isCurrentUser: member.userId === context.profileId,
          };
        });
      })
      .sort((a, b) => b.points - a.points)
      .map((row, index) => ({
        ...row,
        rank: index + 1,
        previousRank: index + 1,
      }))
      .filter((row) => row.userId === targetMember.userId);
    const predictionEntries: PredictionEntry[] = getPredictionRows(
      targetMember,
    ).map((predictionRow) => ({
      id: `row-${predictionRow}`,
      label: `Tippreihe ${predictionRow}`,
      ownerName: targetMember.displayName,
      predictionRow,
      isAdditional: predictionRow === 2,
    }));

    return {
      connected: true,
      displayName: targetMember.displayName,
      isCurrentUser: targetMember.userId === context.profileId,
      leaderboardEntries,
      leagueId: league.id,
      predictionEntries,
      profileResults: buildProfileResults({
        currentMember: targetMember,
        currentUserId: targetMember.userId,
        dbMatches,
        dbPredictions,
        payoutByMatchEntry,
      }),
      specialPickDeadlineAt: SPECIAL_PICKS_LOCK_AT,
      specialPicksRevealable: new Date(SPECIAL_PICKS_LOCK_AT) <= new Date(),
      specialPredictions: buildSpecialPredictionsByRowForUser(
        dbSpecialPredictions,
        targetMember.userId,
      ),
      tournamentProgress: buildTournamentProgress(
        completedMatchCount,
        tournamentGoalCount,
      ),
      username: targetMember.username,
    };
  } catch (error) {
    console.error("Unable to load player profile data:", error);
    return null;
  }
}

async function ensureReadyUserContext() {
  const context = await ensureUserContext();

  if (context.profileId && !context.onboardingCompleted) {
    redirect("/onboarding");
  }

  return context;
}

export async function getMatchIntegrityData(
  matchId: string,
): Promise<MatchIntegrityData | null> {
  const context = await ensureReadyUserContext();

  if (
    !context.profileId ||
    !isSupabaseConfigured() ||
    !isDatabaseConfigured()
  ) {
    return null;
  }

  try {
    const db = getDb();
    const [league] = await db
      .select()
      .from(leagues)
      .where(eq(leagues.slug, DEFAULT_LEAGUE_SLUG))
      .limit(1);

    if (!league) return null;

    const [currentMember] = await db
      .select({
        userId: leagueMembers.userId,
        username: profiles.username,
        usesTwoPredictionRows: leagueMembers.usesTwoPredictionRows,
        displayName: profiles.displayName,
      })
      .from(leagueMembers)
      .innerJoin(profiles, eq(leagueMembers.userId, profiles.id))
      .where(
        and(
          eq(leagueMembers.leagueId, league.id),
          eq(leagueMembers.userId, context.profileId),
        ),
      )
      .limit(1);

    if (!currentMember) return null;

    const dbMatches = await db
      .select()
      .from(matches)
      .orderBy(asc(matches.kickoffAt), asc(matches.gameId));
    const match = dbMatches.find((candidate) => candidate.id === matchId);

    if (!match) return null;

    const dbPredictions = await db
      .select()
      .from(predictions)
      .where(eq(predictions.leagueId, league.id));
    const memberRows = await db
      .select({
        userId: leagueMembers.userId,
        username: profiles.username,
        usesTwoPredictionRows: leagueMembers.usesTwoPredictionRows,
        displayName: profiles.displayName,
      })
      .from(leagueMembers)
      .innerJoin(profiles, eq(leagueMembers.userId, profiles.id))
      .where(eq(leagueMembers.leagueId, league.id));
    const { potByMatchId, totalTippreihen } = buildJackpotState(
      dbMatches,
      dbPredictions,
      memberRows,
    );
    const pot = potByMatchId.get(match.id) ?? {
      baseEuros: 0,
      carryInEuros: 0,
      isJackpot: false,
      payoutPerWinnerEuros: 0,
      totalEuros: 0,
      winnerCount: 0,
    };
    const matchPredictions = dbPredictions.filter(
      (prediction) => prediction.matchId === match.id,
    );
    const currentUserPredictions = matchPredictions.filter(
      (prediction) => prediction.userId === context.profileId,
    );
    const revealAllPredictions =
      match.lockedAt <= new Date() ||
      match.status === "live" ||
      match.status === "done";
    const visiblePredictions = revealAllPredictions
      ? matchPredictions
      : currentUserPredictions;
    const submissions = buildSubmissions({
      currentUserId: context.profileId,
      matchPredictions: visiblePredictions,
      memberRows,
    });
    const noTipSubmissions = revealAllPredictions
      ? buildNoTipSubmissions({
          currentUserId: context.profileId,
          matchPredictions,
          memberRows,
        })
      : [];
    const groups = revealAllPredictions
      ? buildPredictionGroups({ match, noTipSubmissions, pot, submissions })
      : [];
    const groupByScoreline = new Map(
      groups.map((group) => [group.scoreline, group]),
    );
    const currentOwnerName =
      currentMember.displayName ??
      context.displayName ??
      context.userEmail?.split("@")[0] ??
      "Player";
    const predictionEntries: PredictionEntry[] = [
      {
        id: "row-1",
        label: "Tippreihe 1",
        ownerName: currentOwnerName,
        predictionRow: 1,
        isAdditional: false,
      },
      ...(currentMember.usesTwoPredictionRows
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
    ];
    const userPotentialWins = predictionEntries.map((entry) => {
      const prediction = currentUserPredictions.find(
        (candidate) => candidate.predictionRow === entry.predictionRow,
      );

      if (!prediction) {
        return {
          entryLabel: entry.label,
          isImpossible: false,
          scoreline: "Kein Tipp",
          possibleWinEuros: null,
        };
      }

      const scoreline = `${prediction.homeScore}:${prediction.awayScore}`;

      return {
        entryLabel: entry.label,
        isImpossible: groupByScoreline.get(scoreline)?.isImpossible ?? false,
        scoreline,
        possibleWinEuros:
          groupByScoreline.get(scoreline)?.possibleWinEuros ?? null,
      };
    });

    return {
      connected: true,
      leagueId: league.id,
      match: mapMatch(match, currentUserPredictions, pot),
      pot,
      predictionEntries,
      revealAllPredictions,
      submissions,
      groups,
      userPotentialWins,
      totalTippreihen,
    };
  } catch (error) {
    console.error("Unable to load match integrity data:", error);
    return null;
  }
}
