"use server";

import { revalidatePath } from "next/cache";
import { getDb, isDatabaseConfigured } from "@/db";
import { userChangelogAcknowledgements } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { ACTIVE_CHANGELOG } from "@/lib/changelog";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function acknowledgeChangelog(changelogKey: string) {
  if (changelogKey !== ACTIVE_CHANGELOG.key) {
    throw new Error("Unknown changelog key");
  }

  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    throw new Error("Database is not configured");
  }

  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Login required");
  }

  await getDb()
    .insert(userChangelogAcknowledgements)
    .values({
      changelogKey,
      userId: user.id,
    })
    .onConflictDoNothing({
      target: [
        userChangelogAcknowledgements.userId,
        userChangelogAcknowledgements.changelogKey,
      ],
    });

  revalidatePath("/");
}
