"use client";

import { useState, type FormEvent } from "react";
import type {
  SpecialPrediction,
  SpecialPredictionsByRow,
} from "@/lib/app-data";
import {
  saveChampionPrediction,
  saveTotalGoalsPrediction,
} from "@/lib/special-picks/actions";
import { getTeamLabel, type TeamCode } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { TeamFlag } from "./primitives";

type TeamOption = {
  code: TeamCode;
  label: string;
};

type PredictionEntry = {
  label: string;
  ownerName: string;
  predictionRow: number;
};

type RowState = {
  championTeamCode: string;
  savedChampionTeamCode: string;
  savedTotalGoals: string;
  totalGoals: string;
};

function buildInitialState(
  entries: PredictionEntry[],
  predictions: SpecialPredictionsByRow,
) {
  return Object.fromEntries(
    entries.map((entry) => {
      const prediction: SpecialPrediction | undefined =
        predictions[entry.predictionRow];
      const championTeamCode = prediction?.championTeamCode ?? "";
      const totalGoals =
        typeof prediction?.totalGoals === "number"
          ? prediction.totalGoals.toString()
          : "";

      return [
        entry.predictionRow,
        {
          championTeamCode,
          savedChampionTeamCode: championTeamCode,
          savedTotalGoals: totalGoals,
          totalGoals,
        },
      ];
    }),
  ) as Record<number, RowState>;
}

export function ProfileSpecialPicks({
  canEdit,
  leagueId,
  predictionEntries,
  predictionsByRow,
  teams,
}: {
  canEdit: boolean;
  leagueId: string | null;
  predictionEntries: PredictionEntry[];
  predictionsByRow: SpecialPredictionsByRow;
  teams: TeamOption[];
}) {
  const [rows, setRows] = useState(() =>
    buildInitialState(predictionEntries, predictionsByRow),
  );
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({});
  const [errorRows, setErrorRows] = useState<Record<number, boolean>>({});

  function updateRow(row: number, values: Partial<RowState>) {
    setRows((current) => ({
      ...current,
      [row]: {
        ...current[row],
        ...values,
      },
    }));
    setErrorRows((current) => ({ ...current, [row]: false }));
  }

  async function saveRow(event: FormEvent<HTMLFormElement>, row: number) {
    event.preventDefault();

    if (!canEdit || !leagueId || savingRows[row]) return;

    const current = rows[row];
    const parsedGoals = Number.parseInt(current.totalGoals, 10);

    if (
      !current.championTeamCode ||
      !Number.isInteger(parsedGoals) ||
      parsedGoals < 0 ||
      parsedGoals > 999
    ) {
      setErrorRows((errors) => ({ ...errors, [row]: true }));
      return;
    }

    setSavingRows((currentSaving) => ({ ...currentSaving, [row]: true }));
    setErrorRows((errors) => ({ ...errors, [row]: false }));

    const championData = new FormData();
    championData.set("leagueId", leagueId);
    championData.set("predictionRow", row.toString());
    championData.set("championTeamCode", current.championTeamCode);

    const goalsData = new FormData();
    goalsData.set("leagueId", leagueId);
    goalsData.set("predictionRow", row.toString());
    goalsData.set("totalGoals", parsedGoals.toString());

    try {
      await saveChampionPrediction(championData);
      await saveTotalGoalsPrediction(goalsData);
      updateRow(row, {
        savedChampionTeamCode: current.championTeamCode,
        savedTotalGoals: parsedGoals.toString(),
      });
    } catch {
      setErrorRows((errors) => ({ ...errors, [row]: true }));
    } finally {
      setSavingRows((currentSaving) => ({ ...currentSaving, [row]: false }));
    }
  }

  return (
    <div className="grid gap-3">
      {predictionEntries.map((entry) => {
        const row = rows[entry.predictionRow];
        const dirty =
          row.championTeamCode !== row.savedChampionTeamCode ||
          row.totalGoals !== row.savedTotalGoals;
        const saving = Boolean(savingRows[entry.predictionRow]);
        const error = Boolean(errorRows[entry.predictionRow]);

        return (
          <form
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            key={entry.predictionRow}
            onSubmit={(event) => saveRow(event, entry.predictionRow)}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-zinc-950">
                  {entry.label}
                </h3>
                <p className="text-xs font-semibold text-zinc-500">
                  {entry.ownerName}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-full px-2 py-1 text-[0.65rem] font-black uppercase",
                  dirty && "bg-amber-100 text-amber-900",
                  error && "bg-red-100 text-red-800",
                  !dirty && !error && "bg-emerald-100 text-emerald-900",
                )}
              >
                {error ? "Fehler" : dirty ? "Ungespeichert" : "Gespeichert"}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
              <label className="block">
                <span className="text-xs font-black uppercase text-zinc-500">
                  Weltmeister
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
                  disabled={!canEdit || saving}
                  onChange={(event) =>
                    updateRow(entry.predictionRow, {
                      championTeamCode: event.target.value,
                    })
                  }
                  required
                  value={row.championTeamCode}
                >
                  <option value="">Auswaehlen</option>
                  {teams.map((team) => (
                    <option key={team.code} value={team.code}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase text-zinc-500">
                  Torwette
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-center text-sm font-black text-zinc-950 outline-none focus:border-emerald-800"
                  disabled={!canEdit || saving}
                  inputMode="numeric"
                  max={999}
                  min={0}
                  onChange={(event) =>
                    updateRow(entry.predictionRow, {
                      totalGoals: event.target.value,
                    })
                  }
                  required
                  type="number"
                  value={row.totalGoals}
                />
              </label>

              <button
                className="h-11 rounded-lg bg-zinc-950 px-4 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={!canEdit || saving}
                type="submit"
              >
                {saving ? "Speichert..." : canEdit ? "Speichern" : "Gesperrt"}
              </button>
            </div>

            {row.savedChampionTeamCode || row.savedTotalGoals ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
                {row.savedChampionTeamCode ? (
                  <>
                    <TeamFlag code={row.savedChampionTeamCode} size="sm" />
                    <span>{getTeamLabel(row.savedChampionTeamCode)}</span>
                  </>
                ) : null}
                {row.savedTotalGoals ? <span>{row.savedTotalGoals} Tore</span> : null}
              </div>
            ) : null}
          </form>
        );
      })}
    </div>
  );
}
