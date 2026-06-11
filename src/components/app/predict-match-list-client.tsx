"use client";

import { useMemo, useState } from "react";
import { PredictionCard } from "@/components/app/match-card";
import { Surface } from "@/components/app/primitives";
import type { Match, PredictionEntry } from "@/lib/tournament-data";

type SavedRowsByMatch = Record<string, Record<number, true>>;

function getEntries(predictionEntries: PredictionEntry[]) {
  return predictionEntries.length
    ? predictionEntries
    : [
        {
          id: "primary",
          isAdditional: false,
          label: "Tippreihe 1",
          ownerName: "Du",
          predictionRow: 1,
        },
      ];
}

function hasPrediction(match: Match, entry: PredictionEntry) {
  return Boolean(
    match.predictionsByRow?.[entry.predictionRow] ??
      (entry.predictionRow === 1 ? match.prediction : null),
  );
}

function buildSavedRows(matches: Match[], entries: PredictionEntry[]) {
  return Object.fromEntries(
    matches.map((match) => [
      match.id,
      Object.fromEntries(
        entries
          .filter((entry) => hasPrediction(match, entry))
          .map((entry) => [entry.predictionRow, true]),
      ),
    ]),
  ) as SavedRowsByMatch;
}

function isFullyPredicted(
  matchId: string,
  entries: PredictionEntry[],
  savedRowsByMatch: SavedRowsByMatch,
) {
  const savedRows = savedRowsByMatch[matchId] ?? {};

  return entries.every((entry) => savedRows[entry.predictionRow]);
}

export function PredictMatchListClient({
  canEdit,
  leagueId,
  matches,
  predictionEntries,
}: {
  canEdit: boolean;
  leagueId?: string | null;
  matches: Match[];
  predictionEntries: PredictionEntry[];
}) {
  const entries = useMemo(
    () => getEntries(predictionEntries),
    [predictionEntries],
  );
  const [onlyUnpicked, setOnlyUnpicked] = useState(false);
  const [savedRowsByMatch, setSavedRowsByMatch] = useState(() =>
    buildSavedRows(matches, entries),
  );
  const visibleMatches = onlyUnpicked
    ? matches.filter(
        (match) => !isFullyPredicted(match.id, entries, savedRowsByMatch),
      )
    : matches;

  function markPredictionSaved(matchId: string, predictionRow: number) {
    setSavedRowsByMatch((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        [predictionRow]: true,
      },
    }));
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Offene Tipps
        </h2>
        {matches.length ? (
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-emerald-300">
            <input
              checked={onlyUnpicked}
              className="h-4 w-4 accent-emerald-800"
              onChange={(event) => setOnlyUnpicked(event.target.checked)}
              type="checkbox"
            />
            <span>Nur ungetippte Spiele</span>
          </label>
        ) : null}
      </div>

      {visibleMatches.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleMatches.map((match) => (
            <PredictionCard
              editable={canEdit}
              key={match.id}
              leagueId={leagueId}
              match={match}
              onPredictionSaved={markPredictionSaved}
              predictionEntries={entries}
            />
          ))}
        </div>
      ) : (
        <Surface className="p-4">
          <p className="text-sm font-semibold text-zinc-500">
            {matches.length
              ? "Alle offenen Spiele sind getippt."
              : "Aktuell sind keine Spiele zum Tippen freigeschaltet."}
          </p>
        </Surface>
      )}
    </section>
  );
}
