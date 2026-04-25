import type { Match, PredictionEntry } from "@/lib/tournament-data";
import { teams } from "@/lib/tournament-data";
import { savePrediction } from "@/lib/predictions/actions";
import { formatViennaMatchTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { PointsChip, StatusChip, Surface, TeamFlag, TeamLine } from "./primitives";

function statusLabel(match: Match) {
  if (match.status === "live") return "Live";
  if (match.status === "done") return "FT";
  if (match.status === "open") return match.prediction ? "Saved" : "Open";
  if (match.status === "locked") return "Locked";
  return "Upcoming";
}

function statusKind(match: Match) {
  if (match.status === "live") return "live";
  if (match.status === "done") return "done";
  if (match.status === "open") return "open";
  if (match.status === "locked") return "locked";
  return "upcoming";
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
        <div>{match.stage}</div>
        {match.venue ? <div className="truncate">{match.venue}</div> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <TeamLine code={match.home} />
        <TeamLine code={match.away} />
      </div>

      <div className="flex min-w-16 flex-col items-end gap-2">
        {match.score ? (
          <div
            className={cn(
              "text-xl font-black text-zinc-950",
              match.status === "live" && "text-red-700",
            )}
          >
            {match.score.home}
            <span className="px-1 text-zinc-400">:</span>
            {match.score.away}
          </div>
        ) : (
          <StatusChip kind={statusKind(match)}>{statusLabel(match)}</StatusChip>
        )}

        {match.status === "live" && match.minute ? (
          <StatusChip kind="live">{match.minute}</StatusChip>
        ) : null}

        {showPrediction && match.prediction ? (
          <div className="text-xs font-semibold text-zinc-500">
            You{" "}
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
  emptyMessage = "No matches yet.",
  matches,
  showPrediction,
  showResult,
}: {
  emptyMessage?: string;
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
      {matches.map((match, index) => (
        <div
          className={cn(index < matches.length - 1 && "border-b border-zinc-100")}
          key={match.id}
        >
          <MatchRow
            match={match}
            showPrediction={showPrediction}
            showResult={showResult}
          />
        </div>
      ))}
    </Surface>
  );
}

function ScoreInputs({
  disabled,
  match,
}: {
  disabled?: boolean;
  match: Match;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        className="h-11 w-11 rounded-lg border border-zinc-300 bg-white text-center text-2xl font-black text-zinc-950 outline-none focus:border-emerald-800 disabled:border-dashed disabled:bg-zinc-50 disabled:text-zinc-400"
        defaultValue={match.prediction?.home ?? ""}
        disabled={disabled}
        inputMode="numeric"
        max={99}
        min={0}
        name="homeScore"
        placeholder="-"
        required
        type="number"
      />
      <span className="text-lg font-black text-zinc-400">:</span>
      <input
        className="h-11 w-11 rounded-lg border border-zinc-300 bg-white text-center text-2xl font-black text-zinc-950 outline-none focus:border-emerald-800 disabled:border-dashed disabled:bg-zinc-50 disabled:text-zinc-400"
        defaultValue={match.prediction?.away ?? ""}
        disabled={disabled}
        inputMode="numeric"
        max={99}
        min={0}
        name="awayScore"
        placeholder="-"
        required
        type="number"
      />
    </div>
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

function EntryPredictionRow({
  canEdit,
  entry,
  leagueId,
  match,
}: {
  canEdit: boolean;
  entry: PredictionEntry;
  leagueId?: string | null;
  match: Match;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
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

      {canEdit ? (
        <form action={savePrediction} className="flex flex-col items-center gap-3">
          <input name="leagueId" type="hidden" value={leagueId ?? ""} />
          <input name="matchId" type="hidden" value={match.id} />
          <input name="entryId" type="hidden" value={entry.id} />
          <ScoreInputs match={match} />
          <button
            className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-black text-white hover:bg-emerald-900"
            type="submit"
          >
            Save pick
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <ScoreInputs disabled match={match} />
          <div className="text-[0.7rem] font-semibold text-zinc-500">
            Preview only until Supabase is connected.
          </div>
        </div>
      )}
    </div>
  );
}

export function PredictionCard({
  editable,
  leagueId,
  match,
  predictionEntries,
}: {
  editable?: boolean;
  leagueId?: string | null;
  match: Match;
  predictionEntries?: PredictionEntry[];
}) {
  const canEdit = editable && leagueId && match.status === "open" && !match.score;
  const matchTime = getMatchTime(match);
  const showEntryRows = match.status === "open" && !match.score;
  const entries = predictionEntries?.length
    ? predictionEntries
    : [
        {
          id: "primary",
          label: "Tippreihe 1",
          ownerName: "You",
          isAdditional: false,
        },
      ];

  return (
    <Surface className="p-4">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div className="text-sm font-semibold text-zinc-500">
          {match.stage} · {matchTime.compact}
          {match.venue ? (
            <div className="mt-1 text-xs font-medium text-zinc-400">
              {match.venue}
            </div>
          ) : null}
        </div>
        <StatusChip kind={statusKind(match)}>{statusLabel(match)}</StatusChip>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-5">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamFlag code={match.home} size="lg" />
          <div className="text-sm font-bold text-zinc-950">{teams[match.home].code}</div>
          <div className="hidden text-xs text-zinc-500 sm:block">
            {teams[match.home].name}
          </div>
        </div>

        <div className="flex min-w-[7.5rem] flex-col items-center gap-3">
          {match.score ? (
            <>
              <div className="text-3xl font-black text-zinc-950">
                {match.score.home}:{match.score.away}
              </div>
              {match.prediction ? (
                <div className="text-xs font-semibold text-zinc-500">
                  You {match.prediction.home}:{match.prediction.away}
                </div>
              ) : null}
            </>
          ) : (
            <ScorePlaceholder />
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamFlag code={match.away} size="lg" />
          <div className="text-sm font-bold text-zinc-950">{teams[match.away].code}</div>
          <div className="hidden text-xs text-zinc-500 sm:block">
            {teams[match.away].name}
          </div>
        </div>
      </div>

      {showEntryRows ? (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
          {entries.map((entry) => (
            <EntryPredictionRow
              canEdit={Boolean(canEdit)}
              entry={entry}
              key={entry.id}
              leagueId={leagueId}
              match={match}
            />
          ))}
          <div className="text-center text-xs font-bold text-amber-700">
            {match.deadline ?? match.kickoff}
          </div>
        </div>
      ) : null}
    </Surface>
  );
}
