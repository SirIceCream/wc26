import Link from "next/link";
import { notFound } from "next/navigation";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import {
  ProfileResults,
  type ProfileResultSort,
} from "@/components/app/profile-results";
import { ProfileSpecialPicks } from "@/components/app/profile-special-picks";
import { Surface } from "@/components/app/primitives";
import { getPlayerProfileData } from "@/lib/app-data";
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

function getResultSort(value: string | undefined): ProfileResultSort {
  return value === "winnings" ? "winnings" : "newest";
}

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ resultSort?: string }>;
}) {
  const { username } = await params;
  const { resultSort } = await searchParams;
  const data = await getPlayerProfileData(decodeURIComponent(username));

  if (!data) {
    notFound();
  }

  const wonEuros = data.leaderboardEntries.reduce(
    (total, row) => total + row.points,
    0,
  );
  const teamOptions = Object.keys(teams)
    .map((code) => ({
      code: code as TeamCode,
      label: getTeamLabel(code),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "de-AT"));
  const canViewSpecialPicks = data.isCurrentUser || data.specialPicksRevealable;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>

      <div className="mb-4">
        <Link className="text-sm font-bold text-emerald-800" href="/leaderboard">
          Zurück zur Rangliste
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-black text-zinc-950">
          Profil von {data.displayName}
        </h1>
        <p className="mt-2 text-sm font-semibold text-zinc-500">
          Öffentliche Tipps, Ergebnisse und Gewinne.
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
          Tippreihen
        </h2>
        <Surface>
          {data.leaderboardEntries.map((entry, index) => (
            <div
              className={index < data.leaderboardEntries.length - 1 ? "border-b border-zinc-100" : ""}
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
            Aktuell {formatGoalCount(data.tournamentProgress.totalGoals)}.
          </p>
        </div>
        {canViewSpecialPicks ? (
          <ProfileSpecialPicks
            canEdit={false}
            currentGoalCount={data.tournamentProgress.totalGoals}
            key={data.username}
            leagueId={data.leagueId}
            predictionEntries={data.predictionEntries}
            predictionsByRow={data.specialPredictions}
            teams={teamOptions}
          />
        ) : (
          <Surface className="p-4">
            <p className="text-sm font-semibold text-zinc-500">
              Spezialtipps werden nach Turnierstart sichtbar.
            </p>
          </Surface>
        )}
      </section>

      <section className="mt-7 space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Ergebnisse
        </h2>
        <ProfileResults
          basePath={`/players/${encodeURIComponent(data.username)}`}
          predictionLabelText="Tipp"
          results={data.profileResults}
          sort={getResultSort(resultSort)}
        />
      </section>
    </div>
  );
}
