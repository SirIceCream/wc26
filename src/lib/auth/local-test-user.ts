import type { User } from "@supabase/supabase-js";

const DEFAULT_LOCAL_TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
const DEFAULT_LOCAL_TEST_USER_EMAIL = "alex1@example.test";
const DEFAULT_LOCAL_TEST_USER_NAME = "Alex 1";
const DEFAULT_LOCAL_TEST_USERNAME = "alex-1";

function isEnabled(value: string | undefined) {
  return value === "1" || value === "true";
}

export function getLocalTestUser(): User | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!isEnabled(process.env.LOCAL_TEST_USER_ENABLED)) {
    return null;
  }

  const displayName =
    process.env.LOCAL_TEST_USER_DISPLAY_NAME ?? DEFAULT_LOCAL_TEST_USER_NAME;
  const now = new Date().toISOString();

  return {
    id: process.env.LOCAL_TEST_USER_ID ?? DEFAULT_LOCAL_TEST_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: process.env.LOCAL_TEST_USER_EMAIL ?? DEFAULT_LOCAL_TEST_USER_EMAIL,
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: {
      provider: "local-test",
      providers: ["local-test"],
    },
    user_metadata: {
      avatar_url: process.env.LOCAL_TEST_USER_AVATAR_URL ?? null,
      display_name: displayName,
      full_name: displayName,
      phone_number: process.env.LOCAL_TEST_USER_PHONE_NUMBER ?? "0000000000",
      username:
        process.env.LOCAL_TEST_USER_USERNAME ?? DEFAULT_LOCAL_TEST_USERNAME,
    },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  };
}
