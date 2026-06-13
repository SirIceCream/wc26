"use client";

import { useState } from "react";
import { MatchList } from "@/components/app/match-card";
import { SectionTitle } from "@/components/app/primitives";
import type { Match } from "@/lib/tournament-data";

export function FixturesFilterClient({
  connected,
  initialOnlyResults = false,
  nextMatches,
  otherMatches,
  recentResults,
}: {
  connected: boolean;
  initialOnlyResults?: boolean;
  nextMatches: Match[];
  otherMatches: Match[];
  recentResults: Match[];
}) {
  const [onlyResults, setOnlyResults] = useState(initialOnlyResults);

  return (
    <>
      <div className="mb-6">
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-emerald-300">
          <input
            checked={onlyResults}
            className="h-4 w-4 accent-emerald-800"
            onChange={(event) => setOnlyResults(event.target.checked)}
            type="checkbox"
          />
          <span>Nur Ergebnisse</span>
        </label>
      </div>

      <div className="space-y-7">
        {!onlyResults ? (
          <>
            <section className="space-y-3">
              <SectionTitle title="Nächste Spiele" />
              <MatchList
                linkToDetails={connected}
                matches={nextMatches}
                showPrediction
              />
            </section>

            <section className="space-y-3">
              <SectionTitle title="Weitere Spiele" />
              <MatchList linkToDetails={connected} matches={otherMatches} />
            </section>
          </>
        ) : null}

        <section className="space-y-3">
          <SectionTitle title="Ergebnisse" />
          <MatchList
            emptyMessage="Noch keine Ergebnisse. Das Turnier hat noch nicht begonnen."
            linkToDetails={connected}
            matches={recentResults}
            showPrediction
            showResult
          />
        </section>
      </div>
    </>
  );
}
