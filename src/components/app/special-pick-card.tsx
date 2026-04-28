import Link from "next/link";
import type { SpecialPrediction } from "@/lib/app-data";
import { getTeamLabel } from "@/lib/tournament-data";
import { LockCountdown } from "./lock-countdown";
import { TeamFlag } from "./primitives";

type SpecialPickKind = "champion" | "goals";

export function SpecialPickCard({
  deadlineAt,
  kind,
  prediction,
}: {
  deadlineAt: string;
  kind: SpecialPickKind;
  prediction?: SpecialPrediction;
}) {
  const championTeamCode = prediction?.championTeamCode;
  const totalGoals = prediction?.totalGoals;
  const hasChampionTip = kind === "champion" && Boolean(championTeamCode);
  const hasGoalsTip = kind === "goals" && typeof totalGoals === "number";
  const hasTip = hasChampionTip || hasGoalsTip;
  const focus = kind === "champion" ? "champion" : "goals";

  return (
    <Link
      className="grid gap-4 rounded-lg bg-zinc-950 p-4 text-white shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center"
      href={`/special-picks?focus=${focus}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-200 text-sm font-black text-yellow-950">
        {kind === "champion" ? "WM" : "TOR"}
      </div>
      <div className="min-w-0">
        <div className="font-black">
          {hasChampionTip
            ? "Dein Weltmeistertipp"
            : hasGoalsTip
              ? "Dein Tortipp"
              : kind === "champion"
                ? "Tippe auf den Weltmeister!"
                : "Tippe auf die Anzahl der geschossenen Tore bei der WM 2026"}
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-zinc-300">
          {hasChampionTip && championTeamCode ? (
            <>
              <TeamFlag code={championTeamCode} size="sm" />
              <span className="font-semibold text-white">
                {getTeamLabel(championTeamCode)}
              </span>
            </>
          ) : null}
          {hasGoalsTip ? (
            <span className="font-semibold text-white">{totalGoals} Tore</span>
          ) : null}
          {!hasTip ? (
            <span>
              {kind === "champion"
                ? "5 EUR Spezialpot pro Tippreihe."
                : "Gesamttore inkl. Verlängerungen, ohne Elfmeterschießen."}
            </span>
          ) : null}
        </div>
        <div className="mt-2">
          <LockCountdown targetAt={deadlineAt} tone="dark" />
        </div>
      </div>
      <span className="rounded-lg bg-yellow-200 px-4 py-2 text-center text-sm font-black text-yellow-950">
        {hasTip ? "Tipp ändern" : "Tippen"}
      </span>
    </Link>
  );
}
