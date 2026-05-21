import { DataModeBanner } from "@/components/app/data-mode-banner";
import { LeaderboardList, Podium } from "@/components/app/leaderboard";
import { SectionTitle } from "@/components/app/primitives";
import { getAppData } from "@/lib/app-data";

export default async function LeaderboardPage() {
  const data = await getAppData();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-800">
            Rangliste
          </p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">
            Private League Rangliste
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Podium rows={data.leaderboard} />
        <section className="space-y-3">
          <SectionTitle title="Gesamte Rangliste" />
          <LeaderboardList rows={data.leaderboard} />
        </section>
      </div>
    </div>
  );
}
