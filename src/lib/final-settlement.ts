import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  finalSettlementAwards,
  leagueMembers,
  matches,
  predictions,
  profiles,
  specialPredictions,
} from "@/db/schema";
import { SPECIAL_PICK_STAKE_EUROS } from "@/lib/special-picks/constants";

export const FINAL_AWARD_TYPES = [
  "champion",
  "total_goals",
  "lucky_loser",
] as const;
export const LUCKY_LOSER_JACKPOT_EUROS = 36;

export type FinalAwardType = (typeof FINAL_AWARD_TYPES)[number];

type Db = ReturnType<typeof getDb>;

type MatchRow = typeof matches.$inferSelect;
type PredictionRow = typeof predictions.$inferSelect;
type SpecialPredictionRow = typeof specialPredictions.$inferSelect;
type MemberRow = {
  userId: string;
  username: string;
  usesTwoPredictionRows: boolean;
  displayName: string;
};

type FinalAwardInsert = typeof finalSettlementAwards.$inferInsert;

function floorToCents(value: number) {
  return Math.floor(value * 100);
}

function entryKey(userId: string, predictionRow: number) {
  return `${userId}:${predictionRow}`;
}

function getPredictionRows(member: Pick<MemberRow, "usesTwoPredictionRows">) {
  return member.usesTwoPredictionRows ? [1, 2] : [1];
}

function isExactPrediction(match: MatchRow, prediction: PredictionRow) {
  return (
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.homeScore === prediction.homeScore &&
    match.awayScore === prediction.awayScore
  );
}

function getMatchWinnerTeamCode(match: MatchRow) {
  if (
    match.status !== "done" ||
    !match.homeTeamCode ||
    !match.awayTeamCode ||
    match.homeScore === null ||
    match.awayScore === null
  ) {
    return null;
  }

  if (match.homeScore > match.awayScore) return match.homeTeamCode;
  if (match.awayScore > match.homeScore) return match.awayTeamCode;

  if (match.homePenaltyScore === null || match.awayPenaltyScore === null) {
    return null;
  }

  if (match.homePenaltyScore > match.awayPenaltyScore) return match.homeTeamCode;
  if (match.awayPenaltyScore > match.homePenaltyScore) return match.awayTeamCode;

  return null;
}

function isFinalMatch(match: MatchRow) {
  const stage = match.stage.trim().toLowerCase();

  // Do not use `includes("final")`: stages like "Quarter-finals" and
  // "Semi-finals" contain that substring and can incorrectly decide the
  // champion before the actual final is evaluated.
  return stage === "final" || stage === "finale";
}

function getFinalMatch(matchRows: MatchRow[]) {
  return [...matchRows]
    .filter(isFinalMatch)
    .sort((a, b) => {
      const kickoffDiff = b.kickoffAt.getTime() - a.kickoffAt.getTime();

      return kickoffDiff || (b.gameId ?? 0) - (a.gameId ?? 0);
    })[0];
}

function buildFinalAwards({
  leagueId,
  matchRows,
  memberRows,
  predictionRows,
  specialRows,
}: {
  leagueId: string;
  matchRows: MatchRow[];
  memberRows: MemberRow[];
  predictionRows: PredictionRow[];
  specialRows: SpecialPredictionRow[];
}) {
  const unsettledMatches = matchRows.filter(
    (match) =>
      match.status !== "done" ||
      match.homeScore === null ||
      match.awayScore === null,
  );

  if (unsettledMatches.length > 0) {
    throw new Error("final-settlement-unfinished-matches");
  }

  const finalMatch = getFinalMatch(matchRows);
  const championTeamCode = finalMatch ? getMatchWinnerTeamCode(finalMatch) : null;

  if (!championTeamCode) {
    throw new Error("final-settlement-missing-champion");
  }

  const allEntries = memberRows.flatMap((member) =>
    getPredictionRows(member).map((predictionRow) => ({
      displayName: member.displayName,
      leagueId,
      predictionRow,
      userId: member.userId,
    })),
  );
  const entryCount = allEntries.length;
  const specialPotCents = floorToCents(entryCount * SPECIAL_PICK_STAKE_EUROS);
  const totalGoals = matchRows.reduce(
    (total, match) => total + (match.homeScore ?? 0) + (match.awayScore ?? 0),
    0,
  );
  const awards: FinalAwardInsert[] = [];

  const championWinners = specialRows.filter(
    (prediction) => prediction.championTeamCode === championTeamCode,
  );
  const championPayoutCents = championWinners.length
    ? Math.floor(specialPotCents / championWinners.length)
    : 0;

  for (const winner of championWinners) {
    awards.push({
      leagueId,
      userId: winner.userId,
      predictionRow: winner.predictionRow,
      awardType: "champion",
      amountCents: championPayoutCents,
      correctTipBonus: 1,
      metadata: { championTeamCode, totalWinners: championWinners.length },
      updatedAt: new Date(),
    });
  }

  const goalPredictions = specialRows.filter(
    (prediction) => prediction.totalGoals !== null,
  );
  const nearestGoalDistance = goalPredictions.length
    ? Math.min(
        ...goalPredictions.map((prediction) =>
          Math.abs((prediction.totalGoals ?? 0) - totalGoals),
        ),
      )
    : null;
  const goalWinners =
    nearestGoalDistance === null
      ? []
      : goalPredictions.filter(
          (prediction) =>
            Math.abs((prediction.totalGoals ?? 0) - totalGoals) ===
            nearestGoalDistance,
        );
  const goalPayoutCents = goalWinners.length
    ? Math.floor(specialPotCents / goalWinners.length)
    : 0;

  for (const winner of goalWinners) {
    awards.push({
      leagueId,
      userId: winner.userId,
      predictionRow: winner.predictionRow,
      awardType: "total_goals",
      amountCents: goalPayoutCents,
      correctTipBonus: 1,
      metadata: {
        distance: nearestGoalDistance,
        predictedTotalGoals: winner.totalGoals,
        totalGoals,
        totalWinners: goalWinners.length,
      },
      updatedAt: new Date(),
    });
  }

  const correctTipsByEntry = new Map<string, number>();

  for (const entry of allEntries) {
    correctTipsByEntry.set(entryKey(entry.userId, entry.predictionRow), 0);
  }

  for (const prediction of predictionRows) {
    const match = matchRows.find((candidate) => candidate.id === prediction.matchId);

    if (!match || !isExactPrediction(match, prediction)) continue;

    const key = entryKey(prediction.userId, prediction.predictionRow);
    correctTipsByEntry.set(key, (correctTipsByEntry.get(key) ?? 0) + 1);
  }

  for (const award of awards) {
    const key = entryKey(award.userId, award.predictionRow ?? 1);
    correctTipsByEntry.set(
      key,
      (correctTipsByEntry.get(key) ?? 0) + (award.correctTipBonus ?? 0),
    );
  }

  const leastCorrect = Math.min(...correctTipsByEntry.values());
  const luckyLosers = allEntries.filter(
    (entry) => correctTipsByEntry.get(entryKey(entry.userId, entry.predictionRow)) === leastCorrect,
  );
  const luckyLoserPayoutCents = luckyLosers.length
    ? Math.floor(floorToCents(LUCKY_LOSER_JACKPOT_EUROS) / luckyLosers.length)
    : 0;

  for (const luckyLoser of luckyLosers) {
    awards.push({
      leagueId,
      userId: luckyLoser.userId,
      predictionRow: luckyLoser.predictionRow,
      awardType: "lucky_loser",
      amountCents: luckyLoserPayoutCents,
      correctTipBonus: 0,
      metadata: {
        leastCorrect,
        totalWinners: luckyLosers.length,
      },
      updatedAt: new Date(),
    });
  }

  return {
    awards,
    championTeamCode,
    totalGoals,
  };
}

export async function settleFinalAwards(db: Db, leagueId: string) {
  const [
    memberRows,
    matchRows,
    predictionRows,
    specialRows,
  ] = await Promise.all([
    db
      .select({
        userId: leagueMembers.userId,
        username: profiles.username,
        usesTwoPredictionRows: leagueMembers.usesTwoPredictionRows,
        displayName: profiles.displayName,
      })
      .from(leagueMembers)
      .innerJoin(profiles, eq(leagueMembers.userId, profiles.id))
      .where(eq(leagueMembers.leagueId, leagueId)),
    db.select().from(matches),
    db.select().from(predictions).where(eq(predictions.leagueId, leagueId)),
    db
      .select()
      .from(specialPredictions)
      .where(eq(specialPredictions.leagueId, leagueId)),
  ]);

  const settlement = buildFinalAwards({
    leagueId,
    matchRows,
    memberRows,
    predictionRows,
    specialRows,
  });

  await db.transaction(async (tx) => {
    await tx
      .delete(finalSettlementAwards)
      .where(
        and(
          eq(finalSettlementAwards.leagueId, leagueId),
          inArray(finalSettlementAwards.awardType, [...FINAL_AWARD_TYPES]),
        ),
      );

    if (settlement.awards.length) {
      await tx.insert(finalSettlementAwards).values(settlement.awards);
    }
  });

  return settlement;
}
