import Link from "next/link";
import { SubmitButton } from "@/components/app/submit-button";
import {
  requestPasswordReset,
  updatePassword,
} from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const messages: Record<string, string> = {
  "email-rate-limit":
    "Es wurden zu viele Links angefordert. Warte kurz und versuche es erneut.",
  "invalid-email": "Gib eine gültige E-Mail-Adresse ein.",
  "invalid-password": "Das Passwort muss mindestens 6 Zeichen haben.",
  "password-mismatch": "Die Passwörter stimmen nicht überein.",
  "reset-email-sent":
    "Wenn die E-Mail registriert ist, erhältst du gleich einen Link zum Zurücksetzen.",
  "reset-link-expired":
    "Der Link ist abgelaufen oder wurde bereits verwendet. Fordere bitte einen neuen Link an.",
  "reset-request-failed":
    "Der Reset-Link konnte nicht versendet werden. Versuche es bitte erneut.",
  "reset-update-failed":
    "Das Passwort konnte nicht gespeichert werden. Versuche es bitte erneut.",
  "supabase-not-configured":
    "Der Login ist noch nicht fertig konfiguriert.",
};

async function hasResetSession() {
  if (!isSupabaseConfigured()) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user);
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const configured = isSupabaseConfigured();
  const canSetPassword = await hasResetSession();
  const statusMessage =
    message && messages[message]
      ? messages[message]
      : message
        ? "Die Anfrage konnte nicht verarbeitet werden."
        : null;
  const isSuccessMessage = message === "reset-email-sent";

  return (
    <div className="mx-auto grid min-h-screen max-w-xl content-center px-4 py-6 sm:px-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase text-emerald-800">
          Jackpotspiel 2026
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">
          Passwort zurücksetzen
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {canSetPassword
            ? "Lege ein neues Passwort für deinen Account fest."
            : "Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen."}
        </p>

        {statusMessage ? (
          <div
            className={
              isSuccessMessage
                ? "mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950"
                : "mt-5 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950"
            }
          >
            {statusMessage}
          </div>
        ) : null}

        {canSetPassword ? (
          <form action={updatePassword} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-zinc-700">
                Neues Passwort
              </span>
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
            <label className="block">
              <span className="text-sm font-bold text-zinc-700">
                Passwort wiederholen
              </span>
              <input
                autoComplete="new-password"
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
                minLength={6}
                name="passwordConfirm"
                placeholder="Noch einmal eingeben"
                required
                type="password"
              />
            </label>
            <SubmitButton
              className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={!configured}
              pendingLabel="Speichert..."
              type="submit"
            >
              Neues Passwort speichern
            </SubmitButton>
          </form>
        ) : (
          <form action={requestPasswordReset} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-zinc-700">E-Mail</span>
              <input
                autoComplete="email"
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
                name="email"
                placeholder="du@example.com"
                required
                type="email"
              />
            </label>
            <SubmitButton
              className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={!configured}
              pendingLabel="Sendet Link..."
              type="submit"
            >
              Reset-Link senden
            </SubmitButton>
          </form>
        )}

        <Link
          className="mt-5 inline-flex text-sm font-black text-emerald-800 hover:text-emerald-950"
          href="/login"
        >
          Zurück zum Login
        </Link>
      </section>
    </div>
  );
}
