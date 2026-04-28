import { DataModeBanner } from "@/components/app/data-mode-banner";
import { SpecialPicksClient } from "@/components/app/special-picks-client";
import { getAppData } from "@/lib/app-data";
import {
  getTeamLabel,
  getTeamShortLabel,
  teams,
  type TeamCode,
} from "@/lib/tournament-data";

type PageProps = {
  searchParams?: Promise<{
    focus?: string;
  }>;
};

function getFocus(value?: string) {
  return value === "goals" ? "goals" : "champion";
}

export default async function SpecialPicksPage({ searchParams }: PageProps) {
  const data = await getAppData();
  const params = searchParams ? await searchParams : {};
  const teamOptions = Object.keys(teams)
    .map((code) => ({
      code: code as TeamCode,
      label: getTeamLabel(code),
      shortLabel: getTeamShortLabel(code),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "de-AT"));
  const canEdit =
    data.connected &&
    Boolean(data.leagueId && data.userEmail) &&
    new Date(data.specialPickDeadlineAt) > new Date();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase text-emerald-800">
          Jackpotspiel
        </p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">
          Spezialtipps abgeben
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-500">
          Weltmeister und Gesamttore zählen pro Tippreihe als eigene
          Spezialpots und müssen vor dem Eröffnungsspiel abgegeben werden.
        </p>
      </div>

      <SpecialPicksClient
        canEdit={canEdit}
        deadlineAt={data.specialPickDeadlineAt}
        focus={getFocus(params.focus)}
        leagueId={data.leagueId}
        predictionEntries={data.predictionEntries}
        predictionsByRow={data.specialPredictions}
        teams={teamOptions}
      />
    </div>
  );
}
