import { and, desc, eq, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, isDatabaseConfigured } from "@/db";
import {
  adminAuditLog,
  leagueMembers,
  leagues,
  predictions,
  profiles,
  specialPredictions,
} from "@/db/schema";
import { DEFAULT_LEAGUE_SLUG } from "@/lib/app-data";
import { SPECIAL_PICKS_LOCK_AT } from "@/lib/special-picks/constants";
import { getCurrentUser } from "./auth/session";

export type AdminContext = {
  db: ReturnType<typeof getDb>;
  profileId: string;
  email: string | null;
};

export type AdminUserRow = {
  id: string;
  email: string | null;
  displayName: string;
  onboardingCompleted: boolean;
  appRole: string;
  createdAt: string;
  joinedAt: string | null;
  isMember: boolean;
  usesTwoPredictionRows: boolean;
  predictionCount: number;
  rowTwoPredictionCount: number;
  specialPredictionCount: number;
  rowTwoSpecialPredictionCount: number;
};

export type AdminDashboardData = {
  canManageBeforeStart: boolean;
  currentUserId: string;
  users: AdminUserRow[];
  totals: {
    admins: number;
    members: number;
    onboarded: number;
    predictions: number;
    specialPredictions: number;
    twoRowMembers: number;
    users: number;
  };
};

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function canManageBeforeStart() {
  return new Date(SPECIAL_PICKS_LOCK_AT) > new Date();
}

export async function getAdminContext(): Promise<AdminContext | null> {
  if (!isDatabaseConfigured()) return null;

  const user = await getCurrentUser();

  if (!user) return null;

  const db = getDb();
  const email = user.email?.toLowerCase() ?? null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return null;

  const envAdmin = Boolean(email && adminEmails().has(email));
  const profileAdmin = profile.appRole === "admin";

  if (!envAdmin && !profileAdmin) return null;

  if (envAdmin && !profileAdmin) {
    await db
      .update(profiles)
      .set({ appRole: "admin", updatedAt: new Date() })
      .where(eq(profiles.id, user.id));
  }

  return {
    db,
    email,
    profileId: user.id,
  };
}

export async function requireAdminContext() {
  const context = await getAdminContext();

  if (!context) {
    redirect("/");
  }

  return context;
}

export async function getAdminDashboardData() {
  const context = await getAdminContext();

  if (!context) return null;

  const { db } = context;
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.slug, DEFAULT_LEAGUE_SLUG))
    .limit(1);
  const [profileRows, memberRows, predictionRows, specialRows] =
    await Promise.all([
      db.select().from(profiles).orderBy(desc(profiles.createdAt)),
      league
        ? db
            .select()
            .from(leagueMembers)
            .where(eq(leagueMembers.leagueId, league.id))
        : [],
      league
        ? db.select().from(predictions).where(eq(predictions.leagueId, league.id))
        : [],
      league
        ? db
            .select()
            .from(specialPredictions)
            .where(eq(specialPredictions.leagueId, league.id))
        : [],
    ]);
  const memberByUser = new Map(memberRows.map((member) => [member.userId, member]));
  const predictionCounts = new Map<string, number>();
  const rowTwoPredictionCounts = new Map<string, number>();
  const specialCounts = new Map<string, number>();
  const rowTwoSpecialCounts = new Map<string, number>();

  for (const prediction of predictionRows) {
    predictionCounts.set(
      prediction.userId,
      (predictionCounts.get(prediction.userId) ?? 0) + 1,
    );

    if (prediction.predictionRow === 2) {
      rowTwoPredictionCounts.set(
        prediction.userId,
        (rowTwoPredictionCounts.get(prediction.userId) ?? 0) + 1,
      );
    }
  }

  for (const specialPrediction of specialRows) {
    specialCounts.set(
      specialPrediction.userId,
      (specialCounts.get(specialPrediction.userId) ?? 0) + 1,
    );

    if (specialPrediction.predictionRow === 2) {
      rowTwoSpecialCounts.set(
        specialPrediction.userId,
        (rowTwoSpecialCounts.get(specialPrediction.userId) ?? 0) + 1,
      );
    }
  }

  const users = profileRows.map((profile) => {
    const member = memberByUser.get(profile.id);

    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      onboardingCompleted: profile.onboardingCompleted,
      appRole: profile.appRole,
      createdAt: profile.createdAt.toISOString(),
      joinedAt: member?.joinedAt.toISOString() ?? null,
      isMember: Boolean(member),
      usesTwoPredictionRows: Boolean(member?.usesTwoPredictionRows),
      predictionCount: predictionCounts.get(profile.id) ?? 0,
      rowTwoPredictionCount: rowTwoPredictionCounts.get(profile.id) ?? 0,
      specialPredictionCount: specialCounts.get(profile.id) ?? 0,
      rowTwoSpecialPredictionCount: rowTwoSpecialCounts.get(profile.id) ?? 0,
    };
  });

  return {
    canManageBeforeStart: canManageBeforeStart(),
    currentUserId: context.profileId,
    users,
    totals: {
      admins: users.filter((user) => user.appRole === "admin").length,
      members: users.filter((user) => user.isMember).length,
      onboarded: users.filter((user) => user.onboardingCompleted).length,
      predictions: predictionRows.length,
      specialPredictions: specialRows.length,
      twoRowMembers: users.filter((user) => user.usesTwoPredictionRows).length,
      users: users.length,
    },
  } satisfies AdminDashboardData;
}

export async function getDefaultLeague() {
  const db = getDb();
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.slug, DEFAULT_LEAGUE_SLUG))
    .limit(1);

  return league ?? null;
}

export async function assertUniqueDisplayName(
  displayName: string,
  userId: string,
) {
  const [existing] = await getDb()
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        sql`lower(${profiles.displayName}) = ${displayName.toLowerCase()}`,
        ne(profiles.id, userId),
      ),
    )
    .limit(1);

  return !existing;
}

export async function logAdminAction({
  action,
  actorUserId,
  afterData,
  beforeData,
  entityId,
  entityType,
}: {
  action: string;
  actorUserId: string;
  afterData?: unknown;
  beforeData?: unknown;
  entityId: string;
  entityType: string;
}) {
  await getDb().insert(adminAuditLog).values({
    action,
    actorUserId,
    afterData: afterData ?? null,
    beforeData: beforeData ?? null,
    entityId,
    entityType,
  });
}
