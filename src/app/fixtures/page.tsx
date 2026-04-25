import { DataModeBanner } from "@/components/app/data-mode-banner";
import { MatchList } from "@/components/app/match-card";
import { SectionTitle } from "@/components/app/primitives";
import { getAppData } from "@/lib/app-data";

export default async function FixturesPage() {
  const data = await getAppData();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-emerald-800">
          All matches
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">
          Fixtures and results
        </h1>
      </div>

      <div className="space-y-7">
        <section className="space-y-3">
          <SectionTitle title="Opening fixtures" />
          <MatchList matches={data.todayMatches} showPrediction />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Next fixtures" />
          <MatchList matches={data.upcomingMatches} />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Results" />
          <MatchList
            emptyMessage="No results yet. The tournament has not kicked off."
            matches={data.recentResults}
            showPrediction
            showResult
          />
        </section>
      </div>
    </div>
  );
}
