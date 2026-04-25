import { DataModeBanner } from "@/components/app/data-mode-banner";
import { PredictionCard } from "@/components/app/match-card";
import { SectionTitle, Surface } from "@/components/app/primitives";
import { getAppData } from "@/lib/app-data";
import { formatViennaMatchTime } from "@/lib/time";

export default async function PredictPage() {
  const data = await getAppData();
  const openMatches = data.todayMatches.filter((match) => match.status === "open");
  const nextLockMatch = openMatches[0] ?? data.upcomingMatches[0];
  const nextLockTime = nextLockMatch?.kickoffAt
    ? formatViennaMatchTime(nextLockMatch.kickoffAt).compact
    : nextLockMatch?.time ?? "No open lock";
  const lockedAndRecent = [
    ...data.todayMatches.filter((match) => match.status !== "open"),
    ...data.recentResults,
  ].slice(0, 2);
  const canEdit = data.connected && Boolean(data.leagueId && data.userEmail);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-800">
            Opening slate
          </p>
            <h1 className="mt-2 text-3xl font-black text-zinc-950">
              First picks
            </h1>
            {data.hasAdditionalTippreihe ? (
              <div className="mt-3 inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-black uppercase text-emerald-900">
                2 Tippreihen active
              </div>
            ) : null}
          </div>
        <div className="rounded-lg bg-zinc-950 px-4 py-3 text-white">
          <div className="text-xs font-bold uppercase text-zinc-400">Next lock</div>
          <div className="text-xl font-black">{nextLockTime}</div>
          {nextLockMatch ? (
            <div className="text-xs font-semibold text-zinc-300">
              {nextLockMatch.home} vs {nextLockMatch.away}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-3">
          <SectionTitle title="Open predictions" />
          {openMatches.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {openMatches.map((match) => (
                <PredictionCard
                  editable={canEdit}
                  key={match.id}
                  leagueId={data.leagueId}
                  match={match}
                  predictionEntries={data.predictionEntries}
                />
              ))}
            </div>
          ) : (
            <Surface className="p-4">
              <p className="text-sm font-semibold text-zinc-500">
                No predictions are open right now.
              </p>
            </Surface>
          )}
        </section>

        <aside className="space-y-3">
          <SectionTitle title="Locked and recent" />
          {lockedAndRecent.length ? (
            <div className="space-y-4">
              {lockedAndRecent.map((match) => (
                <PredictionCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Surface className="p-4">
              <p className="text-sm font-semibold text-zinc-500">
                Nothing locked yet.
              </p>
            </Surface>
          )}
        </aside>
      </div>

      <section className="mt-8 space-y-3">
        <SectionTitle title="Next fixtures" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.upcomingMatches.map((match) => (
            <PredictionCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
