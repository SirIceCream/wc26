// Design tokens — World Cup 2026 prediction app
// Modern sporty direction: electric violet + lime, bold numerics, warm neutral

const TOKENS = /*EDITMODE-BEGIN*/{
  "primary": "#6D28D9",
  "primaryInk": "#4C1D95",
  "accent": "#BEF264",
  "accentInk": "#3F6212"
}/*EDITMODE-END*/;

const T = {
  // colors
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F3EE',
  ink: '#0A0A0A',
  ink2: '#3F3F46',
  ink3: '#71717A',
  ink4: '#A1A1AA',
  line: '#E7E5E0',
  lineSoft: '#F0EEE8',

  // brand (live-bound from TWEAKS)
  get primary() { return TOKENS.primary; },
  get primaryInk() { return TOKENS.primaryInk; },
  get accent() { return TOKENS.accent; },
  get accentInk() { return TOKENS.accentInk; },

  // semantic
  live: '#EF4444',
  live2: '#FEE2E2',
  locked: '#A8A29E',
  warn: '#F59E0B',

  // type
  display: '"Inter Tight", -apple-system, system-ui, sans-serif',
  body: 'Inter, -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',

  // radii
  r: { sm: 8, md: 10, lg: 14, xl: 20, pill: 999 },

  // shadows
  sh1: '0 1px 2px rgba(10,10,10,0.04), 0 1px 1px rgba(10,10,10,0.03)',
  sh2: '0 1px 3px rgba(10,10,10,0.05), 0 4px 12px rgba(10,10,10,0.04)',
  sh3: '0 2px 4px rgba(10,10,10,0.06), 0 12px 32px rgba(10,10,10,0.08)',
};

// 32 participating nations for WC 2026 mock — original solid-color disc treatment
// (not recreating actual flag designs — just color cues + 3-letter code)
const TEAMS = {
  CAN: { name: 'Canada',       code: 'CAN', c1: '#D52B1E', c2: '#FFFFFF' },
  MEX: { name: 'Mexico',       code: 'MEX', c1: '#006341', c2: '#CE1126' },
  USA: { name: 'United States',code: 'USA', c1: '#1E3A8A', c2: '#B22234' },
  ARG: { name: 'Argentina',    code: 'ARG', c1: '#75AADB', c2: '#FFFFFF' },
  BRA: { name: 'Brazil',       code: 'BRA', c1: '#FFDF00', c2: '#009739' },
  FRA: { name: 'France',       code: 'FRA', c1: '#1E3A8A', c2: '#EF4135' },
  ENG: { name: 'England',      code: 'ENG', c1: '#FFFFFF', c2: '#CE1124' },
  GER: { name: 'Germany',      code: 'GER', c1: '#000000', c2: '#DD0000' },
  ESP: { name: 'Spain',        code: 'ESP', c1: '#AA151B', c2: '#F1BF00' },
  POR: { name: 'Portugal',     code: 'POR', c1: '#006600', c2: '#FF0000' },
  ITA: { name: 'Italy',        code: 'ITA', c1: '#008C45', c2: '#CD212A' },
  NED: { name: 'Netherlands',  code: 'NED', c1: '#F36C21', c2: '#21468B' },
  BEL: { name: 'Belgium',      code: 'BEL', c1: '#000000', c2: '#FDDA24' },
  CRO: { name: 'Croatia',      code: 'CRO', c1: '#FF0000', c2: '#171796' },
  URU: { name: 'Uruguay',      code: 'URU', c1: '#7B9FD6', c2: '#FFFFFF' },
  COL: { name: 'Colombia',     code: 'COL', c1: '#FCD116', c2: '#003893' },
  JPN: { name: 'Japan',        code: 'JPN', c1: '#FFFFFF', c2: '#BC002D' },
  KOR: { name: 'South Korea',  code: 'KOR', c1: '#FFFFFF', c2: '#003478' },
  MAR: { name: 'Morocco',      code: 'MAR', c1: '#C1272D', c2: '#006233' },
  SEN: { name: 'Senegal',      code: 'SEN', c1: '#00853F', c2: '#FDEF42' },
  AUS: { name: 'Australia',    code: 'AUS', c1: '#00843D', c2: '#FFCD00' },
  SUI: { name: 'Switzerland',  code: 'SUI', c1: '#D52B1E', c2: '#FFFFFF' },
  DEN: { name: 'Denmark',      code: 'DEN', c1: '#C8102E', c2: '#FFFFFF' },
  POL: { name: 'Poland',       code: 'POL', c1: '#FFFFFF', c2: '#DC143C' },
  ECU: { name: 'Ecuador',      code: 'ECU', c1: '#FFDD00', c2: '#034EA2' },
  IRN: { name: 'Iran',         code: 'IRN', c1: '#239F40', c2: '#DA0000' },
  SRB: { name: 'Serbia',       code: 'SRB', c1: '#C6363C', c2: '#0C4077' },
  GHA: { name: 'Ghana',        code: 'GHA', c1: '#CE1126', c2: '#FCD116' },
  WAL: { name: 'Wales',        code: 'WAL', c1: '#C8102E', c2: '#00843D' },
  TUN: { name: 'Tunisia',      code: 'TUN', c1: '#E70013', c2: '#FFFFFF' },
  CRC: { name: 'Costa Rica',   code: 'CRC', c1: '#002B7F', c2: '#CE1126' },
  SCO: { name: 'Scotland',     code: 'SCO', c1: '#0065BF', c2: '#FFFFFF' },
};

Object.assign(window, { T, TOKENS, TEAMS });
