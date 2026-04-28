"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { leagueMembers, specialPredictions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isTeamCode } from "@/lib/tournament-data";
import { SPECIAL_PICKS_LOCK_AT } from "./constants";

function parsePredictionRow(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return 1;

  const parsed = Number.parseInt(value, 10);

  return parsed === 2 ? 2 : 1;
}

function parseTotalGoals(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
    return null;
  }

  return parsed;
}

async function getWritableSpecialPickContext(formData: FormData) {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    redirect("/login?message=supabase-not-configured");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const leagueId = formData.get("leagueId");
  const predictionRow = parsePredictionRow(formData.get("predictionRow"));

  if (typeof leagueId !== "string" || !leagueId) {
    redirect("/special-picks?message=missing-league");
  }

  if (new Date(SPECIAL_PICKS_LOCK_AT) <= new Date()) {
    redirect("/special-picks?message=special-picks-locked");
  }

  const db = getDb();
  const [membership] = await db
    .select()
    .from(leagueMembers)
    .where(
      and(
        eq(leagueMembers.leagueId, leagueId),
        eq(leagueMembers.userId, user.id),
      ),
    )
    .limit(1);

  if (!membership || (predictionRow === 2 && !membership.usesTwoPredictionRows)) {
    redirect("/special-picks?message=invalid-prediction-row");
  }

  return {
    db,
    leagueId,
    predictionRow,
    userId: user.id,
  };
}

function revalidateSpecialPickViews() {
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/special-picks");
}

export async function saveChampionPrediction(formData: FormData) {
  const { db, leagueId, predictionRow, userId } =
    await getWritableSpecialPickContext(formData);
  const championTeamCode = formData.get("championTeamCode");

  if (typeof championTeamCode !== "string" || !isTeamCode(championTeamCode)) {
    redirect("/special-picks?message=invalid-champion");
  }

  await db
    .insert(specialPredictions)
    .values({
      championTeamCode,
      leagueId,
      predictionRow,
      updatedAt: new Date(),
      userId,
    })
    .onConflictDoUpdate({
      target: [
        specialPredictions.leagueId,
        specialPredictions.userId,
        specialPredictions.predictionRow,
      ],
      set: {
        championTeamCode,
        updatedAt: new Date(),
      },
    });

  revalidateSpecialPickViews();
}

export async function saveTotalGoalsPrediction(formData: FormData) {
  const { db, leagueId, predictionRow, userId } =
    await getWritableSpecialPickContext(formData);
  const totalGoals = parseTotalGoals(formData.get("totalGoals"));

  if (totalGoals === null) {
    redirect("/special-picks?message=invalid-total-goals");
  }

  await db
    .insert(specialPredictions)
    .values({
      leagueId,
      predictionRow,
      totalGoals,
      updatedAt: new Date(),
      userId,
    })
    .onConflictDoUpdate({
      target: [
        specialPredictions.leagueId,
        specialPredictions.userId,
        specialPredictions.predictionRow,
      ],
      set: {
        totalGoals,
        updatedAt: new Date(),
      },
    });

  revalidateSpecialPickViews();
}
