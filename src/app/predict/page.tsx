import { DataModeBanner } from "@/components/app/data-mode-banner";
import { PredictMatchListClient } from "@/components/app/predict-match-list-client";
import { getAppData } from "@/lib/app-data";
import { formatViennaMatchTime } from "@/lib/time";

export default async function PredictPage() {
  const data = await getAppData();
  const now = new Date();
  const openMatches = data.predictionMatches.filter((match) => {
    if (match.status !== "open" || !match.kickoffAt) return false;

    return new Date(match.kickoffAt) > now;
  });
  const nextLockMatch = openMatches[0];
  const nextLockTime = nextLockMatch?.kickoffAt
    ? formatViennaMatchTime(nextLockMatch.kickoffAt).compact
    : nextLockMatch?.time ?? "Kein offenes Spiel";
  const canEdit = data.connected && Boolean(data.leagueId && data.userEmail);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-800">
            Gruppenphase
          </p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">
            Tipps abgeben
          </h1>
        </div>
        <div className="rounded-lg bg-zinc-950 px-4 py-3 text-white">
          <div className="text-xs font-bold uppercase text-zinc-400">
            Nächstes Spiel
          </div>
          <div className="text-xl font-black">{nextLockTime}</div>
          {nextLockMatch ? (
            <div className="text-xs font-semibold text-zinc-300">
              {nextLockMatch.home} gegen {nextLockMatch.away}
            </div>
          ) : null}
        </div>
      </div>

      <PredictMatchListClient
        canEdit={canEdit}
        leagueId={data.leagueId}
        matches={openMatches}
        predictionEntries={data.predictionEntries}
      />
    </div>
  );
}
