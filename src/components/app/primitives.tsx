import Image from "next/image";
import type { TeamCode } from "@/lib/tournament-data";
import { teams } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

export function TeamFlag({
  code,
  size = "md",
}: {
  code: TeamCode;
  size?: "sm" | "md" | "lg";
}) {
  const team = teams[code];
  const dimensions = {
    sm: { className: "h-5 w-7", height: 20, width: 28 },
    md: { className: "h-6 w-9", height: 24, width: 36 },
    lg: { className: "h-8 w-12", height: 32, width: 48 },
  }[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-sm border border-black/10 bg-zinc-100 shadow-sm",
        dimensions.className,
      )}
    >
      <Image
        alt={`${team.name} flag`}
        className="h-full w-full object-cover"
        height={dimensions.height}
        src={`https://flagcdn.com/w80/${team.flagCode}.png`}
        width={dimensions.width}
      />
    </span>
  );
}

export const TeamDisc = TeamFlag;

export function TeamLine({ code }: { code: TeamCode }) {
  const team = teams[code];

  return (
    <div className="flex min-w-0 items-center gap-3">
      <TeamFlag code={code} size="sm" />
      <span className="truncate text-sm font-semibold text-zinc-950">
        {team.name}
      </span>
    </div>
  );
}

export function Avatar({ name, compact }: { name: string; compact?: boolean }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-emerald-800 font-bold text-white",
        compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
      )}
    >
      {initials}
    </span>
  );
}

export function StatusChip({
  kind,
  children,
}: {
  kind: "live" | "open" | "done" | "locked" | "upcoming" | "hit" | "miss";
  children: React.ReactNode;
}) {
  const classes = {
    live: "bg-red-50 text-red-700 ring-red-200",
    open: "bg-yellow-100 text-yellow-900 ring-yellow-300",
    done: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    locked: "bg-zinc-200 text-zinc-700 ring-zinc-300",
    upcoming: "bg-white text-zinc-700 ring-zinc-200",
    hit: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    miss: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  }[kind];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase ring-1",
        classes,
      )}
    >
      {children}
    </span>
  );
}

export function PointsChip({ value }: { value: number }) {
  const positive = value > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-bold",
        positive
          ? "bg-yellow-100 text-yellow-900"
          : "bg-zinc-100 text-zinc-500",
      )}
    >
      {positive ? "+" : ""}
      {value} pts
    </span>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-sm font-bold uppercase text-zinc-500">{title}</h2>
      {action}
    </div>
  );
}

export function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
