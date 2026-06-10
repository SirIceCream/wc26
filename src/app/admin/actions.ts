"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import {
  leagueMembers,
  matches,
  predictions,
  profiles,
  specialPredictions,
} from "@/db/schema";
import {
  assertUniqueDisplayName,
  canManageBeforeStart,
  getDefaultLeague,
  logAdminAction,
  requireAdminContext,
} from "@/lib/admin";

function getUserId(formData: FormData) {
  const userId = formData.get("userId");

  return typeof userId === "string" && userId ? userId : null;
}

function getDisplayName(formData: FormData) {
  const displayName = formData.get("displayName");

  if (typeof displayName !== "string") return null;

  const trimmed = displayName.trim().replace(/\s+/g, " ");

  return trimmed.length >= 2 && trimmed.length <= 40 ? trimmed : null;
}

function getMatchId(formData: FormData) {
  const matchId = formData.get("matchId");

  return typeof matchId === "string" && matchId ? matchId : null;
}

function getOptionalScore(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
    adminRedirect("invalid-input");
  }

  return parsed;
}

function getOptionalText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);

  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  return trimmed.slice(0, maxLength);
}

function getMatchStatus(formData: FormData) {
  const status = formData.get("status");

  if (status === "upcoming" || status === "live" || status === "done") {
    return status;
  }

  adminRedirect("invalid-input");
}

function getResultType(formData: FormData) {
  const resultType = formData.get("resultType");

  if (typeof resultType !== "string" || resultType === "") return null;

  if (
    resultType === "REGULAR" ||
    resultType === "EXTRA_TIME" ||
    resultType === "PENALTY_SHOOTOUT" ||
    resultType === "AWARDED" ||
    resultType === "ADMIN_CORRECTION"
  ) {
    return resultType;
  }

  adminRedirect("invalid-input");
}

function adminRedirect(message: string): never {
  redirect(`/admin?message=${message}`);
}

function requirePreStartAdminWindow() {
  if (!canManageBeforeStart()) {
    adminRedirect("locked");
  }
}

export async function updateUserDisplayName(formData: FormData) {
  const context = await requireAdminContext();
  const userId = getUserId(formData);
  const displayName = getDisplayName(formData);

  if (!userId || !displayName) {
    adminRedirect("invalid-input");
  }

  if (!(await assertUniqueDisplayName(displayName, userId))) {
    adminRedirect("name-taken");
  }

  const [before] = await context.db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!before) {
    adminRedirect("user-missing");
  }

  await context.db
    .update(profiles)
    .set({
      displayName,
      fullName: displayName,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));
  await logAdminAction({
    action: "update_display_name",
    actorUserId: context.profileId,
    beforeData: { displayName: before.displayName, fullName: before.fullName },
    afterData: { displayName, fullName: displayName },
    entityId: userId,
    entityType: "profile",
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  adminRedirect("saved");
}

export async function updateUserPredictionRows(formData: FormData) {
  const context = await requireAdminContext();
  requirePreStartAdminWindow();

  const userId = getUserId(formData);
  const usesTwoPredictionRows = formData.get("usesTwoPredictionRows") === "true";
  const league = await getDefaultLeague();

  if (!userId || !league) {
    adminRedirect("invalid-input");
  }

  const [before] = await context.db
    .select()
    .from(leagueMembers)
    .where(
      and(
        eq(leagueMembers.leagueId, league.id),
        eq(leagueMembers.userId, userId),
      ),
    )
    .limit(1);

  if (!before) {
    adminRedirect("user-missing");
  }

  let deletedRowTwoPredictions = 0;
  let deletedRowTwoSpecialPredictions = 0;

  if (!usesTwoPredictionRows) {
    const deletedPredictions = await context.db
      .delete(predictions)
      .where(
        and(
          eq(predictions.leagueId, league.id),
          eq(predictions.userId, userId),
          eq(predictions.predictionRow, 2),
        ),
      )
      .returning({ id: predictions.id });
    const deletedSpecialPredictions = await context.db
      .delete(specialPredictions)
      .where(
        and(
          eq(specialPredictions.leagueId, league.id),
          eq(specialPredictions.userId, userId),
          eq(specialPredictions.predictionRow, 2),
        ),
      )
      .returning({ id: specialPredictions.id });

    deletedRowTwoPredictions = deletedPredictions.length;
    deletedRowTwoSpecialPredictions = deletedSpecialPredictions.length;
  }

  await context.db
    .update(leagueMembers)
    .set({ usesTwoPredictionRows })
    .where(eq(leagueMembers.id, before.id));
  await logAdminAction({
    action: "update_prediction_rows",
    actorUserId: context.profileId,
    beforeData: {
      usesTwoPredictionRows: before.usesTwoPredictionRows,
    },
    afterData: {
      deletedRowTwoPredictions,
      deletedRowTwoSpecialPredictions,
      usesTwoPredictionRows,
    },
    entityId: userId,
    entityType: "league_member",
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/predict");
  revalidatePath("/profile");
  adminRedirect("saved");
}

export async function resetUserOnboarding(formData: FormData) {
  const context = await requireAdminContext();
  requirePreStartAdminWindow();

  const userId = getUserId(formData);

  if (!userId) {
    adminRedirect("invalid-input");
  }

  const [before] = await context.db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!before) {
    adminRedirect("user-missing");
  }

  await context.db
    .update(profiles)
    .set({
      onboardingCompleted: false,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));
  await logAdminAction({
    action: "reset_onboarding",
    actorUserId: context.profileId,
    beforeData: { onboardingCompleted: before.onboardingCompleted },
    afterData: { onboardingCompleted: false },
    entityId: userId,
    entityType: "profile",
  });

  revalidatePath("/admin");
  adminRedirect("saved");
}

export async function deleteTestProfile(formData: FormData) {
  const context = await requireAdminContext();
  requirePreStartAdminWindow();

  const userId = getUserId(formData);

  if (!userId || userId === context.profileId) {
    adminRedirect("invalid-input");
  }

  const [before] = await context.db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!before) {
    adminRedirect("user-missing");
  }

  await context.db.delete(profiles).where(eq(profiles.id, userId));
  await logAdminAction({
    action: "delete_test_profile",
    actorUserId: context.profileId,
    beforeData: {
      appRole: before.appRole,
      displayName: before.displayName,
      email: before.email,
      onboardingCompleted: before.onboardingCompleted,
    },
    entityId: userId,
    entityType: "profile",
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  adminRedirect("saved");
}

export async function updateUserAdminRole(formData: FormData) {
  const context = await requireAdminContext();
  const userId = getUserId(formData);
  const appRole = formData.get("appRole");

  if (!userId || (appRole !== "admin" && appRole !== "user")) {
    adminRedirect("invalid-input");
  }

  if (userId === context.profileId && appRole !== "admin") {
    adminRedirect("self-demote");
  }

  const [before] = await context.db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!before) {
    adminRedirect("user-missing");
  }

  await context.db
    .update(profiles)
    .set({ appRole, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
  await logAdminAction({
    action: "update_admin_role",
    actorUserId: context.profileId,
    beforeData: { appRole: before.appRole },
    afterData: { appRole },
    entityId: userId,
    entityType: "profile",
  });

  revalidatePath("/admin");
  adminRedirect("saved");
}

export async function updateMatchCorrection(formData: FormData) {
  const context = await requireAdminContext();
  const matchId = getMatchId(formData);
  const status = getMatchStatus(formData);
  const homeScore = getOptionalScore(formData, "homeScore");
  const awayScore = getOptionalScore(formData, "awayScore");
  const homePenaltyScore = getOptionalScore(formData, "homePenaltyScore");
  const awayPenaltyScore = getOptionalScore(formData, "awayPenaltyScore");
  const resultType = getResultType(formData);
  const adminNote = getOptionalText(formData, "adminNote", 500);

  if (!matchId) {
    adminRedirect("invalid-input");
  }

  if ((homeScore === null) !== (awayScore === null)) {
    adminRedirect("invalid-input");
  }

  if ((homePenaltyScore === null) !== (awayPenaltyScore === null)) {
    adminRedirect("invalid-input");
  }

  if (status === "done" && (homeScore === null || awayScore === null)) {
    adminRedirect("invalid-input");
  }

  const [before] = await context.db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!before) {
    adminRedirect("match-missing");
  }

  const afterData = {
    adminNote,
    awayPenaltyScore,
    awayScore,
    homePenaltyScore,
    homeScore,
    resultType,
    status,
  };

  await context.db
    .update(matches)
    .set({
      ...afterData,
      liveMinute: status === "live" ? before.liveMinute : null,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));
  await logAdminAction({
    action: "update_match_correction",
    actorUserId: context.profileId,
    beforeData: {
      adminNote: before.adminNote,
      awayPenaltyScore: before.awayPenaltyScore,
      awayScore: before.awayScore,
      homePenaltyScore: before.homePenaltyScore,
      homeScore: before.homeScore,
      resultType: before.resultType,
      status: before.status,
    },
    afterData,
    entityId: matchId,
    entityType: "match",
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/leaderboard");
  revalidatePath("/predict");
  revalidatePath("/profile");
  revalidatePath(`/match/${matchId}`);
  adminRedirect("saved");
}
