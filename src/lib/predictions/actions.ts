"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { matches, predictions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function parseScore(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
    return null;
  }

  return parsed;
}

export async function savePrediction(formData: FormData) {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    redirect("/login?message=supabase-not-configured");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?message=login-required");
  }

  const leagueId = formData.get("leagueId");
  const matchId = formData.get("matchId");
  const homeScore = parseScore(formData.get("homeScore"));
  const awayScore = parseScore(formData.get("awayScore"));

  if (
    typeof leagueId !== "string" ||
    typeof matchId !== "string" ||
    homeScore === null ||
    awayScore === null
  ) {
    redirect("/predict?message=invalid-prediction");
  }

  const db = getDb();
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match || match.lockedAt <= new Date()) {
    redirect("/predict?message=match-locked");
  }

  await db
    .insert(predictions)
    .values({
      leagueId,
      matchId,
      userId: user.id,
      homeScore,
      awayScore,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        predictions.leagueId,
        predictions.userId,
        predictions.matchId,
      ],
      set: {
        homeScore,
        awayScore,
        updatedAt: new Date(),
      },
      setWhere: and(
        eq(predictions.leagueId, leagueId),
        eq(predictions.userId, user.id),
        eq(predictions.matchId, matchId),
      ),
    });

  revalidatePath("/");
  revalidatePath("/predict");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
}
