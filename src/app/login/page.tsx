import { signInWithMagicLink } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const messages: Record<string, string> = {
  "auth-callback-failed": "The sign-in link could not be verified.",
  "check-email": "Check your email for the magic link.",
  "invalid-email": "Enter a valid email address.",
  "login-required": "Sign in before saving predictions.",
  "signed-out": "You have been signed out.",
  "supabase-not-configured":
    "Supabase is not configured yet. Add .env.local values first.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_24rem] lg:py-10">
      <section className="rounded-lg bg-emerald-900 p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase text-emerald-100">
          Friends only
        </p>
        <h1 className="mt-3 max-w-xl text-4xl font-black">
          Join the WC26 prediction league.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50">
          Sign in with the email invited to the group. Picks stay private until
          matches lock.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-zinc-950">Sign in</h2>
        {message && messages[message] ? (
          <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
            {messages[message]}
          </div>
        ) : null}
        <form action={signInWithMagicLink} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700">Email</span>
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none focus:border-emerald-800"
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
          Supabase Auth is ready for credentials. Add `.env.local` before
          connecting the live sign-in action.
        </p>
      </section>
    </div>
  );
}
