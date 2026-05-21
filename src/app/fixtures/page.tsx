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
          Alle Spiele
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">
          Spielplan und Ergebnisse
        </h1>
      </div>

      <div className="space-y-7">
        <section className="space-y-3">
          <SectionTitle title="Erste Spiele" />
          <MatchList
            linkToDetails={data.connected}
            matches={data.todayMatches}
            showPrediction
          />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Nächste Spiele" />
          <MatchList linkToDetails={data.connected} matches={data.upcomingMatches} />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Ergebnisse" />
          <MatchList
            emptyMessage="Noch keine Ergebnisse. Das Turnier hat noch nicht begonnen."
            linkToDetails={data.connected}
            matches={data.recentResults}
            showPrediction
            showResult
          />
        </section>
      </div>
    </div>
  );
}
