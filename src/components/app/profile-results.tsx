"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProfileResultRow } from "@/lib/app-data";
import {
  getStageLabel,
  getTeamLabel,
  getTeamShortLabel,
} from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";
import { StatusChip, Surface, TeamFlag } from "./primitives";

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function outcomeLabel(outcome: ProfileResultRow["outcome"]) {
  if (outcome === "hit") return "Treffer";
  if (outcome === "no-tip") return "Kein Tipp";

  return "Kein Treffer";
}

function outcomeKind(outcome: ProfileResultRow["outcome"]) {
  if (outcome === "hit") return "hit";

  return "miss";
}

function predictionLabel(result: ProfileResultRow) {
  if (!result.predictedScore) return "Kein Tipp";

  return `${result.predictedScore.home}:${result.predictedScore.away}`;
}

export type ProfileResultSort = "newest" | "winnings";

export function ProfileResults({
  predictionLabelText = "Mein Tipp",
  results,
}: {
  predictionLabelText?: string;
  results: ProfileResultRow[];
}) {
  const [sort, setSort] = useState<ProfileResultSort>("newest");
  const [pendingSort, setPendingSort] = useState<ProfileResultSort | null>(null);
  const timer = useRef<number | null>(null);
  const wonCount = results.filter((result) => result.payoutEuros > 0).length;
  const visibleResults = useMemo(
    () => [...results].sort((a, b) => {
      const dateDiff =
        new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime();
      const gameIdDiff = (b.gameId ?? 0) - (a.gameId ?? 0);
      const predictionRowDiff = a.predictionRow - b.predictionRow;

      if (sort === "winnings") {
        return (
          b.payoutEuros - a.payoutEuros ||
          dateDiff ||
          gameIdDiff ||
          predictionRowDiff
        );
      }

      return dateDiff || gameIdDiff || predictionRowDiff;
    }),
    [results, sort],
  );

  useEffect(
    () => () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    },
    [],
  );

  function handleSort(nextSort: ProfileResultSort) {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    setPendingSort(nextSort);
    setSort(nextSort);
    timer.current = window.setTimeout(() => {
      setPendingSort(null);
      timer.current = null;
    }, 220);
  }

  if (!results.length) {
    return (
      <Surface className="p-4">
        <p className="text-sm font-semibold text-zinc-500">
          Noch keine Ergebnisse.
        </p>
      </Surface>
    );
  }

  return (
    <Surface>
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-grid grid-cols-2 rounded-lg bg-zinc-100 p-1 text-xs font-black">
          <button
            aria-pressed={sort === "newest"}
            className={cn(
              "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 transition",
              sort === "newest"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-950",
            )}
            onClick={() => handleSort("newest")}
            type="button"
          >
            {pendingSort === "newest" ? <LoadingSpinner /> : null}
            Neueste zuerst
          </button>
          <button
            aria-pressed={sort === "winnings"}
            className={cn(
              "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 transition",
              sort === "winnings"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-950",
            )}
            onClick={() => handleSort("winnings")}
            type="button"
          >
            {pendingSort === "winnings" ? <LoadingSpinner /> : null}
            Gewinn absteigend ({wonCount})
          </button>
        </div>
      </div>
      {visibleResults.length ? (
        visibleResults.map((result, index) => (
          <div
            className={cn(
              result.outcome === "hit" && "bg-yellow-50",
              index < visibleResults.length - 1 &&
                (result.outcome === "hit"
                  ? "border-b border-yellow-100"
                  : "border-b border-zinc-100"),
            )}
            key={result.id}
          >
            <div className="grid gap-4 px-4 py-4 lg:grid-cols-[7rem_1fr_auto] lg:items-center">
              <div className="text-xs font-semibold text-zinc-500">
                <div className="text-sm font-bold text-zinc-950">
                  {result.time}
                </div>
                <div>{getStageLabel(result.stage)}</div>
                <div>{result.entryLabel}</div>
              </div>

              <div className="min-w-0">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamFlag code={result.home} size="sm" />
                    <span className="truncate text-sm font-bold text-zinc-950">
                      {getTeamLabel(result.home)}
                    </span>
                  </div>
                  <div className="text-lg font-black text-zinc-950">
                    {result.finalScore.home}:{result.finalScore.away}
                  </div>
                  <div className="flex min-w-0 items-center justify-end gap-2 text-right">
                    <span className="truncate text-sm font-bold text-zinc-950">
                      {getTeamLabel(result.away)}
                    </span>
                    <TeamFlag code={result.away} size="sm" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
                  <span className="rounded-md bg-emerald-50 px-2 py-1 font-black text-emerald-900 ring-1 ring-emerald-100">
                    {predictionLabelText}: {predictionLabel(result)}
                  </span>
                  <span>
                    {getTeamShortLabel(result.home)} -{" "}
                    {getTeamShortLabel(result.away)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end">
                <div className="text-right">
                  <div className="text-xl font-black text-zinc-950">
                    {formatEuro(result.payoutEuros)}
                  </div>
                  <div className="mt-1">
                    <StatusChip kind={outcomeKind(result.outcome)}>
                      {outcomeLabel(result.outcome)}
                    </StatusChip>
                  </div>
                </div>
                <Link
                  className="text-sm font-bold text-emerald-800"
                  href={`/match/${result.matchId}`}
                >
                  Spieldetails
                </Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="px-4 py-5 text-sm font-semibold text-zinc-500">
          Keine gewonnenen Spiele.
        </div>
      )}
    </Surface>
  );
}
