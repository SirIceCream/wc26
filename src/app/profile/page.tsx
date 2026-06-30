import Link from "next/link";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import { ProfileResults } from "@/components/app/profile-results";
import { ProfileSpecialPickReveal } from "@/components/app/profile-special-pick-reveal";
import { ProfileSpecialPicks } from "@/components/app/profile-special-picks";
import { Surface } from "@/components/app/primitives";
import { getAppData } from "@/lib/app-data";
import {
  getTeamLabel,
  teams,
  type TeamCode,
} from "@/lib/tournament-data";

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function formatGoalCount(value: number) {
  return `${value} ${value === 1 ? "Tor" : "Tore"}`;
}

export default async function ProfilePage() {
  const data = await getAppData();
  const currentUserEntries = data.leaderboard.filter((row) => row.isCurrentUser);
  const wonEuros = currentUserEntries.reduce((total, row) => total + row.points, 0);
  const userDisplayName = data.userDisplayName ?? "Player";
  const teamOptions = Object.keys(teams)
    .map((code) => ({
      code: code as TeamCode,
      label: getTeamLabel(code),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "de-AT"));
  const canEditSpecialPicks =
    data.connected &&
    Boolean(data.leagueId && data.userEmail) &&
    new Date(data.specialPickDeadlineAt) > new Date();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-emerald-800">
          {userDisplayName}
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">
          Meine Tipps
        </h1>
        <p className="mt-2 text-sm font-semibold text-zinc-500">
          Fragen?{" "}
          <Link className="font-black text-emerald-800 hover:text-emerald-950" href="/rules">
            Hier gehts zum Regelwerk.
          </Link>
        </p>
      </div>

      <Surface className="p-4">
        <div className="text-sm font-semibold text-zinc-500">
          Bisher gewonnen
        </div>
        <div className="mt-2 text-4xl font-black text-emerald-800">
          {formatEuro(wonEuros)}
        </div>
      </Surface>

      <section className="mt-7 space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Meine Tippreihen
        </h2>
        <Surface>
          {currentUserEntries.map((entry, index) => (
            <div
              className={index < currentUserEntries.length - 1 ? "border-b border-zinc-100" : ""}
              key={`${entry.name}-${entry.entryLabel ?? entry.rank}`}
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
                <div>
                  <div className="text-sm font-black text-zinc-950">
                    {entry.entryLabel ?? entry.name}
                  </div>
                  <div className="text-xs font-semibold text-zinc-500">
                    {entry.name} · {entry.total} Tipps
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-zinc-950">
                    {formatEuro(entry.winningsEuros ?? entry.points)}
                  </div>
                  <div className="text-xs font-bold uppercase text-zinc-500">
                    Gewonnen
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Surface>
      </section>

      <section className="mt-7 space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-sm font-bold uppercase text-zinc-500">
            Spezialtipps
          </h2>
          <p className="text-xs font-semibold text-zinc-500">
            {canEditSpecialPicks
              ? "Bis zum ersten Spiel editierbar."
              : `Gesperrt · Aktuell ${formatGoalCount(data.tournamentProgress.totalGoals)}.`}
          </p>
        </div>
        <ProfileSpecialPicks
          canEdit={canEditSpecialPicks}
          currentGoalCount={data.tournamentProgress.totalGoals}
          eliminatedChampionTeamCodes={data.eliminatedChampionTeamCodes}
          leagueId={data.leagueId}
          predictionEntries={data.predictionEntries}
          predictionsByRow={data.specialPredictions}
          teams={teamOptions}
        />
      </section>

      <section className="mt-7 space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Alle Spezialtipps
        </h2>
        <ProfileSpecialPickReveal
          deadlineAt={data.specialPickDeadlineAt}
          eliminatedChampionTeamCodes={data.eliminatedChampionTeamCodes}
          entries={data.specialPickRevealEntries}
          revealable={data.specialPicksRevealable}
          tournamentProgress={data.tournamentProgress}
        />
      </section>

      <section className="mt-7 space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Meine Ergebnisse
        </h2>
        <ProfileResults
          results={data.profileResults}
        />
      </section>
    </div>
  );
}
