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
