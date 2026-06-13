import { DataModeBanner } from "@/components/app/data-mode-banner";
import { FixturesFilterClient } from "@/components/app/fixtures-filter-client";
import { getAppData } from "@/lib/app-data";

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ results?: string }>;
}) {
  const params = await searchParams;
  const data = await getAppData();
  const incompleteMatches = [...data.todayMatches, ...data.upcomingMatches];
  const nextMatches = incompleteMatches.slice(0, 2);
  const otherMatches = incompleteMatches.slice(2);
  const initialOnlyResults = params.results === "1";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-zinc-950">
          Spielplan und Ergebnisse
        </h1>
      </div>

      <FixturesFilterClient
        connected={data.connected}
        initialOnlyResults={initialOnlyResults}
        nextMatches={nextMatches}
        otherMatches={otherMatches}
        recentResults={data.recentResults}
      />
    </div>
  );
}
