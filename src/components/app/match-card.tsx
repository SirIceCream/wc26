import Link from "next/link";
import type { Match, PredictionEntry } from "@/lib/tournament-data";
import { getStageLabel, getTeamLabel, getTeamShortLabel } from "@/lib/tournament-data";
import { formatViennaMatchTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { LockCountdown } from "./lock-countdown";
import { PredictionFormClient } from "./prediction-form-client";
import { PointsChip, StatusChip, Surface, TeamFlag, TeamLine } from "./primitives";

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function getMatchTime(match: Match) {
  if (match.kickoffAt) {
    return formatViennaMatchTime(match.kickoffAt);
  }

  return {
    compact: match.time,
    date: "",
    time: match.time,
  };
}

function hasSubmittedPrediction(match: Match) {
  return Boolean(
    match.prediction || Object.keys(match.predictionsByRow ?? {}).length > 0,
  );
}

export function MatchRow({
  match,
  showPrediction,
  showResult,
}: {
  match: Match;
  showPrediction?: boolean;
  showResult?: boolean;
}) {
  const matchTime = getMatchTime(match);

  return (
    <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 px-4 py-4">
      <div className="text-xs font-semibold text-zinc-500">
        {matchTime.date ? <div>{matchTime.date}</div> : null}
        <div className="text-sm font-bold text-zinc-950">{matchTime.time}</div>
        <div>{getStageLabel(match.stage)}</div>
        {match.venue ? <div className="truncate">{match.venue}</div> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <TeamLine code={match.home} />
        <TeamLine code={match.away} />
      </div>

      <div className="flex min-w-16 flex-col items-end gap-2">
        {match.pot ? (
          <div className="rounded-lg bg-yellow-100 px-3 py-2 text-center text-yellow-950">
            <div className="text-[0.65rem] font-black uppercase">
              {match.pot.isJackpot ? "Jackpot" : "Pot"}
            </div>
            <div className="text-base font-black">
              {formatEuro(match.pot.totalEuros)}
            </div>
          </div>
        ) : null}

        {match.score ? (
          <div
            className={cn(
              "text-xl font-black text-zinc-950",
              match.status === "live" && "text-red-700",
            )}
          >
            {match.score.home}
            <span
              className={cn(
                "px-1 text-zinc-400",
                match.status === "live" && "text-red-700",
              )}
            >
              :
            </span>
            {match.score.away}
            {match.status === "live" && match.minute ? (
              <span className="ml-1 text-sm">({match.minute})</span>
            ) : null}
          </div>
        ) : null}

        {showPrediction && !match.score && hasSubmittedPrediction(match) ? (
          <StatusChip kind="hit">Tipp abgegeben</StatusChip>
        ) : null}

        {showPrediction && match.prediction ? (
          <div className="text-xs font-semibold text-zinc-500">
            Du{" "}
            <span className="text-zinc-950">
              {match.prediction.home}:{match.prediction.away}
            </span>
          </div>
        ) : null}

        {showResult && typeof match.points === "number" ? (
          <PointsChip value={match.points} />
        ) : null}
      </div>
    </div>
  );
}

export function MatchList({
  emptyMessage = "Noch keine Spiele.",
  linkToDetails,
  matches,
  showPrediction,
  showResult,
}: {
  emptyMessage?: string;
  linkToDetails?: boolean;
  matches: Match[];
  showPrediction?: boolean;
  showResult?: boolean;
}) {
  if (matches.length === 0) {
    return (
      <Surface className="p-4">
        <p className="text-sm font-semibold text-zinc-500">{emptyMessage}</p>
      </Surface>
    );
  }

  return (
    <Surface>
      {matches.map((match, index) => {
        const row = (
          <MatchRow
            match={match}
            showPrediction={showPrediction}
            showResult={showResult}
          />
        );

        return (
          <div
            className={cn(index < matches.length - 1 && "border-b border-zinc-100")}
            key={match.id}
          >
            {linkToDetails ? (
              <Link
                className="block transition hover:bg-zinc-50"
                href={`/match/${match.id}`}
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </div>
        );
      })}
    </Surface>
  );
}

function ScorePlaceholder() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-2xl font-black text-zinc-400">
        -
      </div>
      <span className="text-lg font-black text-zinc-400">:</span>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-2xl font-black text-zinc-400">
        -
      </div>
    </div>
  );
}

function getEntryPrediction(match: Match, entry: PredictionEntry) {
  return (
    match.predictionsByRow?.[entry.predictionRow] ??
    (entry.predictionRow === 1 ? match.prediction : null)
  );
}

function EntryPredictionRow({
  canEdit,
  entry,
  leagueId,
  match,
  onPredictionSaved,
}: {
  canEdit: boolean;
  entry: PredictionEntry;
  leagueId?: string | null;
  match: Match;
  onPredictionSaved?: (predictionRow: number) => void;
}) {
  const prediction = getEntryPrediction(match, entry);

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        prediction
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-zinc-200 bg-zinc-50",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase text-zinc-950">
            {entry.label}
          </div>
          <div className="text-xs font-semibold text-zinc-500">
            {entry.ownerName}
          </div>
        </div>
        {entry.isAdditional ? (
          <span className="rounded-md bg-emerald-100 px-2 py-1 text-[0.65rem] font-black uppercase text-emerald-900">
            Extra
          </span>
        ) : null}
      </div>

      <PredictionFormClient
        canEdit={canEdit}
        entry={entry}
        key={`${match.id}-${entry.predictionRow}-${prediction?.home ?? "new"}-${prediction?.away ?? "new"}`}
        leagueId={leagueId}
        matchId={match.id}
        onSaved={() => onPredictionSaved?.(entry.predictionRow)}
        prediction={prediction}
      />
    </div>
  );
}

export function PredictionCard({
  editable,
  leagueId,
  match,
  onPredictionSaved,
  predictionEntries,
}: {
  editable?: boolean;
  leagueId?: string | null;
  match: Match;
  onPredictionSaved?: (matchId: string, predictionRow: number) => void;
  predictionEntries?: PredictionEntry[];
}) {
  const canEdit = Boolean(
    editable && leagueId && match.status === "open" && !match.score,
  );
  const matchTime = getMatchTime(match);
  const showEntryRows = match.status === "open" && !match.score;
  const entries = predictionEntries?.length
    ? predictionEntries
    : [
        {
          id: "primary",
          label: "Tippreihe 1",
          ownerName: "Du",
          predictionRow: 1,
          isAdditional: false,
        },
      ];
  const primaryEntry =
    entries.find((entry) => entry.predictionRow === 1) ?? entries[0];
  const primaryPrediction = primaryEntry
    ? getEntryPrediction(match, primaryEntry)
    : null;
  const additionalEntries = primaryEntry
    ? entries.filter((entry) => entry.id !== primaryEntry.id)
    : [];

  return (
    <Surface className="p-4">
      <div className="border-b border-zinc-100 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-sm font-semibold text-zinc-500">
            {getStageLabel(match.stage)} · {matchTime.compact}
            {match.venue ? (
              <div className="mt-1 text-xs font-medium text-zinc-400">
                {match.venue}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-5">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamFlag code={match.home} size="lg" />
          <div className="text-sm font-bold text-zinc-950">
            {getTeamShortLabel(match.home)}
          </div>
          <div className="max-w-[6.5rem] break-words text-[0.68rem] font-semibold leading-tight text-zinc-500 sm:max-w-[9rem] sm:text-xs">
            {getTeamLabel(match.home)}
          </div>
        </div>

        <div className="flex min-w-[7.5rem] flex-col items-center gap-3">
          {match.score ? (
            <>
              <div
                className={cn(
                  "text-3xl font-black text-zinc-950",
                  match.status === "live" && "text-red-700",
                )}
              >
                {match.score.home}:{match.score.away}
                {match.status === "live" && match.minute ? (
                  <span className="ml-2 text-base">({match.minute})</span>
                ) : null}
              </div>
              {match.prediction ? (
                <div className="text-xs font-semibold text-zinc-500">
                  Du {match.prediction.home}:{match.prediction.away}
                </div>
              ) : null}
            </>
          ) : showEntryRows && primaryEntry ? (
            <PredictionFormClient
              canEdit={canEdit}
              entry={primaryEntry}
              key={`${match.id}-${primaryEntry.predictionRow}-${primaryPrediction?.home ?? "new"}-${primaryPrediction?.away ?? "new"}`}
              leagueId={leagueId}
              matchId={match.id}
              onSaved={() =>
                onPredictionSaved?.(match.id, primaryEntry.predictionRow)
              }
              prediction={primaryPrediction}
            />
          ) : (
            <ScorePlaceholder />
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamFlag code={match.away} size="lg" />
          <div className="text-sm font-bold text-zinc-950">
            {getTeamShortLabel(match.away)}
          </div>
          <div className="max-w-[6.5rem] break-words text-[0.68rem] font-semibold leading-tight text-zinc-500 sm:max-w-[9rem] sm:text-xs">
            {getTeamLabel(match.away)}
          </div>
        </div>
      </div>

      {showEntryRows ? (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          {additionalEntries.map((entry) => (
            <EntryPredictionRow
              canEdit={canEdit}
              entry={entry}
              key={entry.id}
              leagueId={leagueId}
              match={match}
              onPredictionSaved={(predictionRow) =>
                onPredictionSaved?.(match.id, predictionRow)
              }
            />
          ))}
          <LockCountdown fallback={match.deadline ?? match.kickoff} targetAt={match.kickoffAt} />
        </div>
      ) : null}
    </Surface>
  );
}
