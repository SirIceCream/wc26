import tournamentSeed from "@/data/tournament-seed.json";
import { formatViennaMatchTime } from "@/lib/time";

export const OPENING_SLATE_MATCH_COUNT = 2;

export const teams = tournamentSeed.teams;

export type TeamCode = keyof typeof teams;
export type MatchSide = TeamCode | string;

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
  isAdditional: boolean;
};

export function isTeamCode(code: string | null | undefined): code is TeamCode {
  return Boolean(code && code in teams);
}

export function getTeamLabel(code: MatchSide) {
  return isTeamCode(code) ? teams[code].name : code;
}

export function getTeamShortLabel(code: MatchSide) {
  return isTeamCode(code) ? teams[code].code : code;
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

export const seededMatches: Match[] = sortedSeedMatches.map((match, index) => {
  const kickoff = formatViennaMatchTime(match.kickoffAt);
  const isOpeningSlate = index < OPENING_SLATE_MATCH_COUNT;

  return {
    id: `fifa-${match.fifaMatchId}`,
    fifaMatchId: match.fifaMatchId,
    home: toTeamCode(match.home),
    away: toTeamCode(match.away),
    time: kickoff.compact,
    kickoffAt: match.kickoffAt,
    stage: match.stage,
    status: isOpeningSlate ? "open" : "upcoming",
    venue: match.venue,
    deadline: isOpeningSlate ? "Locks at kickoff" : undefined,
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
    isAdditional: false,
  },
  {
    id: "alex-2",
    label: "Tippreihe 2",
    ownerName: "Alex Chen",
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
