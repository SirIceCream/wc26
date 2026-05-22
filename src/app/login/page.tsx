import Image from "next/image";
import { signInWithMagicLink, signInWithPassword } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import logo from "../../../resources/logo.jpg";

const messages: Record<string, string> = {
  "auth-callback-failed": "Der Login-Link konnte nicht bestätigt werden.",
  "auth-link-denied":
    "Der Login-Link wurde abgelehnt oder ist abgelaufen. Fordere bitte einen neuen Link an.",
  "check-email": "Prüfe deine E-Mails und öffne den Login-Link.",
  "email-rate-limit":
    "Es wurden zu viele Links angefordert. Warte kurz und versuche es erneut.",
  "invalid-email": "Gib eine gültige E-Mail-Adresse ein.",
  "invalid-invite": "Der Einladungscode ist nicht gültig.",
  "invalid-login": "Name, E-Mail oder Passwort ist nicht korrekt.",
  "invalid-password": "Das Passwort muss mindestens 6 Zeichen haben.",
  "login-required": "Melde dich zuerst an.",
  "signed-out": "Du wurdest abgemeldet.",
  "supabase-not-configured":
    "Der Login ist noch nicht fertig konfiguriert.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const configured = isSupabaseConfigured();
  const statusMessage =
    message && messages[message]
      ? messages[message]
      : message
        ? "Login fehlgeschlagen. Prüfe deine Eingaben und versuche es erneut."
        : null;

  return (
    <div className="mx-auto grid min-h-screen max-w-4xl content-center gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-10">
      <section className="rounded-lg bg-emerald-900 p-6 text-white shadow-sm">
        <Image
          alt="WC26 Jackpotspiel"
          className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/20"
          priority
          src={logo}
        />
        <h1 className="mt-3 max-w-xl text-4xl font-black">
          Jackpotspiel 2026
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50">
          Melde dich an, gib deine Tipps ab und knacke den Jackpot!
        </p>
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-zinc-950">Anmelden</h2>
        {statusMessage ? (
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
            {statusMessage}
          </div>
        ) : null}
        <form action={signInWithPassword} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">
              Name oder E-Mail
            </span>
            <input
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              name="identifier"
              placeholder="Username oder E-Mail"
              type="text"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Passwort</span>
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              name="password"
              placeholder="Mindestens 6 Zeichen"
              type="password"
            />
          </label>
          <button
            className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!configured}
            type="submit"
          >
            Einloggen
          </button>
        </form>

        <div className="border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-black uppercase text-zinc-500">
            Erster Zugang
          </h3>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Noch kein Passwort? Fordere mit deinem Einladungscode einen
            Login-Link an.
          </p>
        </div>

        <form action={signInWithMagicLink} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">E-Mail</span>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              name="email"
              placeholder="du@example.com"
              type="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">
              Einladungscode
            </span>
            <input
              autoComplete="off"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              name="inviteCode"
              placeholder="Code"
              type="text"
            />
          </label>
          <button
            className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!configured}
            type="submit"
          >
            Login-Link anfordern
          </button>
        </form>
      </section>
    </div>
  );
}
