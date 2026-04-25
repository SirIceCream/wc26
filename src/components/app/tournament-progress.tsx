import type { TournamentProgress } from "@/lib/app-data";
import { cn } from "@/lib/utils";
import { Surface } from "./primitives";

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function TournamentProgressCard({
  progress,
}: {
  progress: TournamentProgress;
}) {
  const percent = Math.round(
    (progress.completedMatches / progress.totalMatches) * 100,
  );

  return (
    <Surface className="p-4">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase text-zinc-500">
            Tournament
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-600">
            Jun 11 - Jul 19
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-emerald-800">{percent}%</div>
          <div className="text-xs font-bold uppercase text-zinc-500">done</div>
        </div>
      </div>

      <div className="mb-4 flex gap-1">
        {progress.stages.map((stage) => {
          const fill = stage.total > 0 ? stage.completed / stage.total : 0;
          const active = fill > 0 && fill < 1;
          const done = fill >= 1;

          return (
            <div
              className="min-w-0"
              key={stage.label}
              style={{ flex: stage.total }}
            >
              <div
                className={cn(
                  "relative h-2 overflow-hidden rounded-sm bg-zinc-100",
                  active && "ring-1 ring-emerald-800",
                  done && "bg-emerald-800",
                )}
              >
                {!done ? (
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-800"
                    style={{ width: `${fill * 100}%` }}
                  />
                ) : null}
              </div>
              <div
                className={cn(
                  "mt-1 truncate text-center text-[0.62rem] font-black uppercase",
                  fill > 0 ? "text-emerald-800" : "text-zinc-400",
                )}
              >
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 border-t border-zinc-100 pt-3">
        <div>
          <div className="text-[0.65rem] font-bold uppercase text-zinc-500">
            Played
          </div>
          <div className="mt-1 flex items-center gap-1 text-lg font-black text-zinc-950">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <CheckIcon />
            </span>
            {progress.completedMatches}
            <span className="text-sm text-zinc-500">
              /{progress.totalMatches}
            </span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[0.65rem] font-bold uppercase text-zinc-500">
            Open
          </div>
          <div className="mt-1 text-lg font-black text-zinc-950">
            {progress.todayMatches}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[0.65rem] font-bold uppercase text-zinc-500">
            Next KO
          </div>
          <div className="mt-1 text-lg font-black text-zinc-950">
            {progress.nextKnockoutDate}
          </div>
        </div>
      </div>
    </Surface>
  );
}
