// Mock data for WC26 predictor — mid group-stage snapshot
// Groups A-L with 4 teams each (new 48-team format)

const GROUPS = {
  A: ['MEX', 'POL', 'ECU', 'MAR'],
  B: ['CAN', 'SCO', 'CRC', 'TUN'],
  C: ['USA', 'IRN', 'WAL', 'GHA'],
  D: ['ARG', 'POR', 'KOR', 'SEN'],
  E: ['BRA', 'CRO', 'AUS', 'SRB'],
  F: ['FRA', 'NED', 'JPN', 'DEN'],
  G: ['ENG', 'ITA', 'BEL', 'URU'],
  H: ['GER', 'ESP', 'COL', 'SUI'],
};

// Standings table — mid group stage, 2 matches played per team
const STANDINGS = {
  A: [
    { code: 'MEX', p: 2, w: 2, d: 0, l: 0, gf: 5, ga: 1, pts: 6 },
    { code: 'POL', p: 2, w: 1, d: 1, l: 0, gf: 3, ga: 2, pts: 4 },
    { code: 'ECU', p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 3, pts: 1 },
    { code: 'MAR', p: 2, w: 0, d: 0, l: 2, gf: 0, ga: 3, pts: 0 },
  ],
  B: [
    { code: 'CAN', p: 2, w: 1, d: 1, l: 0, gf: 3, ga: 2, pts: 4 },
    { code: 'SCO', p: 2, w: 1, d: 1, l: 0, gf: 2, ga: 1, pts: 4 },
    { code: 'CRC', p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 2, pts: 1 },
    { code: 'TUN', p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 2, pts: 1 },
  ],
  C: [
    { code: 'USA', p: 2, w: 2, d: 0, l: 0, gf: 4, ga: 0, pts: 6 },
    { code: 'WAL', p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, pts: 3 },
    { code: 'GHA', p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 3, pts: 3 },
    { code: 'IRN', p: 2, w: 0, d: 0, l: 2, gf: 1, ga: 4, pts: 0 },
  ],
  D: [
    { code: 'ARG', p: 2, w: 2, d: 0, l: 0, gf: 6, ga: 1, pts: 6 },
    { code: 'POR', p: 2, w: 1, d: 1, l: 0, gf: 4, ga: 2, pts: 4 },
    { code: 'KOR', p: 2, w: 0, d: 1, l: 1, gf: 2, ga: 4, pts: 1 },
    { code: 'SEN', p: 2, w: 0, d: 0, l: 2, gf: 1, ga: 6, pts: 0 },
  ],
};

// Today is matchday 9 of group stage — 3 matches
const TODAY_MATCHES = [
  { id: 't1', home: 'USA', away: 'WAL', time: '13:00', stage: 'Gr. C', status: 'live', score: { h: 1, a: 0 }, minute: "67'", prediction: { h: 2, a: 0 } },
  { id: 't2', home: 'ARG', away: 'KOR', time: '16:00', stage: 'Gr. D', status: 'upcoming', kickoff: 'in 2h 14m', deadline: 7988 },
  { id: 't3', home: 'FRA', away: 'DEN', time: '20:00', stage: 'Gr. F', status: 'upcoming', kickoff: 'in 6h 14m', deadline: 22388 },
];

// Upcoming over next 48h
const UPCOMING = [
  { id: 'u1', home: 'ENG', away: 'URU', time: 'Tomorrow · 13:00', stage: 'Gr. G', status: 'upcoming' },
  { id: 'u2', home: 'GER', away: 'ESP', time: 'Tomorrow · 16:00', stage: 'Gr. H', status: 'upcoming' },
  { id: 'u3', home: 'BRA', away: 'SRB', time: 'Tomorrow · 20:00', stage: 'Gr. E', status: 'upcoming' },
  { id: 'u4', home: 'ITA', away: 'BEL', time: 'Jun 22 · 13:00', stage: 'Gr. G', status: 'upcoming' },
];

// Yesterday's results + points
const RESULTS = [
  { id: 'r1', home: 'MEX', away: 'ECU', time: 'Yesterday', stage: 'Gr. A', status: 'done', score: { h: 3, a: 1 }, prediction: { h: 3, a: 1 }, points: 3 },
  { id: 'r2', home: 'CAN', away: 'CRC', time: 'Yesterday', stage: 'Gr. B', status: 'done', score: { h: 2, a: 1 }, prediction: { h: 1, a: 0 }, points: 0 },
  { id: 'r3', home: 'POR', away: 'SEN', time: 'Jun 18', stage: 'Gr. D', status: 'done', score: { h: 2, a: 0 }, prediction: { h: 2, a: 1 }, points: 0 },
  { id: 'r4', home: 'NED', away: 'JPN', time: 'Jun 18', stage: 'Gr. F', status: 'done', score: { h: 1, a: 1 }, prediction: { h: 1, a: 1 }, points: 3 },
];

// Leaderboard — the friend group
const LEADERBOARD = [
  { rank: 1, name: 'Marco V.',   pts: 18, prev: 2, correct: 6, total: 16 },
  { rank: 2, name: 'Ana K.',     pts: 15, prev: 1, correct: 5, total: 16 },
  { rank: 3, name: 'Tomás R.',   pts: 15, prev: 3, correct: 5, total: 16 },
  { rank: 4, name: 'You',        pts: 12, prev: 4, correct: 4, total: 16, isMe: true },
  { rank: 5, name: 'Léa B.',     pts: 12, prev: 6, correct: 4, total: 16 },
  { rank: 6, name: 'Kenji O.',   pts: 9,  prev: 5, correct: 3, total: 16 },
  { rank: 7, name: 'Nadia S.',   pts: 9,  prev: 7, correct: 3, total: 16 },
  { rank: 8, name: 'Sam P.',     pts: 6,  prev: 8, correct: 2, total: 16 },
  { rank: 9, name: 'Chidi A.',   pts: 6,  prev: 10, correct: 2, total: 16 },
  { rank: 10, name: 'Priya M.',  pts: 3,  prev: 9, correct: 1, total: 16 },
];

// Full fixtures by matchday — sample
const MATCHDAY = [
  { id: 'm1', home: 'MEX', away: 'POL', time: '13:00', stage: 'Gr. A', status: 'done', score: { h: 2, a: 1 }, prediction: { h: 1, a: 0 }, points: 0 },
  { id: 'm2', home: 'ECU', away: 'MAR', time: '16:00', stage: 'Gr. A', status: 'done', score: { h: 0, a: 0 }, prediction: { h: 0, a: 0 }, points: 3 },
  { id: 'm3', home: 'USA', away: 'WAL', time: '19:00', stage: 'Gr. C', status: 'live', score: { h: 1, a: 0 }, minute: "67'", prediction: { h: 2, a: 0 } },
  { id: 'm4', home: 'IRN', away: 'GHA', time: '22:00', stage: 'Gr. C', status: 'upcoming', kickoff: 'Starts 22:00' },
];

// My picks history
const MY_PICKS = [
  { id: 'p1', home: 'MEX', away: 'ECU', time: 'Jun 19', stage: 'Gr. A', status: 'done', score: { h: 3, a: 1 }, prediction: { h: 3, a: 1 }, points: 3 },
  { id: 'p2', home: 'NED', away: 'JPN', time: 'Jun 18', stage: 'Gr. F', status: 'done', score: { h: 1, a: 1 }, prediction: { h: 1, a: 1 }, points: 3 },
  { id: 'p3', home: 'POR', away: 'SEN', time: 'Jun 18', stage: 'Gr. D', status: 'done', score: { h: 2, a: 0 }, prediction: { h: 2, a: 1 }, points: 0 },
  { id: 'p4', home: 'CAN', away: 'CRC', time: 'Jun 18', stage: 'Gr. B', status: 'done', score: { h: 2, a: 1 }, prediction: { h: 1, a: 0 }, points: 0 },
  { id: 'p5', home: 'USA', away: 'IRN', time: 'Jun 17', stage: 'Gr. C', status: 'done', score: { h: 2, a: 0 }, prediction: { h: 2, a: 0 }, points: 3 },
  { id: 'p6', home: 'ARG', away: 'SEN', time: 'Jun 17', stage: 'Gr. D', status: 'done', score: { h: 3, a: 0 }, prediction: { h: 2, a: 1 }, points: 0 },
];

Object.assign(window, {
  GROUPS, STANDINGS, TODAY_MATCHES, UPCOMING, RESULTS, LEADERBOARD, MATCHDAY, MY_PICKS,
});
