import type { SpecialPickRevealEntry } from "@/lib/app-data";
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

function floorToCents(value: number) {
  return Math.floor(value * 100) / 100;
}

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
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

function UserRowBadges({
  entries,
}: {
  entries: SpecialPickRevealEntry[];
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
    <div className="mt-3 flex flex-wrap gap-2">
      {[...users.values()].map((user) => {
        const rows = user.entries
          .map((entry) => entry.predictionRow)
          .sort((a, b) => a - b)
          .map((row) => `R${row}`)
          .join("+");

        return (
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-bold",
              user.isCurrentUser
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
              className={cn(index < groups.length - 1 && "border-b border-zinc-100")}
              key={group.championTeamCode ?? "no-tip"}
            >
              <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
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

function GoalsReveal({ entries }: { entries: SpecialPickRevealEntry[] }) {
  const groups = buildGoalsGroups(entries);

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
          <span className="rounded-lg bg-yellow-100 px-3 py-2 text-center text-xs font-black uppercase text-yellow-950">
            Öffnen
          </span>
        </summary>

        <div className="border-t border-zinc-100">
          {groups.map((group, index) => (
            <div
              className={cn(index < groups.length - 1 && "border-b border-zinc-100")}
              key={group.totalGoals ?? "no-tip"}
            >
              <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
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

export function ProfileSpecialPickReveal({
  deadlineAt,
  entries,
  revealable,
}: {
  deadlineAt: string;
  entries: SpecialPickRevealEntry[];
  revealable: boolean;
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
      <GoalsReveal entries={entries} />
    </div>
  );
}
