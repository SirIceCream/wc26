import { NextResponse } from "next/server";
import {
  getMatchIntegrityData,
  type MatchPredictionGroup,
  type MatchPredictionSubmission,
} from "@/lib/app-data";
import {
  getStageLabel,
  getTeamLabel,
  getTeamShortLabel,
} from "@/lib/tournament-data";

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEuro(value: number) {
  return `${value.toLocaleString("de-AT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} EUR`;
}

function filenamePart(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "spiel"
  );
}

function groupStatusLabel(group: MatchPredictionGroup) {
  if (group.isNoTip) return "Kein Tipp abgegeben";
  if (group.isFinalScore) return "Endstand";
  if (group.isCurrentScore) return "Aktueller Stand";
  if (group.isImpossible) return "Nicht mehr möglich";

  return "Noch möglich";
}

function tipLabel(
  group: MatchPredictionGroup,
  submission: MatchPredictionSubmission,
) {
  return group.isNoTip
    ? "Kein Tipp"
    : `${submission.homeScore}:${submission.awayScore}`;
}

function possibleWinLabel(group: MatchPredictionGroup) {
  if (group.isNoTip || group.isImpossible) return "";

  return formatEuro(group.possibleWinEuros);
}

function rowClass(group: MatchPredictionGroup) {
  if (group.isNoTip) return "no-tip";
  if (group.isFinalScore || group.isCurrentScore) return "hit";
  if (group.isImpossible) return "impossible";

  return "";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getMatchIntegrityData(id);

  if (!data) {
    return new NextResponse("Spiel nicht gefunden.", { status: 404 });
  }

  if (!data.revealAllPredictions) {
    return new NextResponse("Tipps sind noch nicht sichtbar.", { status: 403 });
  }

  const homeName = getTeamLabel(data.match.home);
  const awayName = getTeamLabel(data.match.away);
  const title = `${homeName} gegen ${awayName}`;
  const score = data.match.score
    ? `${data.match.score.home}:${data.match.score.away}`
    : "Noch kein Ergebnis";
  const rows = data.groups.flatMap((group) =>
    group.submissions.map((submission) => ({ group, submission })),
  );
  const tableRows = rows.length
    ? rows
        .map(
          ({ group, submission }) => `
            <tr class="${rowClass(group)}">
              <td>${escapeHtml(submission.entryName)}</td>
              <td>${escapeHtml(submission.displayName)}</td>
              <td>${escapeHtml(submission.username ? `@${submission.username}` : "")}</td>
              <td class="text">${escapeHtml(tipLabel(group, submission))}</td>
              <td>${escapeHtml(groupStatusLabel(group))}</td>
              <td>${escapeHtml(possibleWinLabel(group))}</td>
            </tr>`,
        )
        .join("")
    : '<tr><td colspan="6">Keine Tipps sichtbar.</td></tr>';
  const filename = `tipps-${filenamePart(getTeamShortLabel(data.match.home))}-${filenamePart(getTeamShortLabel(data.match.away))}.xls`;
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #18181b;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 22px;
      }
      .meta {
        margin: 0 0 18px;
        color: #52525b;
        font-size: 13px;
        font-weight: 700;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th {
        background: #18181b;
        color: #ffffff;
        font-weight: 700;
        text-align: left;
      }
      th,
      td {
        border: 1px solid #d4d4d8;
        padding: 8px 10px;
      }
      td.text {
        mso-number-format: "\\@";
      }
      tr.hit td {
        background: #dcfce7;
      }
      tr.impossible td,
      tr.no-tip td {
        background: #f4f4f5;
        color: #71717a;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">${escapeHtml(getStageLabel(data.match.stage))} | ${escapeHtml(data.match.time)} | Spielstand: ${escapeHtml(score)}</p>
    <table>
      <thead>
        <tr>
          <th>Tippreihe</th>
          <th>Name</th>
          <th>Benutzername</th>
          <th>Tipp</th>
          <th>Status</th>
          <th>Möglicher Gewinn</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;

  return new NextResponse(`\ufeff${html}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
    },
  });
}
