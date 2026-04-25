import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { AppNavClient } from "./app-nav-client";

export async function AppNav() {
  const user = await getCurrentUser();

  return (
    <AppNavClient
      isAuthenticated={Boolean(user)}
      signOutAction={signOut}
      userEmail={user?.email ?? null}
    />
  );
}
