import type {
  SpecialPickRevealEntry,
  TournamentProgress,
} from "@/lib/app-data";
import { SPECIAL_PICK_STAKE_EUROS } from "@/lib/special-picks/constants";
import { getTeamLabel } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { LockCountdown } from "./lock-countdown";
import { Surface, TeamFlag } from "./primitives";

type ChampionPickGroup = {
  championTeamCode: string | null;
  entries: SpecialPickRevealEntry[];
  label: string;
  possibleWinEuros: number | null;
};

type GoalsPickGroup = {
  entries: SpecialPickRevealEntry[];
  label: string;
  possibleWinEuros: number | null;
  totalGoals: number | null;
};

type GoalProjection = {
  percent: number;
  rangeNote: string | null;
  value: number;
};

type GoalMeterPosition = {
  percent: number;
  rangeNote: string | null;
  value: number;
};

function floorToCents(value: number) {
  return Math.floor(value * 100) / 100;
}

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function formatGoalCount(value: number) {
  return `${value} ${value === 1 ? "Tor" : "Tore"}`;
}

function buildChampionGroups(entries: SpecialPickRevealEntry[]) {
  const groups = new Map<string, ChampionPickGroup>();
  const totalChampionPotEuros = entries.length * SPECIAL_PICK_STAKE_EUROS;

  for (const entry of entries) {
    const key = entry.championTeamCode ?? "no-tip";
    const existing = groups.get(key);

    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    groups.set(key, {
      championTeamCode: entry.championTeamCode,
      entries: [entry],
      label: entry.championTeamCode
        ? getTeamLabel(entry.championTeamCode)
        : "Kein Tipp",
      possibleWinEuros: entry.championTeamCode
        ? floorToCents(totalChampionPotEuros)
        : null,
    });
  }

  const grouped = [...groups.values()].map((group) => ({
    ...group,
    possibleWinEuros: group.championTeamCode
      ? floorToCents(totalChampionPotEuros / group.entries.length)
      : null,
  }));

  return grouped.sort((a, b) => {
    if (a.championTeamCode === null && b.championTeamCode !== null) return 1;
    if (a.championTeamCode !== null && b.championTeamCode === null) return -1;

    return b.entries.length - a.entries.length || a.label.localeCompare(b.label, "de-AT");
  });
}

function buildGoalsGroups(entries: SpecialPickRevealEntry[]) {
  const groups = new Map<string, GoalsPickGroup>();
  const totalGoalsPotEuros = entries.length * SPECIAL_PICK_STAKE_EUROS;

  for (const entry of entries) {
    const key = entry.totalGoals === null ? "no-tip" : String(entry.totalGoals);
    const existing = groups.get(key);

    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    groups.set(key, {
      entries: [entry],
      label: entry.totalGoals === null ? "Kein Tipp" : `${entry.totalGoals} Tore`,
      possibleWinEuros: entry.totalGoals === null
        ? null
        : floorToCents(totalGoalsPotEuros),
      totalGoals: entry.totalGoals,
    });
  }

  const grouped = [...groups.values()].map((group) => ({
    ...group,
    possibleWinEuros: group.totalGoals === null
      ? null
      : floorToCents(totalGoalsPotEuros / group.entries.length),
  }));

  return grouped.sort((a, b) => {
    if (a.totalGoals === null && b.totalGoals !== null) return 1;
    if (a.totalGoals !== null && b.totalGoals === null) return -1;

    return (a.totalGoals ?? 0) - (b.totalGoals ?? 0);
  });
}

function buildGoalMeterPosition({
  groups,
  value,
}: {
  groups: GoalsPickGroup[];
  value: number;
}): GoalMeterPosition | null {
  const totals = groups
    .map((group) => group.totalGoals)
    .filter((totalGoals): totalGoals is number => totalGoals !== null);

  if (totals.length === 0) {
    return null;
  }

  const submittedMin = Math.min(...totals);
  const submittedMax = Math.max(...totals);
  const sortedTotals = [...totals].sort((a, b) => a - b);
  let position = 0;

  if (sortedTotals.length === 1) {
    position = 0.5;
  } else if (value <= sortedTotals[0]) {
    position = 0;
  } else if (value >= sortedTotals[sortedTotals.length - 1]) {
    position = sortedTotals.length - 1;
  } else {
    const upperIndex = sortedTotals.findIndex((totalGoals) => value <= totalGoals);
    const lowerIndex = upperIndex - 1;
    const lowerValue = sortedTotals[lowerIndex];
    const upperValue = sortedTotals[upperIndex];
    const gapPosition = (value - lowerValue) / (upperValue - lowerValue);

    position = lowerIndex + gapPosition;
  }

  const percent = sortedTotals.length === 1
    ? 50
    : (position / (sortedTotals.length - 1)) * 100;

  return {
    percent,
    rangeNote: value > submittedMax
      ? "über allen Tipps"
      : value < submittedMin
        ? "unter allen Tipps"
        : null,
    value,
  };
}

function buildGoalProjection({
  groups,
  progress,
}: {
  groups: GoalsPickGroup[];
  progress: TournamentProgress;
}): GoalProjection | null {
  if (
    progress.completedMatches <= 0 ||
    progress.totalMatches <= 0
  ) {
    return null;
  }

  const value = Math.round(
    (progress.totalGoals / progress.completedMatches) * progress.totalMatches,
  );
  const position = buildGoalMeterPosition({ groups, value });

  return position ? { ...position, value } : null;
}

function hasCurrentUserEntry(entries: SpecialPickRevealEntry[]) {
  return entries.some((entry) => entry.isCurrentUser);
}

function UserRowBadges({
  align = "left",
  entries,
  muted = false,
}: {
  align?: "left" | "responsive-right" | "right";
  entries: SpecialPickRevealEntry[];
  muted?: boolean;
}) {
  const users = new Map<
    string,
    {
      entries: SpecialPickRevealEntry[];
      isCurrentUser: boolean;
      ownerName: string;
    }
  >();

  for (const entry of entries) {
    const existing = users.get(entry.ownerName);

    if (existing) {
      existing.entries.push(entry);
      existing.isCurrentUser ||= entry.isCurrentUser;
      continue;
    }

    users.set(entry.ownerName, {
      entries: [entry],
      isCurrentUser: entry.isCurrentUser,
      ownerName: entry.ownerName,
    });
  }

  return (
    <div
      className={cn(
        "mt-3 flex flex-wrap gap-2",
        align === "right" && "justify-end",
        align === "responsive-right" && "sm:justify-end",
      )}
    >
      {[...users.values()].map((user) => {
        const rows = user.entries
          .map((entry) => entry.predictionRow)
          .sort((a, b) => a - b)
          .map((row) => `R${row}`)
          .join("+");

        return (
          <span
            className={cn(
              "max-w-full break-words rounded-md px-2 py-1 text-xs font-bold",
              muted
                ? "bg-zinc-100 text-zinc-500"
                : user.isCurrentUser
                ? "bg-emerald-800 text-white"
                : "bg-zinc-100 text-zinc-700",
            )}
            key={user.ownerName}
          >
            {user.ownerName} · {rows}
          </span>
        );
      })}
    </div>
  );
}

function ChampionReveal({ entries }: { entries: SpecialPickRevealEntry[] }) {
  const groups = buildChampionGroups(entries);

  return (
    <Surface>
      <details>
        <summary className="grid cursor-pointer gap-3 px-4 py-4 marker:text-zinc-500 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="text-sm font-black text-zinc-950">
              Weltmeistertipps anzeigen
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-500">
              {entries.length} Tippreihen, gruppiert nach Team.
            </div>
          </div>
          <span className="rounded-lg bg-emerald-100 px-3 py-2 text-center text-xs font-black uppercase text-emerald-900">
            Öffnen
          </span>
        </summary>

        <div className="border-t border-zinc-100">
          {groups.map((group, index) => (
            <div
              className={cn(
                index < groups.length - 1 && "border-b border-zinc-100",
              )}
              key={group.championTeamCode ?? "no-tip"}
            >
              <div
                className={cn(
                  "grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-start",
                  hasCurrentUserEntry(group.entries) && "bg-emerald-50",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    {group.championTeamCode ? (
                      <TeamFlag code={group.championTeamCode} size="sm" />
                    ) : null}
                    <div className="text-base font-black text-zinc-950">
                      {group.label}
                    </div>
                    {typeof group.possibleWinEuros === "number" ? (
                      <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-black text-yellow-950">
                        {formatEuro(group.possibleWinEuros)}
                      </span>
                    ) : null}
                  </div>
                  <UserRowBadges entries={group.entries} />
                </div>
                <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center">
                  <div className="text-lg font-black text-zinc-950">
                    {group.entries.length}
                  </div>
                  <div className="text-[0.65rem] font-black uppercase text-zinc-500">
                    Tipps
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </Surface>
  );
}

function GoalsReveal({
  entries,
  progress,
}: {
  entries: SpecialPickRevealEntry[];
  progress: TournamentProgress;
}) {
  const groups = buildGoalsGroups(entries);
  const projection = buildGoalProjection({ groups, progress });
  const currentPosition = buildGoalMeterPosition({
    groups,
    value: progress.totalGoals,
  });
  const goalGroups = groups.filter((group) => group.totalGoals !== null);
  const noTipGroup = groups.find((group) => group.totalGoals === null);

  return (
    <Surface>
      <details>
        <summary className="grid cursor-pointer gap-3 px-4 py-4 marker:text-zinc-500 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="text-sm font-black text-zinc-950">
              Torwette anzeigen
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-500">
              {entries.length} Tippreihen, gruppiert nach Gesamttoren.
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span className="rounded-lg bg-yellow-100 px-3 py-2 text-center text-xs font-black uppercase text-yellow-950">
              Aktuell {formatGoalCount(progress.totalGoals)}
            </span>
            <span className="rounded-lg bg-zinc-100 px-3 py-2 text-center text-xs font-black uppercase text-zinc-700">
              Öffnen
            </span>
          </div>
        </summary>

        <div className="border-t border-zinc-100">
          <div className="px-4 py-5">
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <div className="text-[0.65rem] font-black uppercase text-emerald-900">
                    Aktueller Stand
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-3xl font-black tabular-nums text-emerald-900">
                      {formatGoalCount(progress.totalGoals)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-900/80">
                      nach {progress.completedMatches} Spielen
                    </span>
                    {currentPosition?.rangeNote ? (
                      <span className="text-xs font-black text-emerald-900">
                        {currentPosition.rangeNote}
                      </span>
                    ) : null}
                  </div>
                </div>

                {projection ? (
                  <div className="rounded-md bg-yellow-100 px-3 py-2 text-left sm:text-right">
                    <div className="text-[0.65rem] font-black uppercase text-yellow-800">
                      Hochrechnung
                    </div>
                    <div className="mt-1 text-sm font-black tabular-nums text-yellow-950">
                      {formatGoalCount(projection.value)}
                    </div>
                    <div className="mt-0.5 text-[0.65rem] font-bold text-yellow-900">
                      auf {progress.totalMatches} Spiele
                      {projection.rangeNote ? ` · ${projection.rangeNote}` : ""}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {goalGroups.length ? (
              <div className="relative grid gap-4 py-2 pl-24 sm:pl-0">
                <div
                  aria-hidden="true"
                  className="absolute bottom-12 left-10 top-12 w-3 -translate-x-1/2 overflow-hidden rounded-full bg-zinc-100 sm:left-1/2"
                >
                  {projection ? (
                    <div
                      className="absolute inset-x-0 top-0 rounded-full bg-yellow-200"
                      style={{ height: `${projection.percent}%` }}
                    />
                  ) : null}
                  {currentPosition ? (
                    <div
                      className="absolute inset-x-0 top-0 rounded-full bg-emerald-800"
                      style={{ height: `${currentPosition.percent}%` }}
                    />
                  ) : null}
                </div>

                {projection ? (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-12 left-10 top-12 z-20 w-0 sm:left-1/2"
                  >
                    <div
                      className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                      style={{ top: `${projection.percent}%` }}
                    >
                      <div className="h-full w-full rounded-full border-2 border-white bg-yellow-500 shadow-md" />
                      <div className="absolute left-1/2 top-full mt-1 w-16 -translate-x-1/2 rounded-md bg-zinc-950 px-2 py-1 text-center text-[0.65rem] font-black uppercase leading-tight text-white shadow-sm sm:w-auto sm:whitespace-nowrap">
                        <span className="block sm:inline">Hoch-</span>
                        <span className="block sm:inline">Rechnung</span>
                        <span className="block tabular-nums sm:inline">
                          {projection.value}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentPosition ? (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-12 left-10 top-12 z-30 w-0 sm:left-1/2"
                  >
                    <div
                      className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2"
                      style={{ top: `${currentPosition.percent}%` }}
                    >
                      <div className="h-full w-full rounded-full border-2 border-white bg-emerald-800 shadow-md" />
                      <div className="absolute left-1/2 top-full mt-1 w-20 -translate-x-1/2 rounded-md bg-emerald-900 px-2 py-1 text-center text-[0.65rem] font-black uppercase leading-tight text-white shadow-sm sm:w-auto sm:whitespace-nowrap">
                        Aktuell {currentPosition.value}
                      </div>
                    </div>
                  </div>
                ) : null}

                {goalGroups.map((group, index) => {
                  const leftSide = index % 2 === 0;
                  const isImpossible =
                    group.totalGoals !== null && group.totalGoals < progress.totalGoals;
                  const isCurrentGoalCount = group.totalGoals === progress.totalGoals;
                  const isOwnPrediction = hasCurrentUserEntry(group.entries);

                  return (
                    <div
                      className="relative z-10 grid min-h-24 grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)]"
                      key={group.totalGoals}
                    >
                      <div className={cn("min-w-0", !leftSide && "sm:col-start-3")}>
                        <div
                          className={cn(
                            "rounded-lg border p-3",
                            isImpossible
                              ? "border-zinc-200 bg-zinc-50 opacity-70"
                              : isOwnPrediction
                                ? "border-emerald-400 bg-emerald-50 shadow-sm"
                              : isCurrentGoalCount
                                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                                : "border-zinc-200 bg-white shadow-sm",
                            leftSide ? "sm:text-right" : "sm:text-left",
                          )}
                        >
                          <div
                            className={cn(
                              "flex flex-wrap items-center gap-2",
                              leftSide ? "sm:justify-end" : "sm:justify-start",
                            )}
                          >
                            <span
                              className={cn(
                                "text-base font-black",
                                isImpossible
                                  ? "text-zinc-400 line-through"
                                  : "text-zinc-950",
                              )}
                            >
                              {group.label}
                            </span>
                            {isImpossible ? (
                              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-500">
                                Nicht mehr möglich
                              </span>
                            ) : typeof group.possibleWinEuros === "number" ? (
                              <span
                                className={cn(
                                  "rounded-md px-2 py-1 text-xs font-black",
                                  isCurrentGoalCount
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-yellow-100 text-yellow-950",
                                )}
                              >
                                {formatEuro(group.possibleWinEuros)}
                              </span>
                            ) : null}
                            {isCurrentGoalCount ? (
                              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-900">
                                Aktueller Stand
                              </span>
                            ) : null}
                          </div>
                          <UserRowBadges
                            align={leftSide ? "responsive-right" : "left"}
                            entries={group.entries}
                            muted={isImpossible}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {noTipGroup ? (
              <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-sm font-black text-zinc-600">
                  {noTipGroup.label}
                </div>
                <UserRowBadges entries={noTipGroup.entries} />
              </div>
            ) : null}
          </div>
        </div>
      </details>
    </Surface>
  );
}

export function ProfileSpecialPickReveal({
  deadlineAt,
  entries,
  revealable,
  tournamentProgress,
}: {
  deadlineAt: string;
  entries: SpecialPickRevealEntry[];
  revealable: boolean;
  tournamentProgress: TournamentProgress;
}) {
  if (!revealable) {
    return (
      <Surface className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-zinc-600">
            Alle Weltmeistertipps werden bald hier sichtbar.
          </p>
          <div className="rounded-lg bg-yellow-100 px-3 py-2 text-yellow-950">
            <LockCountdown targetAt={deadlineAt} />
          </div>
        </div>
      </Surface>
    );
  }

  if (!entries.length) {
    return (
      <Surface className="p-4">
        <p className="text-sm font-semibold text-zinc-500">
          Noch keine Weltmeistertipps gefunden.
        </p>
      </Surface>
    );
  }

  return (
    <div className="grid gap-3">
      <ChampionReveal entries={entries} />
      <GoalsReveal entries={entries} progress={tournamentProgress} />
    </div>
  );
}
