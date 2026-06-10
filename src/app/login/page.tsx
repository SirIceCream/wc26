import Image from "next/image";
import Link from "next/link";
import { SubmitButton } from "@/components/app/submit-button";
import { signInWithPassword } from "@/lib/auth/actions";
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
  "signups-closed": "Die Anmeldung für neue Teilnehmer ist geschlossen.",
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
    <div className="mx-auto grid min-h-screen max-w-5xl content-center gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-10">
      <section className="overflow-hidden rounded-lg bg-emerald-900 text-white shadow-sm">
        <div className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
          <div>
            <Image
              alt="WC26 Jackpotspiel"
              className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/20"
              priority
              src={logo}
            />
            <h1 className="mt-4 max-w-xl text-4xl font-black">
              Jackpotspiel 2026
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50">
              Melde dich mit deinem bestehenden Konto an und gib deine Tipps
              rechtzeitig vor dem Anpfiff ab.
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-emerald-50 ring-1 ring-white/15">
            Die Anmeldung für neue Teilnehmer ist geschlossen. Bestehende
            Teilnehmer können sich weiterhin einloggen.
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase text-emerald-800">
            Bestehendes Konto
          </p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">
            Einloggen
          </h2>
        </div>
        {statusMessage ? (
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
            {statusMessage}
          </div>
        ) : null}
        <form action={signInWithPassword} className="mt-5 space-y-4">
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
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                className="text-sm font-bold text-zinc-700"
                htmlFor="login-password"
              >
                Passwort
              </label>
              <Link
                className="text-xs font-black text-emerald-800 hover:text-emerald-950"
                href="/reset-password"
              >
                Passwort vergessen?
              </Link>
            </div>
            <input
              autoComplete="current-password"
              id="login-password"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              name="password"
              placeholder="Mindestens 6 Zeichen"
              type="password"
            />
          </div>
          <SubmitButton
            className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!configured}
            pendingLabel="Wird eingeloggt..."
            type="submit"
          >
            Einloggen
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
