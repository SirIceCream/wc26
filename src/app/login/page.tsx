import { signInWithMagicLink } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const messages: Record<string, string> = {
  "auth-callback-failed": "The sign-in link could not be verified.",
  "check-email": "Check your email for the magic link.",
  "email-rate-limit":
    "Too many sign-in emails were requested. Wait a minute, then try again.",
  "invalid-email": "Enter a valid email address.",
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
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-10">
      <section className="rounded-lg bg-emerald-900 p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase text-emerald-100">
          Private Tipprunde
        </p>
        <h1 className="mt-3 max-w-xl text-4xl font-black">
          Mit deiner E-Mail einloggen und Tipps speichern.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50">
          Der Login laeuft ueber Supabase Magic Links. Neue echte Benutzer
          bekommen nach dem ersten Login automatisch ein Profil und werden der
          Tipprunde hinzugefuegt.
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

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-zinc-950">Sign in</h2>
        {statusMessage ? (
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
            {statusMessage}
          </div>
        ) : null}
        <form action={signInWithMagicLink} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Email</span>
            <input
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
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Use the same email address you want attached to your predictions.
          The link expires automatically.
        </p>
      </section>
    </div>
  );
}
