import Link from "next/link";
import type { LeaderboardRow } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import { Avatar, Surface } from "./primitives";

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function profileHref(row: LeaderboardRow) {
  if (!row.username) return null;

  return row.isCurrentUser
    ? "/profile"
    : `/players/${encodeURIComponent(row.username)}`;
}

function PlayerNameLink({
  className,
  row,
}: {
  className?: string;
  row: LeaderboardRow;
}) {
  const href = profileHref(row);

  if (!href) {
    return <span className={className}>{row.name}</span>;
  }

  return (
    <Link
      className={cn("transition hover:underline", className)}
      href={href}
    >
      {row.name}
    </Link>
  );
}

export function LeaderboardMiniRow({
  row,
  isLast,
}: {
  row: LeaderboardRow;
  isLast?: boolean;
}) {
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
        <div className="flex min-w-0 items-baseline gap-1">
          <PlayerNameLink
            className={cn(
              "min-w-0 truncate text-sm text-zinc-950",
              row.isCurrentUser ? "font-black" : "font-semibold",
            )}
            row={row}
          />
          <span
            aria-label={`${row.exact} richtige Tipps`}
            className={cn(
              "shrink-0 text-sm text-zinc-500",
              row.isCurrentUser ? "font-bold" : "font-medium",
            )}
          >
            ({row.exact})
          </span>
        </div>
        <div className="text-xs font-medium text-zinc-500">
          {row.entryLabel ?? "Tippreihe 1"}
        </div>
      </div>
      <div className="text-xl font-black text-zinc-950">
        {formatEuro(row.points)}
      </div>
    </div>
  );
}

export function LeaderboardList({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <Surface>
      {rows.map((row, index) => (
        <LeaderboardMiniRow
          isLast={index === rows.length - 1}
          key={`${row.name}-${row.entryLabel ?? row.rank}`}
          row={row}
        />
      ))}
    </Surface>
  );
}

function CrownBadge() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-200 text-yellow-950 ring-4 ring-yellow-100">
      <svg
        aria-label="Platz 1"
        className="h-9 w-9"
        fill="none"
        role="img"
        viewBox="0 0 24 24"
      >
        <path
          d="M3 8.5 7.5 13 12 5l4.5 8L21 8.5V19H3V8.5Z"
          fill="currentColor"
        />
        <path d="M3 19h18" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <CrownBadge />;
  }

  return (
    <div
      className={cn(
        "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black ring-4",
        rank === 2
          ? "bg-zinc-200 text-zinc-800 ring-zinc-100"
          : "bg-amber-700 text-amber-50 ring-amber-200",
      )}
    >
      {rank}
    </div>
  );
}

export function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const topThree = rows.slice(0, 3);
  const ordered = [topThree[1], topThree[0], topThree[2]].filter(Boolean);

  return (
    <div className="rounded-lg bg-emerald-900 p-4 text-white shadow-sm">
      <div className="mb-4 text-center text-xs font-bold uppercase text-emerald-100">
        Spitze der Rangliste
      </div>
      <div className="grid grid-cols-3 items-end gap-3">
        {ordered.map((row) => (
          <div className="text-center" key={`${row.name}-${row.entryLabel ?? row.rank}`}>
            <div className="mx-auto mb-2 flex justify-center">
              <RankBadge rank={row.rank} />
            </div>
            <PlayerNameLink
              className="block truncate text-sm font-bold text-white"
              row={row}
            />
            <div className="text-2xl font-black text-yellow-200">
              {formatEuro(row.points)}
            </div>
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
