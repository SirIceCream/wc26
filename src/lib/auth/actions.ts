"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { leagueMembers, leagues, profiles } from "@/db/schema";
import { DEFAULT_LEAGUE_SLUG } from "@/lib/app-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./session";
import { isSignupEnabled } from "./signup";

const DEFAULT_LEAGUE_NAME = "Private League";

function getEmail(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return null;
  }

  return email.trim().toLowerCase();
}

function getLoginIdentifier(formData: FormData) {
  const identifier = formData.get("identifier");

  if (typeof identifier !== "string" || !identifier.trim()) {
    return null;
  }

  return identifier.trim();
}

function getPassword(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length < 6) {
    return null;
  }

  return password;
}

function getInviteCode(formData: FormData) {
  const inviteCode = formData.get("inviteCode");

  if (typeof inviteCode !== "string" || !inviteCode.trim()) {
    return null;
  }

  return inviteCode.trim();
}

function isValidInviteCode(inviteCode: string | null) {
  const configuredCode = process.env.SIGNUP_INVITE_CODE?.trim();

  return Boolean(configuredCode && inviteCode === configuredCode);
}

function getDisplayName(formData: FormData) {
  const displayName = formData.get("displayName");

  if (typeof displayName !== "string") {
    return null;
  }

  const trimmed = displayName.trim().replace(/\s+/g, " ");

  if (trimmed.length < 2 || trimmed.length > 40) {
    return null;
  }

  return trimmed;
}

function getUsesTwoPredictionRows(formData: FormData) {
  return formData.get("predictionRows") === "2";
}

function usernameFromDisplayName(displayName: string, userId: string) {
  const slug = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${slug || "player"}-${userId.slice(0, 8)}`;
}

async function getOrigin() {
  const headerStore = await headers();

  return (
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

async function getMagicLinkRedirectPath(email: string, inviteCode: string | null) {
  if (isDatabaseConfigured()) {
    const [profile] = await getDb()
      .select({ onboardingCompleted: profiles.onboardingCompleted })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (profile?.onboardingCompleted) {
      return "/";
    }
  }

  return `/onboarding?invite=${encodeURIComponent(inviteCode ?? "")}`;
}

export async function signInWithMagicLink(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?message=supabase-not-configured");
  }

  if (!isSignupEnabled()) {
    redirect("/login?message=signups-closed");
  }

  const email = getEmail(formData);
  const inviteCode = getInviteCode(formData);

  if (!email) {
    redirect("/login?message=invalid-email");
  }

  if (!isValidInviteCode(inviteCode)) {
    redirect("/login?message=invalid-invite");
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const nextPath = await getMagicLinkRedirectPath(email, inviteCode);
  const callbackUrl =
    nextPath === "/"
      ? `${origin}/auth/callback`
      : `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    const message = error.message.toLowerCase().includes("rate limit")
      ? "email-rate-limit"
      : "auth-callback-failed";

    redirect(`/login?message=${message}`);
  }

  redirect("/login?message=check-email");
}

export async function signInWithPassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?message=supabase-not-configured");
  }

  const identifier = getLoginIdentifier(formData);
  const password = getPassword(formData);

  if (!identifier) {
    redirect("/login?message=invalid-email");
  }

  if (!password) {
    redirect("/login?message=invalid-password");
  }

  let email = identifier.includes("@") ? identifier.toLowerCase() : null;

  if (!email) {
    if (!isDatabaseConfigured()) {
      redirect("/login?message=supabase-not-configured");
    }

    const matches = await getDb()
      .select({ email: profiles.email })
      .from(profiles)
      .where(sql`lower(${profiles.displayName}) = ${identifier.toLowerCase()}`)
      .limit(2);

    if (matches.length !== 1 || !matches[0].email) {
      redirect("/login?message=invalid-login");
    }

    email = matches[0].email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?message=invalid-login");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/reset-password?message=supabase-not-configured");
  }

  const email = getEmail(formData);

  if (!email) {
    redirect("/reset-password?message=invalid-email");
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(
    "/reset-password",
  )}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("rate limit")
      ? "email-rate-limit"
      : "reset-request-failed";

    redirect(`/reset-password?message=${message}`);
  }

  redirect("/reset-password?message=reset-email-sent");
}

export async function updatePassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/reset-password?message=supabase-not-configured");
  }

  const password = getPassword(formData);
  const passwordConfirm = formData.get("passwordConfirm");

  if (!password) {
    redirect("/reset-password?message=invalid-password");
  }

  if (typeof passwordConfirm !== "string" || passwordConfirm !== password) {
    redirect("/reset-password?message=password-mismatch");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/reset-password?message=reset-link-expired");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/reset-password?message=reset-update-failed");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function completeOnboarding(formData: FormData) {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    redirect("/login?message=supabase-not-configured");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?message=login-required");
  }

  if (!isSignupEnabled()) {
    redirect("/onboarding?message=signups-closed");
  }

  const displayName = getDisplayName(formData);
  const password = getPassword(formData);
  const inviteCode = getInviteCode(formData);

  if (!displayName) {
    redirect("/onboarding?message=invalid-name");
  }

  if (!password) {
    redirect("/onboarding?message=invalid-password");
  }

  if (!isValidInviteCode(inviteCode)) {
    redirect("/onboarding?message=invalid-invite");
  }

  const isLocalTestUser = user.app_metadata.provider === "local-test";

  if (!isLocalTestUser) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        display_name: displayName,
        full_name: displayName,
        username: usernameFromDisplayName(displayName, user.id),
      },
    });

    if (error) {
      redirect("/onboarding?message=auth-update-failed");
    }
  }

  const email = user.email ?? null;
  const username = usernameFromDisplayName(displayName, user.id);
  const db = getDb();
  const [existingDisplayName] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        sql`lower(${profiles.displayName}) = ${displayName.toLowerCase()}`,
        ne(profiles.id, user.id),
      ),
    )
    .limit(1);

  if (existingDisplayName) {
    redirect("/onboarding?message=name-taken");
  }

  await db
    .insert(profiles)
    .values({
      id: user.id,
      email,
      username,
      fullName: displayName,
      displayName,
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email,
        username,
        fullName: displayName,
        displayName,
        onboardingCompleted: true,
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

  if (league) {
    await db
      .insert(leagueMembers)
      .values({
        leagueId: league.id,
        userId: user.id,
        role: "member",
        usesTwoPredictionRows: getUsesTwoPredictionRows(formData),
      })
      .onConflictDoUpdate({
        target: [leagueMembers.leagueId, leagueMembers.userId],
        set: {
          usesTwoPredictionRows: getUsesTwoPredictionRows(formData),
        },
      });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login?message=signed-out");
}
