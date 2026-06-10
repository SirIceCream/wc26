import { notFound } from "next/navigation";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import { StatusChip, Surface } from "@/components/app/primitives";
import {
  getAdminDashboardData,
  type AdminMatchCorrectionRow,
  type AdminProviderSyncLogRow,
  type AdminUserRow,
} from "@/lib/admin";
import { getStageLabel, getTeamLabel } from "@/lib/tournament-data";
import { cn } from "@/lib/utils";
import {
  deleteTestProfile,
  resetUserOnboarding,
  updateMatchCorrection,
  updateUserAdminRole,
  updateUserDisplayName,
  updateUserPredictionRows,
} from "./actions";

const messages: Record<string, string> = {
  "invalid-input": "Eingabe konnte nicht verarbeitet werden.",
  locked: "Diese Aktion ist nach Turnierstart gesperrt.",
  "match-missing": "Das Spiel wurde nicht gefunden.",
  "name-taken": "Dieser Anzeigename ist bereits vergeben.",
  saved: "Gespeichert.",
  "self-demote": "Du kannst dir nicht selbst die Adminrechte entziehen.",
  "user-missing": "Der Benutzer wurde nicht gefunden.",
};

function formatDate(value: string | null) {
  if (!value) return "Noch nicht";

  return new Intl.DateTimeFormat("de-AT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Surface className="p-4">
      <div className="text-sm font-semibold text-zinc-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-zinc-950">{value}</div>
    </Surface>
  );
}

function statusKind(status: string) {
  if (status === "live") return "live";
  if (status === "done") return "done";
  if (status === "upcoming") return "upcoming";

  return "locked";
}

function matchSideLabel(code: string | null, placeholder: string | null) {
  return code ? getTeamLabel(code) : placeholder ?? "TBD";
}

function scoreValue(value: number | null) {
  return value === null ? "" : String(value);
}

function SyncStatusSummary({
  syncLog,
}: {
  syncLog: AdminProviderSyncLogRow | null;
}) {
  if (!syncLog) {
    return (
      <div className="rounded-lg bg-zinc-50 p-3 text-sm font-semibold text-zinc-500">
        Noch kein football-data Sync protokolliert.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg bg-zinc-50 p-3 text-sm font-semibold text-zinc-600 md:grid-cols-4">
      <div>
        <div className="text-[0.65rem] font-black uppercase text-zinc-500">
          Letzter Sync
        </div>
        <div className="mt-1 font-black text-zinc-950">
          {formatDate(syncLog.startedAt)}
        </div>
      </div>
      <div>
        <div className="text-[0.65rem] font-black uppercase text-zinc-500">
          Typ
        </div>
        <div className="mt-1 font-black text-zinc-950">{syncLog.syncType}</div>
      </div>
      <div>
        <div className="text-[0.65rem] font-black uppercase text-zinc-500">
          Status
        </div>
        <div className="mt-1 font-black text-zinc-950">{syncLog.status}</div>
      </div>
      <div className="md:col-span-1">
        <div className="text-[0.65rem] font-black uppercase text-zinc-500">
          Meldung
        </div>
        <div className="mt-1 break-words">{syncLog.message ?? "-"}</div>
      </div>
    </div>
  );
}

function MatchCorrectionRow({ match }: { match: AdminMatchCorrectionRow }) {
  const home = matchSideLabel(match.homeTeamCode, match.homePlaceholder);
  const away = matchSideLabel(match.awayTeamCode, match.awayPlaceholder);
  const score =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore}:${match.awayScore}`
      : "-";

  return (
    <div className="border-t border-zinc-100 py-4">
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-zinc-950">
              #{match.gameId ?? "-"} {home} - {away}
            </span>
            <StatusChip kind={statusKind(match.status)}>
              {match.status}
            </StatusChip>
            {match.footballDataMatchId ? (
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600">
                FD {match.footballDataMatchId}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-500">
            {getStageLabel(match.groupName ?? match.stage)} ·{" "}
            {formatDate(match.kickoffAt)} · Provider {match.providerStatus}
          </div>
        </div>
        <div className="text-sm font-black text-zinc-950">{score}</div>
      </div>

      <form action={updateMatchCorrection} className="grid gap-3 lg:grid-cols-12">
        <input name="matchId" type="hidden" value={match.id} />
        <label className="lg:col-span-2">
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">
            App Status
          </span>
          <select
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
            defaultValue={match.status}
            name="status"
          >
            <option value="upcoming">Automatisch</option>
            <option value="live">Live</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label className="lg:col-span-1">
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">
            Heim
          </span>
          <input
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
            defaultValue={scoreValue(match.homeScore)}
            inputMode="numeric"
            max={99}
            min={0}
            name="homeScore"
            type="number"
          />
        </label>

        <label className="lg:col-span-1">
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">
            Ausw.
          </span>
          <input
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
            defaultValue={scoreValue(match.awayScore)}
            inputMode="numeric"
            max={99}
            min={0}
            name="awayScore"
            type="number"
          />
        </label>

        <label className="lg:col-span-1">
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">
            Elf. H
          </span>
          <input
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
            defaultValue={scoreValue(match.homePenaltyScore)}
            inputMode="numeric"
            max={99}
            min={0}
            name="homePenaltyScore"
            type="number"
          />
        </label>

        <label className="lg:col-span-1">
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">
            Elf. A
          </span>
          <input
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
            defaultValue={scoreValue(match.awayPenaltyScore)}
            inputMode="numeric"
            max={99}
            min={0}
            name="awayPenaltyScore"
            type="number"
          />
        </label>

        <label className="lg:col-span-2">
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">
            Ergebnisart
          </span>
          <select
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
            defaultValue={match.resultType ?? ""}
            name="resultType"
          >
            <option value="">-</option>
            <option value="REGULAR">REGULAR</option>
            <option value="EXTRA_TIME">EXTRA_TIME</option>
            <option value="PENALTY_SHOOTOUT">PENALTY_SHOOTOUT</option>
            <option value="AWARDED">AWARDED</option>
            <option value="ADMIN_CORRECTION">ADMIN_CORRECTION</option>
          </select>
        </label>

        <label className="lg:col-span-2">
          <span className="text-[0.65rem] font-black uppercase text-zinc-500">
            Notiz
          </span>
          <input
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
            defaultValue={match.adminNote ?? ""}
            maxLength={500}
            name="adminNote"
            type="text"
          />
        </label>

        <div className="flex items-end lg:col-span-1">
          <button className="h-10 w-full rounded-lg bg-zinc-950 px-3 text-sm font-black text-white hover:bg-zinc-800">
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}

function MatchCorrectionSection({
  matches,
  syncLog,
}: {
  matches: AdminMatchCorrectionRow[];
  syncLog: AdminProviderSyncLogRow | null;
}) {
  const mappedCount = matches.filter((match) => match.footballDataMatchId).length;

  return (
    <Surface className="mb-6 p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase text-zinc-500">
            Live Sync / Ergebnis-Korrektur
          </h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">
            {mappedCount} von {matches.length} Spielen sind mit football-data
            verknüpft.
          </p>
        </div>
      </div>

      <SyncStatusSummary syncLog={syncLog} />

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-black text-emerald-800">
          Spiele zur Korrektur öffnen
        </summary>
        <div className="mt-3">
          {matches.map((match) => (
            <MatchCorrectionRow key={match.id} match={match} />
          ))}
        </div>
      </details>
    </Surface>
  );
}

function AdminUserCard({
  canManageBeforeStart,
  currentUserId,
  user,
}: {
  canManageBeforeStart: boolean;
  currentUserId: string;
  user: AdminUserRow;
}) {
  const isCurrentUser = user.id === currentUserId;
  const rowTwoDataCount =
    user.rowTwoPredictionCount + user.rowTwoSpecialPredictionCount;

  return (
    <Surface className="p-4">
      <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-zinc-950">
              {user.displayName}
            </h2>
            {user.appRole === "admin" ? (
              <StatusChip kind="hit">Admin</StatusChip>
            ) : null}
            {user.onboardingCompleted ? (
              <StatusChip kind="hit">Aktiv</StatusChip>
            ) : (
              <StatusChip kind="open">Onboarding offen</StatusChip>
            )}
          </div>
          <div className="mt-1 break-all text-sm font-semibold text-zinc-500">
            {user.email ?? "Keine E-Mail"} · {user.id}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-zinc-500">
            <span>Erstellt: {formatDate(user.createdAt)}</span>
            <span>Beigetreten: {formatDate(user.joinedAt)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-zinc-500">
          <div className="rounded-lg bg-zinc-50 p-2">
            <div className="text-lg font-black text-zinc-950">
              {user.usesTwoPredictionRows ? "2" : "1"}
            </div>
            Tippreihen
          </div>
          <div className="rounded-lg bg-zinc-50 p-2">
            <div className="text-lg font-black text-zinc-950">
              {user.predictionCount}
            </div>
            Spieltipps
          </div>
          <div className="rounded-lg bg-zinc-50 p-2">
            <div className="text-lg font-black text-zinc-950">
              {user.specialPredictionCount}
            </div>
            Spezialtipps
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <form action={updateUserDisplayName} className="rounded-lg bg-zinc-50 p-3">
          <input name="userId" type="hidden" value={user.id} />
          <label className="block">
            <span className="text-xs font-black uppercase text-zinc-500">
              Anzeigename
            </span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
              defaultValue={user.displayName}
              maxLength={40}
              minLength={2}
              name="displayName"
              required
              type="text"
            />
          </label>
          <button className="mt-3 h-10 rounded-lg bg-zinc-950 px-4 text-sm font-black text-white hover:bg-zinc-800">
            Namen speichern
          </button>
        </form>

        <form action={updateUserPredictionRows} className="rounded-lg bg-zinc-50 p-3">
          <input name="userId" type="hidden" value={user.id} />
          <label className="block">
            <span className="text-xs font-black uppercase text-zinc-500">
              Tippreihen
            </span>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800 disabled:bg-zinc-100"
              defaultValue={user.usesTwoPredictionRows ? "true" : "false"}
              disabled={!canManageBeforeStart || !user.isMember}
              name="usesTwoPredictionRows"
            >
              <option value="false">1 Tippreihe</option>
              <option value="true">2 Tippreihen</option>
            </select>
          </label>
          {rowTwoDataCount > 0 ? (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              Beim Wechsel auf 1 Tippreihe werden vorhandene Tipps der zweiten
              Reihe gelöscht.
            </p>
          ) : null}
          <button
            className="mt-3 h-10 rounded-lg bg-zinc-950 px-4 text-sm font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!canManageBeforeStart || !user.isMember}
          >
            Tippreihen speichern
          </button>
        </form>

        <form action={updateUserAdminRole} className="rounded-lg bg-zinc-50 p-3">
          <input name="userId" type="hidden" value={user.id} />
          <label className="block">
            <span className="text-xs font-black uppercase text-zinc-500">
              Rolle
            </span>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-emerald-800"
              defaultValue={user.appRole === "admin" ? "admin" : "user"}
              name="appRole"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="mt-3 h-10 rounded-lg bg-zinc-950 px-4 text-sm font-black text-white hover:bg-zinc-800">
            Rolle speichern
          </button>
        </form>

        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="text-xs font-black uppercase text-zinc-500">
            Notfallaktionen
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={resetUserOnboarding}>
              <input name="userId" type="hidden" value={user.id} />
              <button
                className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-950 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                disabled={!canManageBeforeStart}
              >
                Onboarding zurücksetzen
              </button>
            </form>
            <form action={deleteTestProfile}>
              <input name="userId" type="hidden" value={user.id} />
              <button
                className="h-10 rounded-lg bg-red-700 px-4 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={!canManageBeforeStart || isCurrentUser}
              >
                Testprofil löschen
              </button>
            </form>
          </div>
          <p
            className={cn(
              "mt-3 text-xs font-semibold",
              canManageBeforeStart ? "text-zinc-500" : "text-red-700",
            )}
          >
            Diese Aktionen sind nur vor Turnierstart aktiv.
          </p>
        </div>
      </div>
    </Surface>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const data = await getAdminDashboardData();

  if (!data) {
    notFound();
  }

  const { message } = await searchParams;
  const statusMessage = message ? messages[message] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected />
      </div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-800">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">
            Notfallverwaltung
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-zinc-500">
            Verwalte Benutzer, Tippreihen und Adminrechte. Match- und
            Spezialtipps werden hier nicht manuell editiert.
          </p>
        </div>
        {!data.canManageBeforeStart ? (
          <StatusChip kind="locked">Turnier gestartet</StatusChip>
        ) : (
          <StatusChip kind="hit">Vor Turnierstart</StatusChip>
        )}
      </div>

      {statusMessage ? (
        <div className="mb-5 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-950">
          {statusMessage}
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Benutzer" value={data.totals.users} />
        <SummaryTile label="Onboarded" value={data.totals.onboarded} />
        <SummaryTile label="Tippreihen 2x" value={data.totals.twoRowMembers} />
        <SummaryTile label="Admins" value={data.totals.admins} />
        <SummaryTile label="Mitglieder" value={data.totals.members} />
        <SummaryTile label="Spieltipps" value={data.totals.predictions} />
        <SummaryTile label="Spezialtipps" value={data.totals.specialPredictions} />
      </div>

      <MatchCorrectionSection
        matches={data.matches}
        syncLog={data.providerSyncLog}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Benutzer
        </h2>
        {data.users.map((user) => (
          <AdminUserCard
            canManageBeforeStart={data.canManageBeforeStart}
            currentUserId={data.currentUserId}
            key={user.id}
            user={user}
          />
        ))}
      </section>
    </div>
  );
}
