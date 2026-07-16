import Link from "next/link";
import { ChangelogPopup } from "@/components/app/changelog-popup";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import { LeaderboardMiniRow } from "@/components/app/leaderboard";
import { LockCountdown } from "@/components/app/lock-countdown";
import { MatchList } from "@/components/app/match-card";
import { SectionTitle, Surface, TeamFlag } from "@/components/app/primitives";
import { SpecialPickCard } from "@/components/app/special-pick-card";
import { TournamentProgressCard } from "@/components/app/tournament-progress";
import {
  getAppData,
  type FinalAwardKind,
  type TournamentFinalAward,
} from "@/lib/app-data";
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

function formatAwardNames(awards: TournamentFinalAward[]) {
  if (!awards.length) return "Noch offen";

  return awards.map((award) => award.entryName).join(", ");
}

function formatFinalAwardAmount(awards: TournamentFinalAward[]) {
  const total = awards.reduce((sum, award) => sum + award.amountEuros, 0);

  return formatEuro(total);
}

function finalAwardsByType(
  awards: TournamentFinalAward[],
  awardType: FinalAwardKind,
) {
  return awards.filter((award) => award.awardType === awardType);
}

function FinalTournamentCard({
  awards,
  leaderboardWinnerName,
  totalGoals,
}: {
  awards: TournamentFinalAward[];
  leaderboardWinnerName: string;
  totalGoals: number;
}) {
  const championAwards = finalAwardsByType(awards, "champion");
  const goalAwards = finalAwardsByType(awards, "total_goals");
  const luckyLoserAwards = finalAwardsByType(awards, "lucky_loser");

  return (
    <Surface className="border-2 border-emerald-200 bg-emerald-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="rounded-md bg-emerald-800 px-2 py-1 text-xs font-black uppercase text-white">
            Turnier beendet
          </span>
          <h2 className="mt-3 text-2xl font-black text-zinc-950">
            Danke fürs Mitspielen!
          </h2>
          <p className="mt-2 text-sm font-semibold text-zinc-600">
            Wir sehen uns in zwei Jahren wieder. Die finalen Statistiken stehen
            in der Rangliste.
          </p>
        </div>
        <Link
          className="rounded-lg bg-zinc-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-zinc-800"
          href="/leaderboard"
        >
          Zur Rangliste
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white px-3 py-3">
          <div className="text-[0.65rem] font-black uppercase text-zinc-500">
            Rangliste
          </div>
          <div className="mt-1 text-sm font-black text-zinc-950">
            {leaderboardWinnerName}
          </div>
        </div>
        <div className="rounded-lg bg-white px-3 py-3">
          <div className="text-[0.65rem] font-black uppercase text-zinc-500">
            Tore gesamt
          </div>
          <div className="mt-1 text-sm font-black text-zinc-950">
            {totalGoals}
          </div>
        </div>
        <div className="rounded-lg bg-white px-3 py-3">
          <div className="text-[0.65rem] font-black uppercase text-zinc-500">
            Weltmeisterwette
          </div>
          <div className="mt-1 text-sm font-black text-zinc-950">
            {formatAwardNames(championAwards)} ·{" "}
            {formatFinalAwardAmount(championAwards)}
          </div>
        </div>
        <div className="rounded-lg bg-white px-3 py-3">
          <div className="text-[0.65rem] font-black uppercase text-zinc-500">
            Torwette
          </div>
          <div className="mt-1 text-sm font-black text-zinc-950">
            {formatAwardNames(goalAwards)} · {formatFinalAwardAmount(goalAwards)}
          </div>
        </div>
        <div className="rounded-lg bg-white px-3 py-3 sm:col-span-2">
          <div className="text-[0.65rem] font-black uppercase text-zinc-500">
            Lucky-Looser Jackpot
          </div>
          <div className="mt-1 text-sm font-black text-zinc-950">
            {formatAwardNames(luckyLoserAwards)} ·{" "}
            {formatFinalAwardAmount(luckyLoserAwards)}
          </div>
        </div>
      </div>
    </Surface>
  );
}

function FeaturedMatchCard({
  connected,
  compact = false,
  match,
}: {
  connected: boolean;
  compact?: boolean;
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

      <div
        className={cn(
          "grid gap-5",
          !compact && "lg:grid-cols-[1fr_auto_1fr] lg:items-center",
        )}
      >
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
            {match.score ? (
              <>
                {match.score.home}:{match.score.away}
                {match.minute ? (
                  <span className="ml-2 text-2xl">({match.minute})</span>
                ) : null}
              </>
            ) : (
              "vs"
            )}
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
  const liveMatches = dashboardMatches.filter((match) => match.status === "live");
  const firstMatch = dashboardMatches[0];
  const firstKickoffAt = firstMatch?.kickoffAt;
  const nextKickoffMatches = firstKickoffAt
    ? dashboardMatches.filter((match) => match.kickoffAt === firstKickoffAt)
    : firstMatch
      ? [firstMatch]
      : [];
  const featuredMatches = liveMatches.length ? liveMatches : nextKickoffMatches;
  const featuredMatchIds = new Set(featuredMatches.map((match) => match.id));
  const nextListMatches = data.todayMatches.filter(
    (match) => !featuredMatchIds.has(match.id),
  );
  const secondaryMatches = nextListMatches.length
    ? nextListMatches
    : data.upcomingMatches
        .filter((match) => !featuredMatchIds.has(match.id))
        .slice(0, 2);
  const userDisplayName = data.userDisplayName ?? "Player";
  const firstName = userDisplayName.split(" ")[0] ?? userDisplayName;
  const missedPickLabel =
    data.missedPredictionCount === 1
      ? "1 verpasster Tipp"
      : `${data.missedPredictionCount} verpasste Tipps`;
  const primarySpecialPrediction = data.specialPredictions[1];
  const specialPicksOpen = new Date(data.specialPickDeadlineAt) > new Date();
  const finalSummary = data.finalSummary;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[1fr_22rem] lg:py-8">
      <ChangelogPopup changelog={data.activeChangelog} />
      <div className="flex flex-col gap-6">
        <DataModeBanner connected={data.connected} />

        <section>
          <div className="mb-3">
            <h1 className="text-3xl font-black text-zinc-950">
              Servus {firstName}
            </h1>
          </div>
          {finalSummary ? (
            <FinalTournamentCard
              awards={finalSummary.awards}
              leaderboardWinnerName={finalSummary.leaderboardWinner?.name ?? "Noch offen"}
              totalGoals={finalSummary.totalGoals}
            />
          ) : featuredMatches.length ? (
            <div
              className={cn(
                "grid gap-4",
                featuredMatches.length > 1 && "xl:grid-cols-2",
              )}
            >
              {featuredMatches.map((match) => (
                <FeaturedMatchCard
                  compact={featuredMatches.length > 1}
                  connected={data.connected}
                  key={match.id}
                  match={match}
                />
              ))}
            </div>
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
