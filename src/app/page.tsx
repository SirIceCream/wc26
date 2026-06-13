import Link from "next/link";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import { LeaderboardMiniRow } from "@/components/app/leaderboard";
import { LockCountdown } from "@/components/app/lock-countdown";
import { MatchList } from "@/components/app/match-card";
import { SectionTitle, Surface, TeamFlag } from "@/components/app/primitives";
import { SpecialPickCard } from "@/components/app/special-pick-card";
import { TournamentProgressCard } from "@/components/app/tournament-progress";
import { getAppData } from "@/lib/app-data";
import { formatViennaMatchTime } from "@/lib/time";
import {
  getStageLabel,
  getTeamLabel,
  getTeamShortLabel,
  type Match,
} from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function getOwnPredictionLabels(match: Match) {
  const entries = Object.entries(match.predictionsByRow ?? {})
    .map(([row, prediction]) => ({
      label: `R${row}`,
      prediction,
      row: Number.parseInt(row, 10),
    }))
    .sort((a, b) => a.row - b.row);

  if (!entries.length && match.prediction) {
    return [
      {
        label: "R1",
        prediction: match.prediction,
        row: 1,
      },
    ];
  }

  return entries;
}

function FeaturedMatchCard({
  connected,
  match,
}: {
  connected: boolean;
  match: Match;
}) {
  const isLive = match.status === "live";
  const isJackpotMatch = Boolean(match.pot?.isJackpot);
  const matchTime = match.kickoffAt
    ? formatViennaMatchTime(match.kickoffAt).compact
    : match.time;
  const ownPredictions = getOwnPredictionLabels(match);
  const content = (
    <Surface
      className={cn(
        "relative p-5 transition",
        connected && "hover:-translate-y-0.5 hover:shadow-md",
        isJackpotMatch
          ? "border-4 border-amber-400 bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-200 shadow-[0_18px_44px_rgba(202,138,4,0.22)]"
          : isLive
            ? "border-red-200 bg-gradient-to-br from-red-50 via-white to-white"
            : "bg-white",
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-md px-2 py-1 text-xs font-black uppercase",
            isLive
              ? "bg-red-700 text-white"
              : "bg-emerald-100 text-emerald-900",
          )}
        >
          {isLive ? "Live-Spiel" : "Nächstes Spiel"}
        </span>
        {match.minute ? (
          <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-black uppercase text-red-700">
            {match.minute}
          </span>
        ) : null}
        {isJackpotMatch && match.pot ? (
          <span className="rounded-md border-2 border-yellow-500 bg-amber-400 px-2 py-1 text-xs font-black uppercase text-yellow-950 shadow-sm">
            Jackpot {formatEuro(match.pot.totalEuros)}
          </span>
        ) : match.pot ? (
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-black uppercase text-zinc-600">
            Pot {formatEuro(match.pot.totalEuros)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3">
          <TeamFlag code={match.home} size="lg" />
          <div className="min-w-0">
            <div className="text-xl font-black text-zinc-950">
              {getTeamShortLabel(match.home)}
            </div>
            <div className="truncate text-sm font-semibold text-zinc-500">
              {getTeamLabel(match.home)}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div
            className={cn(
              "text-5xl font-black tabular-nums",
              isLive ? "text-red-700" : "text-zinc-950",
            )}
          >
            {match.score ? `${match.score.home}:${match.score.away}` : "vs"}
          </div>
          <div className="mt-2 text-xs font-black uppercase text-zinc-500">
            {getStageLabel(match.stage)} · {matchTime}
          </div>
          {match.status === "open" ? (
            <div className="mt-3 rounded-lg bg-white/70 px-3 py-2">
              <LockCountdown targetAt={match.kickoffAt} />
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 lg:justify-end">
          <div className="min-w-0 text-right">
            <div className="text-xl font-black text-zinc-950">
              {getTeamShortLabel(match.away)}
            </div>
            <div className="truncate text-sm font-semibold text-zinc-500">
              {getTeamLabel(match.away)}
            </div>
          </div>
          <TeamFlag code={match.away} size="lg" />
        </div>
      </div>

      {match.venue ? (
        <div className="mt-4 border-t border-zinc-100 pt-3 text-sm font-semibold text-zinc-500">
          {match.venue}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-black uppercase text-zinc-500">
          Mein Tipp
        </div>
        {ownPredictions.length ? (
          <div className="flex flex-wrap gap-2">
            {ownPredictions.map((entry) => (
              <span
                className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-900"
                key={entry.row}
              >
                {entry.label} · {entry.prediction.home}:{entry.prediction.away}
              </span>
            ))}
          </div>
        ) : (
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-500">
            Kein Tipp
          </span>
        )}
      </div>
    </Surface>
  );

  if (!connected) {
    return content;
  }

  return (
    <Link className="block" href={`/match/${match.id}`}>
      {content}
    </Link>
  );
}

export default async function Home() {
  const data = await getAppData();
  const dashboardMatches = [...data.todayMatches, ...data.upcomingMatches];
  const featuredMatch =
    dashboardMatches.find((match) => match.status === "live") ??
    dashboardMatches[0];
  const nextListMatches = data.todayMatches.filter(
    (match) => match.id !== featuredMatch?.id,
  );
  const secondaryMatches = nextListMatches.length
    ? nextListMatches
    : data.upcomingMatches.slice(0, 2);
  const userDisplayName = data.userDisplayName ?? "Player";
  const firstName = userDisplayName.split(" ")[0] ?? userDisplayName;
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

        <section>
          <div className="mb-3">
            <h1 className="text-3xl font-black text-zinc-950">
              Servus {firstName}
            </h1>
          </div>
          {featuredMatch ? (
            <FeaturedMatchCard connected={data.connected} match={featuredMatch} />
          ) : (
            <Surface className="p-5">
              <p className="text-sm font-semibold text-zinc-500">
                Aktuell ist kein Spiel angesetzt.
              </p>
            </Surface>
          )}
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
            matches={secondaryMatches}
            showPrediction
          />
        </section>

        <section className="space-y-3">
          <SectionTitle
            action={
              <Link
                className="text-sm font-bold text-emerald-800"
                href="/fixtures?results=1"
              >
                Alle anzeigen
              </Link>
            }
            title="Letzte Ergebnisse"
          />
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
