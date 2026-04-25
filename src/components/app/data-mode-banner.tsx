import Link from "next/link";

export function DataModeBanner({ connected }: { connected: boolean }) {
  if (connected) {
    return null;
  }

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-950">
      Seed data is active. Add Supabase credentials, run migrations, and seed
      fixtures to switch these screens to live data.{" "}
      <Link className="underline" href="/login">
        Configure login next.
      </Link>
    </div>
  );
}
