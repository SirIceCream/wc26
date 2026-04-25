import type { LeaderboardRow } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { Avatar, Surface } from "./primitives";

export function LeaderboardMiniRow({
  row,
  isLast,
}: {
  row: LeaderboardRow;
  isLast?: boolean;
}) {
  const exactRate = row.total > 0 ? Math.round((row.exact / row.total) * 100) : 0;
  const avatarName = row.ownerName ?? row.name;

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-3 px-4 py-3",
        row.isCurrentUser && "bg-emerald-50",
        !isLast && "border-b border-zinc-100",
      )}
    >
      <div
        className={cn(
          "text-center text-sm font-black",
          row.rank <= 3 ? "text-emerald-800" : "text-zinc-500",
        )}
      >
        {row.rank}
      </div>
      <Avatar name={avatarName} compact />
      <div className="min-w-0">
        <div
          className={cn(
            "truncate text-sm text-zinc-950",
            row.isCurrentUser ? "font-black" : "font-semibold",
          )}
        >
          {row.name}
        </div>
        <div className="text-xs font-medium text-zinc-500">
          {row.entryLabel ? `${row.entryLabel} · ` : ""}
          {row.exact} exact · {exactRate}%
        </div>
      </div>
      <div className="text-xl font-black text-zinc-950">{row.points}</div>
    </div>
  );
}

export function LeaderboardList({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <Surface>
      {rows.map((row, index) => (
        <LeaderboardMiniRow
          isLast={index === rows.length - 1}
          key={row.name}
          row={row}
        />
      ))}
    </Surface>
  );
}

export function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const topThree = rows.slice(0, 3);
  const ordered = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <div className="rounded-lg bg-emerald-900 p-4 text-white shadow-sm">
      <div className="mb-4 text-center text-xs font-bold uppercase text-emerald-100">
        Top of the table
      </div>
      <div className="grid grid-cols-3 items-end gap-3">
        {ordered.map((row) => (
          <div className="text-center" key={row.name}>
            <div className="mx-auto mb-2 flex justify-center">
              <Avatar compact={row.rank !== 1} name={row.ownerName ?? row.name} />
            </div>
            <div className="truncate text-sm font-bold">{row.name}</div>
            <div className="text-2xl font-black text-yellow-200">{row.points}</div>
            <div
              className={cn(
                "mt-3 flex items-start justify-center rounded-t-lg pt-2 text-xl font-black",
                row.rank === 1
                  ? "h-24 bg-yellow-200 text-yellow-950"
                  : row.rank === 2
                    ? "h-20 bg-white/20 text-white"
                    : "h-16 bg-white/20 text-white",
              )}
            >
              {row.rank}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
