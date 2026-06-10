import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/app/submit-button";
import { completeOnboarding, signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { isSignupEnabled } from "@/lib/auth/signup";

const messages: Record<string, string> = {
  "auth-update-failed": "Das Passwort konnte nicht gespeichert werden.",
  "invalid-invite": "Der Einladungscode ist nicht gültig.",
  "invalid-name": "Bitte gib einen Namen mit 2 bis 40 Zeichen ein.",
  "invalid-password": "Das Passwort muss mindestens 6 Zeichen haben.",
  "name-taken": "Dieser Name ist schon vergeben.",
  "signups-closed": "Die Anmeldung für neue Teilnehmer ist geschlossen.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; message?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?message=login-required");
  }

  const { invite, message } = await searchParams;
  const statusMessage = message ? messages[message] : null;
  const signupEnabled = isSignupEnabled();
  const suggestedName =
    typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : user.email?.split("@")[0] ?? "";

  if (!signupEnabled) {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl content-center px-4 py-6 sm:px-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-emerald-800">
            Anmeldung geschlossen
          </p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">
            Neue Teilnehmer können nicht mehr beitreten
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Das Teilnehmerfeld für das Jackpotspiel 2026 ist geschlossen.
            Bestehende Teilnehmer können sich weiterhin mit ihrem Passwort
            einloggen.
          </p>

          {statusMessage ? (
            <div className="mt-5 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
              {statusMessage}
            </div>
          ) : null}

          <form action={signOut} className="mt-6">
            <SubmitButton
              className="rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-wait disabled:bg-zinc-300"
              pendingLabel="Meldet ab..."
              type="submit"
            >
              Zurück zum Login
            </SubmitButton>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl content-center px-4 py-6 sm:px-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase text-emerald-800">
          Profil einrichten
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">
          Fast fertig
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
          Wähle deinen Anzeigenamen, deine Anzahl an Tippreihen und ein
          Passwort für künftige Logins.
        </p>

        {statusMessage ? (
          <div className="mt-5 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
            {statusMessage}
          </div>
        ) : null}

        <form action={completeOnboarding} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">
              Einladungscode
            </span>
            <input
              autoComplete="off"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              defaultValue={invite ?? ""}
              name="inviteCode"
              placeholder="Code"
              required
              type="text"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-zinc-700">
              Anzeigename
            </span>
            <input
              autoComplete="name"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              defaultValue={suggestedName}
              maxLength={40}
              minLength={2}
              name="displayName"
              placeholder="Alex"
              required
              type="text"
            />
          </label>

          <fieldset>
            <legend className="text-sm font-bold text-zinc-700">
              Tippreihen
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-300 p-3 text-sm font-semibold text-zinc-700 has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-950">
                <input
                  className="mt-1"
                  defaultChecked
                  name="predictionRows"
                  type="radio"
                  value="1"
                />
                <span>1 Tippreihe</span>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-300 p-3 text-sm font-semibold text-zinc-700 has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-950">
                <input
                  className="mt-1"
                  name="predictionRows"
                  type="radio"
                  value="2"
                />
                <span>2 Tippreihen</span>
              </label>
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Passwort</span>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              minLength={6}
              name="password"
              placeholder="Mindestens 6 Zeichen"
              required
              type="password"
            />
          </label>

          <SubmitButton
            className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-wait disabled:bg-zinc-300"
            pendingLabel="Speichert..."
            type="submit"
          >
            Profil speichern
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
