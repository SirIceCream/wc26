"use client";

import { useMemo, useState } from "react";
import { PredictionCard } from "@/components/app/match-card";
import { Surface } from "@/components/app/primitives";
import type { Match, PredictionEntry } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

type SavedRowsByMatch = Record<string, Record<number, true>>;

type MatchPhase = {
  key: string;
  label: string;
  order: number;
};

const GROUP_PHASE: MatchPhase = {
  key: "group",
  label: "Vorrunde",
  order: 0,
};

const KNOCKOUT_PHASES: MatchPhase[] = [
  { key: "round-of-32", label: "Top 32", order: 1 },
  { key: "round-of-16", label: "Top 16", order: 2 },
  { key: "quarter-finals", label: "Top 8", order: 3 },
  { key: "semi-finals", label: "Halbfinale", order: 4 },
  { key: "third-place", label: "Spiel um Platz 3", order: 5 },
  { key: "final", label: "Finale", order: 6 },
];

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

function getMatchPhase(match: Match): MatchPhase {
  const stage = match.stage.toLowerCase();

  if (stage.includes("round of 32") || stage.includes("sechzehntelfinale")) {
    return KNOCKOUT_PHASES[0];
  }

  if (stage.includes("round of 16") || stage.includes("achtelfinale")) {
    return KNOCKOUT_PHASES[1];
  }

  if (stage.includes("quarter") || stage.includes("viertelfinale")) {
    return KNOCKOUT_PHASES[2];
  }

  if (stage.includes("semi") || stage.includes("halbfinale")) {
    return KNOCKOUT_PHASES[3];
  }

  if (stage.includes("third") || stage.includes("platz")) {
    return KNOCKOUT_PHASES[4];
  }

  if (stage.includes("final")) {
    return KNOCKOUT_PHASES[5];
  }

  return GROUP_PHASE;
}

function getAvailableKnockoutPhases(matches: Match[]) {
  const phases = matches
    .map(getMatchPhase)
    .filter((phase) => phase.key !== GROUP_PHASE.key)
    .sort((a, b) => a.order - b.order);
  const uniquePhases = new Map<string, MatchPhase>();

  for (const phase of phases) {
    uniquePhases.set(phase.key, phase);
  }

  return [...uniquePhases.values()];
}

function buildSections(matches: Match[]) {
  const sections = new Map<string, { phase: MatchPhase; matches: Match[] }>();

  for (const match of matches) {
    const phase = getMatchPhase(match);
    const section = sections.get(phase.key) ?? { phase, matches: [] };

    section.matches.push(match);
    sections.set(phase.key, section);
  }

  return [...sections.values()].sort((a, b) => a.phase.order - b.phase.order);
}

function matchCountLabel(count: number) {
  return `${count} ${count === 1 ? "Spiel" : "Spiele"}`;
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
  const availableKnockoutPhases = useMemo(
    () => getAvailableKnockoutPhases(matches),
    [matches],
  );
  const [selectedPhaseKey, setSelectedPhaseKey] = useState<string | null>(null);
  const visibleMatches = matches.filter((match) => {
    if (
      selectedPhaseKey &&
      getMatchPhase(match).key !== selectedPhaseKey
    ) {
      return false;
    }

    if (
      onlyUnpicked &&
      isFullyPredicted(match.id, entries, savedRowsByMatch)
    ) {
      return false;
    }

    return true;
  });
  const sections = buildSections(visibleMatches);
  const emptyMessage = !matches.length
    ? "Aktuell sind keine Spiele zum Tippen freigeschaltet."
    : "Keine offenen Spiele in dieser Auswahl.";

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
          <div className="flex flex-wrap gap-2">
            {availableKnockoutPhases.length ? (
              <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
                <button
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-bold transition",
                    selectedPhaseKey === null
                      ? "bg-emerald-800 text-white"
                      : "text-zinc-700 hover:bg-zinc-100",
                  )}
                  onClick={() => setSelectedPhaseKey(null)}
                  type="button"
                >
                  Alle
                </button>
                {availableKnockoutPhases.map((phase) => (
                  <button
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-bold transition",
                      selectedPhaseKey === phase.key
                        ? "bg-emerald-800 text-white"
                        : "text-zinc-700 hover:bg-zinc-100",
                    )}
                    key={phase.key}
                    onClick={() => setSelectedPhaseKey(phase.key)}
                    type="button"
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
            ) : null}
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-emerald-300">
              <input
                checked={onlyUnpicked}
                className="h-4 w-4 accent-emerald-800"
                onChange={(event) => setOnlyUnpicked(event.target.checked)}
                type="checkbox"
              />
              <span>Nur ungetippte Spiele</span>
            </label>
          </div>
        ) : null}
      </div>

      {sections.length ? (
        <div className="space-y-6">
          {sections.map((section, index) => (
            <section
              className={cn(
                "space-y-3",
                index > 0 && "border-t border-zinc-200 pt-5",
              )}
              key={section.phase.key}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-black uppercase text-zinc-950">
                  {section.phase.label}
                </div>
                <div className="h-px flex-1 bg-zinc-200" />
                <div className="text-xs font-bold uppercase text-zinc-500">
                  {matchCountLabel(section.matches.length)}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {section.matches.map((match) => (
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
            </section>
          ))}
        </div>
      ) : (
        <Surface className="p-4">
          <p className="text-sm font-semibold text-zinc-500">
            {emptyMessage}
          </p>
        </Surface>
      )}
    </section>
  );
}
