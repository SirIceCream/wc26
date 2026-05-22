import Link from "next/link";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import { LeaderboardMiniRow } from "@/components/app/leaderboard";
import { LockCountdown } from "@/components/app/lock-countdown";
import { MatchList } from "@/components/app/match-card";
import { SectionTitle, Surface } from "@/components/app/primitives";
import { SpecialPickCard } from "@/components/app/special-pick-card";
import { TournamentProgressCard } from "@/components/app/tournament-progress";
import { getAppData } from "@/lib/app-data";
import { formatViennaMatchTime } from "@/lib/time";

export default async function Home() {
  const data = await getAppData();
  const openPicks = data.predictionMatches;
  const nextLockMatch = openPicks[0] ?? data.upcomingMatches[0];
  const nextLockTime = nextLockMatch?.kickoffAt
    ? formatViennaMatchTime(nextLockMatch.kickoffAt).compact
    : nextLockMatch?.time;
  const userDisplayName = data.userDisplayName ?? "Player";
  const firstName = userDisplayName.split(" ")[0] ?? userDisplayName;
  const openPickLabel = openPicks.length
    ? `${openPicks.length} Spiele sind aktuell tippbar.`
    : "Aktuell sind keine Tipps offen.";
  const missedPickLabel =
    data.missedPredictionCount === 1
      ? "1 verpasster Tipp"
      : `${data.missedPredictionCount} verpasste Tipps`;
  const primarySpecialPrediction = data.specialPredictions[1];
  const specialPicksOpen = new Date(data.specialPickDeadlineAt) > new Date();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[1fr_22rem] lg:py-8">
      <div className="flex flex-col gap-6">
        <DataModeBanner connected={data.connected} />

        <section className="overflow-hidden rounded-lg bg-emerald-900 text-white shadow-sm">
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_22rem] lg:items-start sm:p-6">
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">
                Servus {firstName}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50">
                Gib deine Tipps ab, bevor die jeweiligen Spiele angepfiffen
                werden.
              </p>
            </div>
            {nextLockMatch ? (
              <div className="w-full rounded-lg bg-yellow-200 px-5 py-4 text-yellow-950 lg:px-6">
                <div className="text-xs font-bold uppercase">
                  Nächstes Spiel
                </div>
                <div className="mt-1 text-xl font-black">{nextLockTime}</div>
                <div className="text-sm font-semibold">
                  {nextLockMatch.home} gegen {nextLockMatch.away}
                </div>
                <div className="mt-3 rounded-md bg-yellow-100 px-3 py-2">
                  <LockCountdown targetAt={nextLockMatch.kickoffAt} />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <TournamentProgressCard progress={data.tournamentProgress} />

        {specialPicksOpen ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <SpecialPickCard
              deadlineAt={data.specialPickDeadlineAt}
              kind="champion"
              prediction={primarySpecialPrediction}
            />
            <SpecialPickCard
              deadlineAt={data.specialPickDeadlineAt}
              kind="goals"
              prediction={primarySpecialPrediction}
            />
          </div>
        ) : null}

        <Link
          className="grid gap-4 rounded-lg bg-zinc-950 p-4 text-white shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center"
          href="/predict"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-200 text-2xl font-black text-yellow-950">
            {openPicks.length}
          </div>
          <div>
            <div className="font-black">Offene Tipps</div>
            <div className="mt-1 text-sm text-zinc-300">
              {openPickLabel}
            </div>
          </div>
          <span className="rounded-lg bg-yellow-200 px-4 py-2 text-center text-sm font-black text-yellow-950">
            Tippen
          </span>
        </Link>

        {data.missedPredictionCount > 0 ? (
          <Link
            className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-950 shadow-sm"
            href="/profile"
          >
            <span className="font-black">{missedPickLabel}</span>{" "}
            wurden bereits gesperrt und zählen als Kein Tipp.
          </Link>
        ) : null}

        <section className="space-y-3">
          <SectionTitle
            action={
              <Link className="text-sm font-bold text-emerald-800" href="/fixtures">
                Alle anzeigen
              </Link>
            }
            title="Nächste Spiele"
          />
          <MatchList
            linkToDetails={data.connected}
            matches={data.todayMatches}
            showPrediction
          />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Letzte Ergebnisse" />
          <MatchList
            emptyMessage="Noch keine Ergebnisse. Das Turnier hat noch nicht begonnen."
            linkToDetails={data.connected}
            matches={data.recentResults.slice(0, 2)}
            showPrediction
            showResult
          />
        </section>
      </div>

      <aside className="space-y-3">
        <SectionTitle
          action={
            <Link className="text-sm font-bold text-emerald-800" href="/leaderboard">
              Ganze Rangliste
            </Link>
          }
          title="Freundes-Rangliste"
        />
        <Surface>
          {data.leaderboard.slice(0, 5).map((row, index) => (
            <LeaderboardMiniRow
              isLast={index === 4}
              key={`${row.name}-${row.entryLabel ?? row.rank}`}
              row={row}
            />
          ))}
        </Surface>
      </aside>
    </div>
  );
}
