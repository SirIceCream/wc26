import Image from "next/image";
import { signInWithMagicLink, signInWithPassword } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import logo from "../../../resources/logo.jpg";

const messages: Record<string, string> = {
  "auth-callback-failed": "The sign-in link could not be verified.",
  "check-email": "Check your email for the magic link.",
  "email-rate-limit":
    "Too many sign-in emails were requested. Wait a minute, then try again.",
  "invalid-email": "Enter a valid email address.",
  "invalid-login": "Email or password is not correct.",
  "invalid-password": "Password must be at least 6 characters.",
  "login-required": "Sign in before saving predictions.",
  "signed-out": "You have been signed out.",
  "supabase-not-configured":
    "Supabase is not configured yet. Add the live project values first.",
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
        ? "Sign-in failed. Check the email address and try again."
        : null;

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl content-center gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-10">
      <section className="rounded-lg bg-emerald-900 p-6 text-white shadow-sm">
        <Image
          alt="WC26 Jackpotspiel"
          className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/20"
          priority
          src={logo}
        />
        <p className="text-xs font-bold uppercase text-emerald-100">
          Private Tipprunde
        </p>
        <h1 className="mt-3 max-w-xl text-4xl font-black">
          Einloggen und Tipps speichern.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50">
          Neue Spieler starten mit einem Magic Link. Danach kannst du dich mit
          E-Mail und Passwort anmelden.
        </p>
        <div className="mt-6 grid gap-3 text-sm font-semibold text-emerald-50 sm:grid-cols-3">
          <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
            E-Mail eingeben
          </div>
          <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
            Link oeffnen
          </div>
          <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
            Tipps abgeben
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-zinc-950">Login</h2>
        {statusMessage ? (
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
            {statusMessage}
          </div>
        ) : null}
        <form action={signInWithPassword} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">
              Name oder Email
            </span>
            <input
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              name="identifier"
              placeholder="Alex"
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
            Login
          </button>
        </form>

        <div className="border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-black uppercase text-zinc-500">
            Erster Login
          </h3>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Noch kein Passwort? Fordere einmalig einen Magic Link an.
          </p>
        </div>

        <form action={signInWithMagicLink} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Email</span>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
          </label>
          <button
            className="w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!configured}
            type="submit"
          >
            Send magic link
          </button>
        </form>
      </section>
    </div>
  );
}
