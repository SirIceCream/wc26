import Link from "next/link";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import { LeaderboardMiniRow } from "@/components/app/leaderboard";
import { MatchList } from "@/components/app/match-card";
import { Avatar, SectionTitle, Surface } from "@/components/app/primitives";
import { SpecialPickCard } from "@/components/app/special-pick-card";
import { TournamentProgressCard } from "@/components/app/tournament-progress";
import { getAppData } from "@/lib/app-data";
import { formatViennaMatchTime } from "@/lib/time";

export default async function Home() {
  const data = await getAppData();
  const currentUserEntries = data.leaderboard.filter((row) => row.isCurrentUser);
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
  const primarySpecialPrediction = data.specialPredictions[1];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[1fr_22rem] lg:py-8">
      <div className="flex flex-col gap-6">
        <DataModeBanner connected={data.connected} />

        <section className="overflow-hidden rounded-lg bg-emerald-900 text-white shadow-sm">
          <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-100">
                The Usual Suspects · WC26
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Servus {firstName}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50">
                Alle bekannten Gruppenpaarungen sind freigeschaltet. Gib deine
                Tipps ab, bevor die jeweiligen Spiele gesperrt werden.
              </p>
            </div>
            <div className="flex items-start justify-between gap-4 sm:justify-end">
              <Avatar name={userDisplayName} />
              {nextLockMatch ? (
                <div className="rounded-lg bg-yellow-200 px-4 py-3 text-yellow-950">
                  <div className="text-xs font-bold uppercase">
                    Nächste Tippabgabe bis
                  </div>
                  <div className="mt-1 text-lg font-black">{nextLockTime}</div>
                  <div className="text-xs font-semibold">
                    {nextLockMatch.home} gegen {nextLockMatch.away}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <TournamentProgressCard progress={data.tournamentProgress} />

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

        {currentUserEntries.length ? (
          <Surface className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-500">
                  Deine Tippreihen
                </div>
                <div className="mt-1 text-3xl font-black text-zinc-950">
                  {currentUserEntries.length} Tippreihen
                </div>
                <div className="text-sm text-zinc-500">
                  Jede Tippreihe hat eigene Tipps und einen eigenen Rang.
                </div>
              </div>
              <div className="grid gap-2 sm:min-w-72">
                {currentUserEntries.map((entry) => (
                  <div
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg bg-zinc-100 px-3 py-2"
                    key={entry.name}
                  >
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-white">
                      <div className="text-[0.6rem] font-bold uppercase text-zinc-500">
                        Rang
                      </div>
                      <div className="text-sm font-black text-zinc-950">
                        {entry.rank}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-zinc-950">
                        {entry.entryLabel ?? entry.name}
                      </div>
                      <div className="text-xs font-semibold text-zinc-500">
                        {entry.points} Pkt · {entry.total} Tipps
                      </div>
                    </div>
                    {entry.isAdditionalEntry ? (
                      <span className="rounded-md bg-emerald-100 px-2 py-1 text-[0.65rem] font-black uppercase text-emerald-900">
                        Extra
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <Link
                className="hidden rounded-lg bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 sm:inline-flex"
                href="/leaderboard"
              >
                Rangliste
              </Link>
            </div>
          </Surface>
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

        <section className="space-y-3">
          <SectionTitle
            action={
              <Link className="text-sm font-bold text-emerald-800" href="/fixtures">
                Alle anzeigen
              </Link>
            }
            title="Erste Spiele"
          />
          <MatchList matches={data.todayMatches} showPrediction />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Letzte Ergebnisse" />
          <MatchList
            emptyMessage="Noch keine Ergebnisse. Das Turnier hat noch nicht begonnen."
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
              key={row.name}
              row={row}
            />
          ))}
        </Surface>
      </aside>
    </div>
  );
}
