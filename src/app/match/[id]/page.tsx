import Link from "next/link";
import { notFound } from "next/navigation";
import { DataModeBanner } from "@/components/app/data-mode-banner";
import {
  StatusChip,
  Surface,
  TeamFlag,
} from "@/components/app/primitives";
import {
  getMatchIntegrityData,
  type MatchPredictionGroup,
  type MatchPredictionSubmission,
  type UserPotentialWin,
} from "@/lib/app-data";
import {
  getStageLabel,
  getTeamLabel,
  getTeamShortLabel,
} from "@/lib/tournament-data";
import { cn } from "@/lib/utils";

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function scoreLabel(submission: MatchPredictionSubmission) {
  return `${submission.homeScore}:${submission.awayScore}`;
}

function getTipGroup(
  submission: MatchPredictionSubmission,
  groups: MatchPredictionGroup[],
) {
  const submissionScoreline = scoreLabel(submission);

  return groups.find((group) => group.scoreline === submissionScoreline);
}

function tipCardClasses(group?: MatchPredictionGroup) {
  if (group?.isImpossible) {
    return "border-red-200 bg-red-50";
  }

  if (group?.isFinalScore || group?.isCurrentScore) {
    return "border-emerald-200 bg-emerald-50";
  }

  return "border-yellow-200 bg-yellow-50";
}

function tipLabelClasses(group?: MatchPredictionGroup) {
  if (group?.isImpossible) return "text-red-900";
  if (group?.isFinalScore || group?.isCurrentScore) return "text-emerald-900";

  return "text-yellow-950";
}

function tipStatusLabel(group?: MatchPredictionGroup) {
  if (group?.isImpossible) return "Nicht mehr möglich";
  if (group?.isFinalScore) return "Endstand";
  if (group?.isCurrentScore) return "Aktueller Stand";

  return "Noch möglich";
}

function currentUserChipClasses(group: MatchPredictionGroup) {
  if (group.isNoTip) return "bg-zinc-100 text-zinc-400";
  if (group.isImpossible) return "bg-red-100 text-red-800";
  if (group.isFinalScore || group.isCurrentScore) return "bg-emerald-800 text-white";

  return "bg-yellow-100 text-yellow-950";
}

function TipsExportLink({ href }: { href: string }) {
  return (
    <a
      aria-label="Tipps als XLSX herunterladen"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-[0.65rem] font-black uppercase text-zinc-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
      download
      href={href}
      title="Tipps als XLSX herunterladen"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="m9 15 3 3 3-3" />
      </svg>
      <span>XLSX</span>
    </a>
  );
}

function PotentialWinList({ items }: { items: UserPotentialWin[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          className="flex items-center justify-between gap-3 text-sm"
          key={item.entryLabel}
        >
          <span className="font-semibold text-zinc-500">
            {item.entryLabel} · {item.scoreline}
          </span>
          <span className="font-black text-zinc-950">
            {item.isImpossible
              ? "Nicht mehr möglich"
              : item.possibleWinEuros === null
                ? "Nach Anpfiff"
                : formatEuro(item.possibleWinEuros)}
          </span>
        </div>
      ))}
    </div>
  );
}

function OwnTips({
  canPredict,
  groups,
  submissions,
}: {
  canPredict: boolean;
  groups: MatchPredictionGroup[];
  submissions: MatchPredictionSubmission[];
}) {
  if (!submissions.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
        Du hast für dieses Spiel keinen Tipp abgegeben.
        {canPredict ? (
          <>
            {" "}
            <Link className="font-black text-emerald-800 hover:text-emerald-950" href="/predict">
              Jetzt tippen!
            </Link>
          </>
        ) : (
          <span> Das Spiel ist bereits gesperrt.</span>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {submissions.map((submission) => {
        const group = getTipGroup(submission, groups);

        return (
          <div
            className={cn("rounded-lg border p-4", tipCardClasses(group))}
            key={submission.id}
          >
            <div
              className={cn(
                "text-xs font-black uppercase",
                tipLabelClasses(group),
              )}
            >
              {submission.entryLabel}
            </div>
            <div className="mt-2 text-3xl font-black text-zinc-950">
              {scoreLabel(submission)}
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-500">
              {submission.entryName}
            </div>
            <div
              className={cn(
                "mt-3 inline-flex rounded-md px-2 py-1 text-xs font-black uppercase",
                group?.isImpossible
                  ? "bg-red-100 text-red-800"
                  : group?.isFinalScore || group?.isCurrentScore
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-yellow-100 text-yellow-950",
              )}
            >
              {tipStatusLabel(group)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DistributionPanel({ groups }: { groups: MatchPredictionGroup[] }) {
  const maxCount = Math.max(...groups.map((group) => group.count), 1);

  return (
    <Surface className="p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase text-zinc-500">
            Abgegebene Tipps / Tippverteilung
          </h2>
          <p className="mt-1 text-sm font-semibold text-zinc-500">
            Gruppiert nach Ergebnis und Tippreihen.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div
            className={cn(
              "rounded-lg border p-3",
              group.isNoTip
                ? "border-zinc-200 bg-zinc-50 opacity-70"
                : group.isImpossible
                ? "border-zinc-200 bg-zinc-50 opacity-70"
                : group.isFinalScore || group.isCurrentScore
                ? "border-emerald-300 bg-emerald-50"
                : "border-zinc-200 bg-white",
            )}
            key={group.scoreline}
          >
            <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
              <div
                className={cn(
                  "text-2xl font-black",
                  group.isNoTip
                    ? "text-zinc-500"
                    : group.isImpossible
                    ? "text-zinc-400 line-through"
                    : "text-zinc-950",
                )}
              >
                {group.scoreline}
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    group.isNoTip
                      ? "bg-zinc-300"
                      : group.isImpossible
                      ? "bg-zinc-300"
                      : group.isFinalScore || group.isCurrentScore
                      ? "bg-emerald-700"
                      : "bg-yellow-400",
                  )}
                  style={{ width: `${(group.count / maxCount) * 100}%` }}
                />
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-zinc-950">
                  {group.count}x
                </div>
                <div className="text-[0.65rem] font-bold uppercase text-zinc-500">
                  {group.isNoTip ? "Tippreihen" : "Tipps"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span
                className={cn(
                  "rounded-md px-2 py-1",
                  group.isNoTip
                    ? "bg-zinc-100 text-zinc-500"
                    : group.isImpossible
                    ? "bg-zinc-100 text-zinc-500"
                    : "bg-yellow-100 text-yellow-950",
                )}
              >
                {group.isNoTip
                  ? "Kein Tipp abgegeben"
                  : group.isImpossible
                  ? "Nicht mehr möglich"
                  : `Möglicher Gewinn ${formatEuro(group.possibleWinEuros)}`}
              </span>
              {group.isFinalScore ? (
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-900">
                  Endstand
                </span>
              ) : null}
              {group.isCurrentScore ? (
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-900">
                  Aktueller Stand
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
              {group.submissions.map((submission) => (
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-bold",
                    group.isNoTip
                      ? "bg-zinc-100 text-zinc-400"
                      : submission.isCurrentUser
                      ? currentUserChipClasses(group)
                      : group.isImpossible
                        ? "bg-zinc-100 text-zinc-400"
                      : "bg-zinc-100 text-zinc-700",
                  )}
                  key={submission.id}
                >
                  {submission.entryName}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

export default async function MatchIntegrityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMatchIntegrityData(id);

  if (!data) {
    notFound();
  }

  const ownSubmissions = data.submissions.filter(
    (submission) => submission.isCurrentUser,
  );
  const canPredict = data.match.status === "open";
  const tipsExportHref = `/match/${encodeURIComponent(id)}/tips`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6">
        <DataModeBanner connected={data.connected} />
      </div>

      <div className="mb-4">
        <Link className="text-sm font-bold text-emerald-800" href="/fixtures">
          Zurück zum Spielplan
        </Link>
      </div>

      <Surface className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {data.match.status === "live" && data.match.minute ? (
                <StatusChip kind="live">{data.match.minute}</StatusChip>
              ) : null}
              <span className="text-xs font-bold uppercase text-zinc-500">
                {getStageLabel(data.match.stage)} · {data.match.time}
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-950 sm:text-3xl">
              {getTeamLabel(data.match.home)} gegen {getTeamLabel(data.match.away)}
            </h1>
            {data.match.venue ? (
              <p className="mt-2 text-sm font-semibold text-zinc-500">
                {data.match.venue}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex min-w-0 flex-col items-center gap-2 text-center">
              <TeamFlag code={data.match.home} size="lg" />
              <div className="text-sm font-black text-zinc-950">
                {getTeamShortLabel(data.match.home)}
              </div>
            </div>
            <div className="min-w-[5.5rem] text-center text-3xl font-black text-zinc-950">
              {data.match.score
                ? `${data.match.score.home}:${data.match.score.away}`
                : "vs"}
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2 text-center">
              <TeamFlag code={data.match.away} size="lg" />
              <div className="text-sm font-black text-zinc-950">
                {getTeamShortLabel(data.match.away)}
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Surface className="p-4">
          <div className="text-sm font-semibold text-zinc-500">Spielpot</div>
          <div className="mt-2 text-3xl font-black text-zinc-950">
            {formatEuro(data.pot.totalEuros)}
          </div>
          {data.pot.isJackpot ? (
            <div className="mt-1 text-xs font-bold uppercase text-yellow-700">
              Jackpot +{formatEuro(data.pot.carryInEuros)}
            </div>
          ) : null}
        </Surface>
        <Surface className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-500">Tippreihen</div>
            {data.revealAllPredictions ? (
              <TipsExportLink href={tipsExportHref} />
            ) : null}
          </div>
          <div className="mt-2 text-3xl font-black text-zinc-950">
            {data.totalTippreihen}
          </div>
        </Surface>
        <Surface className="p-4">
          <div className="text-sm font-semibold text-zinc-500">
            Möglicher Gewinn
          </div>
          <div className="mt-3">
            <PotentialWinList items={data.userPotentialWins} />
          </div>
        </Surface>
      </div>

      <section className="mt-7 space-y-3">
        <h2 className="text-sm font-bold uppercase text-zinc-500">
          Dein Tipp
        </h2>
        <OwnTips
          canPredict={canPredict}
          groups={data.groups}
          submissions={ownSubmissions}
        />
      </section>

      {!data.revealAllPredictions ? (
        <Surface className="mt-4 p-4">
          <p className="text-sm font-semibold text-zinc-600">
            Andere Tipps werden erst nach Anpfiff sichtbar.
          </p>
        </Surface>
      ) : data.groups.length ? (
        <div className="mt-7 space-y-5">
          <DistributionPanel groups={data.groups} />
        </div>
      ) : (
        <Surface className="mt-7 p-4">
          <p className="text-sm font-semibold text-zinc-500">
            Für dieses Spiel wurden noch keine Tipps abgegeben.
          </p>
        </Surface>
      )}
    </div>
  );
}
