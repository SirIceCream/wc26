import tournamentSeed from "@/data/tournament-seed.json";
import { formatViennaMatchTime } from "@/lib/time";

export const OPENING_SLATE_MATCH_COUNT = 2;

export const teams = tournamentSeed.teams;

export type TeamCode = keyof typeof teams;
export type MatchSide = TeamCode | string;

const germanTeamNames: Record<TeamCode, string> = {
  ALG: "Algerien",
  ARG: "Argentinien",
  AUS: "Australien",
  AUT: "Österreich",
  BEL: "Belgien",
  BIH: "Bosnien und Herzegowina",
  BRA: "Brasilien",
  CAN: "Kanada",
  CIV: "Elfenbeinküste",
  COD: "DR Kongo",
  COL: "Kolumbien",
  CPV: "Kap Verde",
  CRO: "Kroatien",
  CUW: "Curaçao",
  CZE: "Tschechien",
  ECU: "Ecuador",
  EGY: "Ägypten",
  ENG: "England",
  ESP: "Spanien",
  FRA: "Frankreich",
  GER: "Deutschland",
  GHA: "Ghana",
  HAI: "Haiti",
  IRN: "Iran",
  IRQ: "Irak",
  JOR: "Jordanien",
  JPN: "Japan",
  KOR: "Südkorea",
  KSA: "Saudi-Arabien",
  MAR: "Marokko",
  MEX: "Mexiko",
  NED: "Niederlande",
  NOR: "Norwegen",
  NZL: "Neuseeland",
  PAN: "Panama",
  PAR: "Paraguay",
  POR: "Portugal",
  QAT: "Katar",
  RSA: "Südafrika",
  SCO: "Schottland",
  SEN: "Senegal",
  SUI: "Schweiz",
  SWE: "Schweden",
  TUN: "Tunesien",
  TUR: "Türkei",
  URU: "Uruguay",
  USA: "Vereinigte Staaten",
  UZB: "Usbekistan",
};

export type MatchStatus = "upcoming" | "live" | "done" | "locked" | "open";

export type Match = {
  id: string;
  fifaMatchId?: string;
  home: MatchSide;
  away: MatchSide;
  time: string;
  kickoffAt?: string;
  stage: string;
  status: MatchStatus;
  venue?: string;
  kickoff?: string;
  deadline?: string;
  minute?: string;
  score?: { home: number; away: number };
  prediction?: { home: number; away: number } | null;
  predictionsByRow?: Record<number, { home: number; away: number }>;
  points?: number;
};

export type LeaderboardRow = {
  rank: number;
  previousRank: number;
  name: string;
  ownerName?: string;
  entryLabel?: string;
  hasAdditionalTippreihe?: boolean;
  isAdditionalEntry?: boolean;
  points: number;
  exact: number;
  total: number;
  isCurrentUser?: boolean;
};

export type PredictionEntry = {
  id: string;
  label: string;
  ownerName: string;
  predictionRow: number;
  isAdditional: boolean;
};

export function isTeamCode(code: string | null | undefined): code is TeamCode {
  return Boolean(code && code in teams);
}

export function getTeamLabel(code: MatchSide) {
  return isTeamCode(code) ? germanTeamNames[code] : code;
}

export function getTeamShortLabel(code: MatchSide) {
  return isTeamCode(code) ? teams[code].code : code;
}

export function getStageLabel(stage: string) {
  if (stage === "Group") return "Gruppe";

  return stage.replace(/^Group ([A-L])$/, "Gruppe $1");
}

function toTeamCode(code: string): TeamCode {
  if (code in teams) {
    return code as TeamCode;
  }

  throw new Error(`Unknown team code in tournament seed: ${code}`);
}

const sortedSeedMatches = [...tournamentSeed.matches].sort(
  (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
);

export const seededMatches: Match[] = sortedSeedMatches.map((match) => {
  const kickoff = formatViennaMatchTime(match.kickoffAt);
  return {
    id: `fifa-${match.fifaMatchId}`,
    fifaMatchId: match.fifaMatchId,
    home: toTeamCode(match.home),
    away: toTeamCode(match.away),
    time: kickoff.compact,
    kickoffAt: match.kickoffAt,
    stage: match.stage,
    status: "open",
    venue: match.venue,
    deadline: "Sperrt bei Anpfiff",
    prediction: null,
  };
});

export const todayMatches = seededMatches.slice(0, OPENING_SLATE_MATCH_COUNT);

export const upcomingMatches = seededMatches.slice(OPENING_SLATE_MATCH_COUNT);

export const recentResults: Match[] = [];

export const leaderboard: LeaderboardRow[] = tournamentSeed.leaderboard.map(
  (row) => ({
    rank: row.rank,
    previousRank: row.rank,
    name: row.name,
    ownerName: "ownerName" in row ? row.ownerName : undefined,
    entryLabel: "entryLabel" in row ? row.entryLabel : undefined,
    hasAdditionalTippreihe:
      "hasAdditionalTippreihe" in row
        ? Boolean(row.hasAdditionalTippreihe)
        : false,
    isAdditionalEntry:
      "isAdditionalEntry" in row ? Boolean(row.isAdditionalEntry) : false,
    points: 0,
    exact: 0,
    total: 0,
    isCurrentUser: Boolean(row.isCurrentUser),
  }),
);

export const predictionEntries: PredictionEntry[] = [
  {
    id: "alex-1",
    label: "Tippreihe 1",
    ownerName: "Alex Chen",
    predictionRow: 1,
    isAdditional: false,
  },
  {
    id: "alex-2",
    label: "Tippreihe 2",
    ownerName: "Alex Chen",
    predictionRow: 2,
    isAdditional: true,
  },
];

export const groups = Object.fromEntries(
  Object.entries(tournamentSeed.groups).map(([group, codes]) => [
    group,
    codes.map(toTeamCode),
  ]),
) as Record<string, TeamCode[]>;

export const myPicks = [...todayMatches];
