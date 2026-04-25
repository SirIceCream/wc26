"use client";

import { useState, type FormEvent } from "react";
import type { PredictionEntry } from "@/lib/tournament-data";
import { savePrediction } from "@/lib/predictions/actions";
import { cn } from "@/lib/utils";

type PredictionValue = {
  away: number;
  home: number;
};

type SaveState = "clean" | "dirty" | "error" | "new" | "saving";

function valueFromPrediction(prediction?: PredictionValue | null) {
  return {
    away: prediction?.away?.toString() ?? "",
    home: prediction?.home?.toString() ?? "",
  };
}

function isSamePrediction(
  home: string,
  away: string,
  prediction?: PredictionValue | null,
) {
  return (
    Boolean(prediction) &&
    home === prediction?.home.toString() &&
    away === prediction?.away.toString()
  );
}

function parseScore(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) ? parsed : null;
}

function getSaveState(
  home: string,
  away: string,
  prediction?: PredictionValue | null,
  isSaving = false,
  hasError = false,
): SaveState {
  if (isSaving) return "saving";
  if (hasError) return "error";
  if (!prediction) return "new";
  return isSamePrediction(home, away, prediction) ? "clean" : "dirty";
}

function statusLabel(state: SaveState) {
  if (state === "saving") return "Speichert...";
  if (state === "dirty") return "Ungespeicherte Änderung";
  if (state === "error") return "Konnte nicht speichern";
  if (state === "clean") return "Tipp gespeichert";
  return null;
}

function buttonLabel(state: SaveState) {
  if (state === "saving") return "Speichert...";
  if (state === "dirty") return "Änderung speichern";
  if (state === "clean") return "Tipp ändern";
  return "Tipp speichern";
}

export function PredictionFormClient({
  canEdit,
  entry,
  leagueId,
  matchId,
  prediction,
}: {
  canEdit: boolean;
  entry: PredictionEntry;
  leagueId?: string | null;
  matchId: string;
  prediction?: PredictionValue | null;
}) {
  const [savedPrediction, setSavedPrediction] = useState(prediction ?? null);
  const [scores, setScores] = useState(() => valueFromPrediction(prediction));
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const state = getSaveState(
    scores.home,
    scores.away,
    savedPrediction,
    isSaving,
    hasError,
  );
  const status = statusLabel(state);
  const isSaved = state === "clean";
  const isDirty = state === "dirty";
  const isError = state === "error";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || isSaving) return;

    const homeScore = parseScore(scores.home);
    const awayScore = parseScore(scores.away);

    if (homeScore === null || awayScore === null) {
      setHasError(true);
      return;
    }

    const scrollPosition = {
      left: window.scrollX,
      top: window.scrollY,
    };
    const formData = new FormData(event.currentTarget);

    setIsSaving(true);
    setHasError(false);

    try {
      await savePrediction(formData);
      setSavedPrediction({ away: awayScore, home: homeScore });
    } catch {
      setHasError(true);
    } finally {
      setIsSaving(false);
      requestAnimationFrame(() => {
        window.scrollTo(scrollPosition.left, scrollPosition.top);
      });
    }
  }

  return (
    <form className="flex flex-col items-center gap-2" onSubmit={handleSubmit}>
      <input name="leagueId" type="hidden" value={leagueId ?? ""} />
      <input name="matchId" type="hidden" value={matchId} />
      <input name="entryId" type="hidden" value={entry.id} />
      <input name="predictionRow" type="hidden" value={entry.predictionRow} />
      {status ? (
        <div
          className={cn(
            "rounded-full px-2 py-1 text-[0.65rem] font-black uppercase",
            isDirty && "bg-amber-100 text-amber-900",
            isError && "bg-red-100 text-red-800",
            isSaved && "bg-emerald-100 text-emerald-900",
            state === "saving" && "bg-zinc-100 text-zinc-600",
          )}
          role="status"
        >
          {status}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          className={cn(
            "h-11 w-11 rounded-lg border bg-white text-center text-2xl font-black text-zinc-950 outline-none transition-colors focus:border-emerald-800 disabled:border-dashed disabled:bg-zinc-50 disabled:text-zinc-400",
            isDirty && "border-amber-400 bg-amber-50 text-amber-950",
            isError && "border-red-400 bg-red-50 text-red-950",
            isSaved && "border-emerald-300 bg-emerald-50 text-emerald-950",
            state === "new" && "border-zinc-300",
          )}
          disabled={!canEdit || isSaving}
          inputMode="numeric"
          max={99}
          min={0}
          name="homeScore"
          onChange={(event) => {
            setScores((current) => ({
              ...current,
              home: event.target.value,
            }));
            setHasError(false);
          }}
          placeholder="-"
          required
          type="number"
          value={scores.home}
        />
        <span className="text-lg font-black text-zinc-400">:</span>
        <input
          className={cn(
            "h-11 w-11 rounded-lg border bg-white text-center text-2xl font-black text-zinc-950 outline-none transition-colors focus:border-emerald-800 disabled:border-dashed disabled:bg-zinc-50 disabled:text-zinc-400",
            isDirty && "border-amber-400 bg-amber-50 text-amber-950",
            isError && "border-red-400 bg-red-50 text-red-950",
            isSaved && "border-emerald-300 bg-emerald-50 text-emerald-950",
            state === "new" && "border-zinc-300",
          )}
          disabled={!canEdit || isSaving}
          inputMode="numeric"
          max={99}
          min={0}
          name="awayScore"
          onChange={(event) => {
            setScores((current) => ({
              ...current,
              away: event.target.value,
            }));
            setHasError(false);
          }}
          placeholder="-"
          required
          type="number"
          value={scores.away}
        />
      </div>

      {canEdit ? (
        <button
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-black transition-colors disabled:cursor-wait disabled:opacity-70",
            isDirty && "bg-amber-400 text-zinc-950 hover:bg-amber-300",
            isSaved &&
              "border border-emerald-800 bg-white text-emerald-900 hover:bg-emerald-50",
            state === "new" && "bg-emerald-800 text-white hover:bg-emerald-900",
            isError && "bg-red-700 text-white hover:bg-red-800",
            state === "saving" && "bg-zinc-200 text-zinc-700",
          )}
          disabled={isSaving}
          type="submit"
        >
          {buttonLabel(state)}
        </button>
      ) : (
        <div className="text-center text-[0.7rem] font-semibold text-zinc-500">
          Vorschau bis Supabase verbunden ist.
        </div>
      )}
    </form>
  );
}
