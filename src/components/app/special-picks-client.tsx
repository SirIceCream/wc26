"use client";

import { useMemo, useState, type FormEvent } from "react";
import type {
  SpecialPrediction,
  SpecialPredictionsByRow,
} from "@/lib/app-data";
import {
  saveChampionPrediction,
  saveTotalGoalsPrediction,
} from "@/lib/special-picks/actions";
import type { TeamCode } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { LockCountdown } from "./lock-countdown";
import { TeamFlag } from "./primitives";

type TeamOption = {
  code: TeamCode;
  label: string;
  shortLabel: string;
};

type SaveState = "clean" | "dirty" | "error" | "new" | "saving";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("de-AT");
}

function getPrediction(
  predictions: SpecialPredictionsByRow,
  row: number,
): SpecialPrediction | undefined {
  return predictions[row];
}

function buttonLabel(state: SaveState) {
  if (state === "saving") return "Speichert...";
  if (state === "dirty") return "Änderung speichern";
  if (state === "clean") return "Tipp ändern";
  return "Tipp abgeben";
}

function statusLabel(state: SaveState) {
  if (state === "saving") return "Speichert...";
  if (state === "dirty") return "Ungespeicherte Änderung";
  if (state === "error") return "Konnte nicht speichern";
  if (state === "clean") return "Tipp gespeichert";
  return null;
}

function getState({
  dirty,
  error,
  saving,
  saved,
}: {
  dirty: boolean;
  error: boolean;
  saving: boolean;
  saved: boolean;
}): SaveState {
  if (saving) return "saving";
  if (error) return "error";
  if (dirty) return "dirty";
  return saved ? "clean" : "new";
}

function StatusPill({ state }: { state: SaveState }) {
  const label = statusLabel(state);

  if (!label) return null;

  return (
    <div
      className={cn(
        "rounded-full px-2 py-1 text-[0.65rem] font-black uppercase",
        state === "dirty" && "bg-amber-100 text-amber-900",
        state === "error" && "bg-red-100 text-red-800",
        state === "clean" && "bg-emerald-100 text-emerald-900",
        state === "saving" && "bg-zinc-100 text-zinc-600",
      )}
      role="status"
    >
      {label}
    </div>
  );
}

export function SpecialPicksClient({
  canEdit,
  deadlineAt,
  focus = "champion",
  leagueId,
  predictionEntries,
  predictionsByRow,
  teams,
}: {
  canEdit: boolean;
  deadlineAt: string;
  focus?: "champion" | "goals";
  leagueId?: string | null;
  predictionEntries: { label: string; predictionRow: number }[];
  predictionsByRow: SpecialPredictionsByRow;
  teams: TeamOption[];
}) {
  const [selectedRow, setSelectedRow] = useState(
    predictionEntries[0]?.predictionRow ?? 1,
  );
  const [savedPredictions, setSavedPredictions] =
    useState(predictionsByRow);
  const initialPrediction = getPrediction(
    predictionsByRow,
    predictionEntries[0]?.predictionRow ?? 1,
  );
  const initialChampion = initialPrediction?.championTeamCode ?? "";
  const [selectedChampion, setSelectedChampion] = useState(initialChampion);
  const [teamSearch, setTeamSearch] = useState(
    teams.find((team) => team.code === initialChampion)?.label ?? "",
  );
  const [goals, setGoals] = useState(
    initialPrediction?.totalGoals?.toString() ?? "",
  );
  const [championSaving, setChampionSaving] = useState(false);
  const [championError, setChampionError] = useState(false);
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [goalsError, setGoalsError] = useState(false);
  const selectedPrediction = getPrediction(savedPredictions, selectedRow);
  const savedChampion = selectedPrediction?.championTeamCode ?? "";
  const savedGoals = selectedPrediction?.totalGoals;

  function activateRow(row: number) {
    const prediction = getPrediction(savedPredictions, row);
    const champion = prediction?.championTeamCode ?? "";

    setSelectedRow(row);
    setSelectedChampion(champion);
    setTeamSearch(teams.find((team) => team.code === champion)?.label ?? "");
    setGoals(prediction?.totalGoals?.toString() ?? "");
    setChampionError(false);
    setGoalsError(false);
  }

  const filteredTeams = useMemo(() => {
    const query = normalize(teamSearch);

    if (!query) return teams;

    return teams.filter((team) => {
      return (
        normalize(team.label).includes(query) ||
        normalize(team.shortLabel).includes(query) ||
        normalize(team.code).includes(query)
      );
    });
  }, [teamSearch, teams]);

  const championDirty = Boolean(selectedChampion) && selectedChampion !== savedChampion;
  const goalsDirty =
    goals !== "" && goals !== (typeof savedGoals === "number" ? savedGoals.toString() : "");
  const championState = getState({
    dirty: championDirty,
    error: championError,
    saved: Boolean(savedChampion),
    saving: championSaving,
  });
  const goalsState = getState({
    dirty: goalsDirty,
    error: goalsError,
    saved: typeof savedGoals === "number",
    saving: goalsSaving,
  });

  async function handleChampionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || !leagueId || championSaving || !selectedChampion) {
      setChampionError(true);
      return;
    }

    const formData = new FormData();
    formData.set("leagueId", leagueId);
    formData.set("predictionRow", selectedRow.toString());
    formData.set("championTeamCode", selectedChampion);

    setChampionSaving(true);
    setChampionError(false);

    try {
      await saveChampionPrediction(formData);
      setSavedPredictions((current) => ({
        ...current,
        [selectedRow]: {
          championTeamCode: selectedChampion,
          predictionRow: selectedRow,
          totalGoals: current[selectedRow]?.totalGoals ?? null,
        },
      }));
    } catch {
      setChampionError(true);
    } finally {
      setChampionSaving(false);
    }
  }

  async function handleGoalsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || !leagueId || goalsSaving) return;

    const parsedGoals = Number.parseInt(goals, 10);

    if (!Number.isInteger(parsedGoals) || parsedGoals < 0 || parsedGoals > 999) {
      setGoalsError(true);
      return;
    }

    const formData = new FormData();
    formData.set("leagueId", leagueId);
    formData.set("predictionRow", selectedRow.toString());
    formData.set("totalGoals", parsedGoals.toString());

    setGoalsSaving(true);
    setGoalsError(false);

    try {
      await saveTotalGoalsPrediction(formData);
      setSavedPredictions((current) => ({
        ...current,
        [selectedRow]: {
          championTeamCode: current[selectedRow]?.championTeamCode ?? null,
          predictionRow: selectedRow,
          totalGoals: parsedGoals,
        },
      }));
    } catch {
      setGoalsError(true);
    } finally {
      setGoalsSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-5">
        {predictionEntries.length > 1 ? (
          <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
            {predictionEntries.map((entry) => (
              <button
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-black",
                  selectedRow === entry.predictionRow
                    ? "bg-emerald-800 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                )}
                key={entry.predictionRow}
                onClick={() => activateRow(entry.predictionRow)}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : null}

        <section
          className={cn(
            "rounded-lg border border-zinc-200 bg-white p-4 shadow-sm",
            focus === "champion" && "ring-2 ring-yellow-300",
          )}
        >
          <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-emerald-800">
                Weltmeister
              </div>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">
                Tippe auf den Weltmeister
              </h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                5 EUR Spezialpot pro Tippreihe.
              </p>
            </div>
            <StatusPill state={championState} />
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleChampionSubmit}>
            <div>
              <label
                className="text-xs font-black uppercase text-zinc-500"
                htmlFor="team-search"
              >
                Mannschaft suchen
              </label>
              <input
                autoComplete="off"
                className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
                id="team-search"
                onChange={(event) => {
                  setTeamSearch(event.target.value);
                  setChampionError(false);
                }}
                placeholder="z.B. Deutschland, ARG, Südafrika"
                type="search"
                value={teamSearch}
              />
            </div>

            <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredTeams.map((team) => {
                const selected = selectedChampion === team.code;

                return (
                  <button
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selected
                        ? "border-emerald-800 bg-emerald-50"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
                    )}
                    key={team.code}
                    onClick={() => {
                      setSelectedChampion(team.code);
                      setTeamSearch(team.label);
                      setChampionError(false);
                    }}
                    type="button"
                  >
                    <TeamFlag code={team.code} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-zinc-950">
                        {team.label}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        {team.shortLabel}
                      </span>
                    </span>
                    {selected ? (
                      <span className="rounded-md bg-emerald-800 px-2 py-1 text-[0.65rem] font-black uppercase text-white">
                        Tipp
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <button
              className={cn(
                "w-full rounded-lg px-4 py-3 text-sm font-black transition-colors disabled:cursor-wait disabled:opacity-70",
                championState === "clean"
                  ? "border border-emerald-800 bg-white text-emerald-900 hover:bg-emerald-50"
                  : "bg-emerald-800 text-white hover:bg-emerald-900",
                championState === "dirty" &&
                  "bg-amber-400 text-zinc-950 hover:bg-amber-300",
                championState === "error" && "bg-red-700 text-white",
                championState === "saving" && "bg-zinc-200 text-zinc-700",
              )}
              disabled={championSaving || !canEdit}
              type="submit"
            >
              {canEdit ? buttonLabel(championState) : "Spezialtipps gesperrt"}
            </button>
          </form>
        </section>

        <section
          className={cn(
            "rounded-lg border border-zinc-200 bg-white p-4 shadow-sm",
            focus === "goals" && "ring-2 ring-yellow-300",
          )}
        >
          <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-emerald-800">
                Gesamttore
              </div>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">
                Anzahl der geschossenen Tore bei der WM 2026
              </h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Inklusive Verlängerungen, ohne Elfmeterschießen.
              </p>
            </div>
            <StatusPill state={goalsState} />
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleGoalsSubmit}>
            <label
              className="text-xs font-black uppercase text-zinc-500"
              htmlFor="total-goals"
            >
              Dein Tortipp
            </label>
            <input
              className={cn(
                "h-16 w-full rounded-lg border bg-white px-4 text-center text-3xl font-black text-zinc-950 outline-none focus:border-emerald-800",
                goalsState === "dirty" && "border-amber-400 bg-amber-50",
                goalsState === "clean" && "border-emerald-300 bg-emerald-50",
                goalsState === "error" && "border-red-400 bg-red-50",
                goalsState === "new" && "border-zinc-300",
              )}
              id="total-goals"
              inputMode="numeric"
              max={999}
              min={0}
              onChange={(event) => {
                setGoals(event.target.value);
                setGoalsError(false);
              }}
              placeholder="z.B. 171"
              required
              type="number"
              value={goals}
            />
            <button
              className={cn(
                "w-full rounded-lg px-4 py-3 text-sm font-black transition-colors disabled:cursor-wait disabled:opacity-70",
                goalsState === "clean"
                  ? "border border-emerald-800 bg-white text-emerald-900 hover:bg-emerald-50"
                  : "bg-emerald-800 text-white hover:bg-emerald-900",
                goalsState === "dirty" &&
                  "bg-amber-400 text-zinc-950 hover:bg-amber-300",
                goalsState === "error" && "bg-red-700 text-white",
                goalsState === "saving" && "bg-zinc-200 text-zinc-700",
              )}
              disabled={goalsSaving || !canEdit}
              type="submit"
            >
              {canEdit ? buttonLabel(goalsState) : "Spezialtipps gesperrt"}
            </button>
          </form>
        </section>
      </div>

      <aside className="h-fit rounded-lg bg-zinc-950 p-4 text-white shadow-sm">
        <div className="text-xs font-bold uppercase text-zinc-400">
          Deadline
        </div>
        <div className="mt-2 text-lg font-black">
          Vor dem Eröffnungsspiel
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Weltmeister und Gesamttore müssen vor Turnierstart pro Tippreihe
          abgegeben sein. Danach sind die Spezialtipps gesperrt.
        </p>
        <div className="mt-4 rounded-lg bg-yellow-200 px-3 py-2 text-yellow-950">
          <LockCountdown targetAt={deadlineAt} />
        </div>
      </aside>
    </div>
  );
}
