import { DataModeBanner } from "@/components/app/data-mode-banner";
import { MatchList } from "@/components/app/match-card";
import { Surface } from "@/components/app/primitives";
import { getAppData } from "@/lib/app-data";

export default async function ProfilePage() {
  const data = await getAppData();
  const currentUserEntries = data.leaderboard.filter((row) => row.isCurrentUser);
  const pickHistory = [...data.recentResults, ...data.todayMatches];
  const pendingPicks = data.predictionMatches;
  const totalPoints = currentUserEntries.reduce((total, row) => total + row.points, 0);
  const totalExact = currentUserEntries.reduce((total, row) => total + row.exact, 0);
  const userDisplayName = data.userDisplayName ?? "Player";

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
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Surface className="p-4">
          <div className="text-sm font-semibold text-zinc-500">Punkte</div>
          <div className="mt-2 text-4xl font-black text-zinc-950">
            {totalPoints}
          </div>
        </Surface>
        <Surface className="p-4">
          <div className="text-sm font-semibold text-zinc-500">
            Exakte Treffer
          </div>
          <div className="mt-2 text-4xl font-black text-emerald-800">
            {totalExact}
          </div>
        </Surface>
        <Surface className="p-4">
          <div className="text-sm font-semibold text-zinc-500">Offen</div>
          <div className="mt-2 text-4xl font-black text-yellow-700">
            {pendingPicks.length * data.predictionEntries.length}
          </div>
        </Surface>
      </div>

      <section className="mt-7 space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Meine Tippreihen
        </h2>
        <Surface>
          {currentUserEntries.map((entry, index) => (
            <div
              className={index < currentUserEntries.length - 1 ? "border-b border-zinc-100" : ""}
              key={entry.name}
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
                    {entry.points}
                  </div>
                  <div className="text-xs font-bold uppercase text-zinc-500">
                    Pkt
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Surface>
      </section>

      <section className="mt-7 space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Tippverlauf
        </h2>
        <MatchList
          emptyMessage="Noch keine Tipps."
          matches={pickHistory}
          showPrediction
          showResult
        />
      </section>
    </div>
  );
}
