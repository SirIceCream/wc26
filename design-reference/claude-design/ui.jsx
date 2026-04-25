// UI primitives — World Cup 26 predictor
// Requires tokens.jsx to have loaded T, TEAMS globally.

// ─────────────────────────── Team disc (original flag alternative) ───────────────────────────
function TeamDisc({ code, size = 28 }) {
  const team = TEAMS[code] || { c1: '#ccc', c2: '#999', code };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      background: team.c1,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${team.c1} 50%, ${team.c2} 50%)`,
      }} />
    </div>
  );
}

function TeamLine({ code, size = 28, weight = 600, inkColor, reverse = false }) {
  const team = TEAMS[code];
  const name = team?.name || code;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      flexDirection: reverse ? 'row-reverse' : 'row',
    }}>
      <TeamDisc code={code} size={size} />
      <div style={{
        fontFamily: T.display, fontWeight: weight, fontSize: size > 30 ? 18 : 15,
        letterSpacing: -0.2, color: inkColor || T.ink,
        textAlign: reverse ? 'right' : 'left',
        lineHeight: 1.15,
      }}>
        <div>{name}</div>
      </div>
    </div>
  );
}

// ─────────────────────────── Score pill — numeric display ───────────────────────────
function ScoreDisplay({ h, a, size = 36, dim = false, winner }) {
  const baseStyle = {
    fontFamily: T.display,
    fontWeight: 700,
    fontSize: size,
    lineHeight: 1,
    fontFeatureSettings: '"tnum" 1',
    letterSpacing: -1.2,
    color: dim ? T.ink3 : T.ink,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.25 }}>
      <span style={{ ...baseStyle, color: winner === 'h' ? T.ink : (dim ? T.ink3 : T.ink) }}>{h}</span>
      <span style={{ ...baseStyle, color: T.ink4, fontWeight: 500, fontSize: size * 0.7 }}>·</span>
      <span style={{ ...baseStyle, color: winner === 'a' ? T.ink : (dim ? T.ink3 : T.ink) }}>{a}</span>
    </div>
  );
}

// ─────────────────────────── Status chip ───────────────────────────
function StatusChip({ kind = 'upcoming', label }) {
  const map = {
    upcoming: { bg: T.surfaceAlt, fg: T.ink2, dot: T.ink3, text: label || 'Upcoming' },
    live:     { bg: T.live2, fg: T.live, dot: T.live, text: label || 'LIVE', pulse: true },
    done:     { bg: T.lineSoft, fg: T.ink3, dot: T.ink4, text: label || 'FT' },
    locked:   { bg: '#FEF3C7', fg: '#92400E', dot: '#D97706', text: label || 'Locked' },
    open:     { bg: T.accent + '40', fg: T.accentInk, dot: T.accent, text: label || 'Open' },
    hit:      { bg: T.accent, fg: T.accentInk, dot: T.accentInk, text: label || 'Exact' },
    miss:     { bg: T.lineSoft, fg: T.ink3, dot: T.ink4, text: label || 'Miss' },
    jackpot:  { bg: T.primary, fg: '#fff', dot: T.accent, text: label || 'JACKPOT' },
  };
  const s = map[kind];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.fg,
      padding: '3px 8px', borderRadius: T.r.pill,
      fontFamily: T.display, fontSize: 11, fontWeight: 600,
      letterSpacing: 0.4, textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: s.dot,
        boxShadow: s.pulse ? `0 0 0 3px ${T.live}30` : 'none',
      }} />
      {s.text}
    </div>
  );
}

// ─────────────────────────── Deadline countdown ───────────────────────────
function Countdown({ text = '02:14:36', label = 'Until lock', compact }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 6,
      fontFamily: T.display,
    }}>
      <span style={{
        fontWeight: 700, fontSize: compact ? 13 : 15, letterSpacing: -0.2,
        fontFeatureSettings: '"tnum" 1', color: T.ink,
      }}>{text}</span>
      <span style={{
        fontSize: 10, color: T.ink3, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>{label}</span>
    </div>
  );
}

// ─────────────────────────── Stepper (score input) ───────────────────────────
function Stepper({ value, onChange, dim, accent }) {
  const btn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: 32, height: 32, borderRadius: T.r.pill,
      border: `1px solid ${T.line}`,
      background: disabled ? T.lineSoft : T.surface,
      color: disabled ? T.ink4 : T.ink,
      fontSize: 18, fontWeight: 500, lineHeight: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      fontFamily: T.display,
      transition: 'all 0.12s',
    }}>{label}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {btn('−', () => onChange && onChange(Math.max(0, (value ?? 0) - 1)), (value ?? 0) <= 0)}
      <div style={{
        minWidth: 44, textAlign: 'center',
        fontFamily: T.display, fontWeight: 700, fontSize: 28,
        color: value == null ? T.ink4 : (accent ? T.primary : T.ink),
        letterSpacing: -1, fontFeatureSettings: '"tnum" 1',
      }}>{value == null ? '–' : value}</div>
      {btn('+', () => onChange && onChange((value ?? -1) + 1))}
    </div>
  );
}

// ─────────────────────────── Card shell ───────────────────────────
function Card({ children, pad = 16, style, onClick, elevated }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface, borderRadius: T.r.lg,
      border: `1px solid ${T.line}`,
      boxShadow: elevated ? T.sh2 : T.sh1,
      padding: pad, cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

// ─────────────────────────── Segmented control ───────────────────────────
function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', padding: 3, background: T.surfaceAlt,
      borderRadius: T.r.pill, gap: 2,
    }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange && onChange(o.value)} style={{
            flex: 1, padding: '7px 12px',
            background: active ? T.surface : 'transparent',
            color: active ? T.ink : T.ink3,
            border: 'none', borderRadius: T.r.pill,
            fontFamily: T.display, fontSize: 13, fontWeight: 600,
            letterSpacing: -0.1, cursor: 'pointer',
            boxShadow: active ? T.sh1 : 'none',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────── Bottom nav ───────────────────────────
function BottomNav({ active = 'home', onChange }) {
  const items = [
    { k: 'home', label: 'Home', icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>
    )},
    { k: 'predict', label: 'Predict', icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/><path d="M12 7v5l3 2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
    )},
    { k: 'fixtures', label: 'Fixtures', icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
    )},
    { k: 'board', label: 'Ranking', icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 20V11M12 20V4M19 20v-6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
    )},
    { k: 'me', label: 'Me', icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>
    )},
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 8,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `1px solid ${T.line}`,
      zIndex: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {items.map(i => {
          const isActive = active === i.k;
          const c = isActive ? T.primary : T.ink3;
          return (
            <button key={i.k} onClick={() => onChange && onChange(i.k)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 10px', minWidth: 48,
            }}>
              {i.icon(c)}
              <span style={{
                fontFamily: T.display, fontSize: 10.5, fontWeight: 600,
                color: c, letterSpacing: -0.05,
              }}>{i.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────── Avatar ───────────────────────────
function Avatar({ name = 'You', size = 32, color }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = color || `hsl(${(name.charCodeAt(0) * 47) % 360}, 55%, 55%)`;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: hue, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.display, fontWeight: 700, fontSize: size * 0.38,
      letterSpacing: -0.2, flexShrink: 0,
    }}>{initials}</div>
  );
}

// ─────────────────────────── Points chip ───────────────────────────
function PointsChip({ value, big }) {
  const pos = value > 0;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 3,
      fontFamily: T.display,
      color: pos ? T.accentInk : T.ink3,
      background: pos ? T.accent : T.lineSoft,
      padding: big ? '5px 12px' : '2px 8px',
      borderRadius: T.r.pill,
    }}>
      <span style={{
        fontSize: big ? 20 : 13, fontWeight: 700,
        letterSpacing: -0.3, fontFeatureSettings: '"tnum" 1',
        lineHeight: 1,
      }}>{pos ? '+' : ''}{value}</span>
      <span style={{ fontSize: big ? 11 : 10, fontWeight: 600, letterSpacing: 0.3 }}>PTS</span>
    </div>
  );
}

// ─────────────────────────── Match row (compact) ───────────────────────────
function MatchRow({ match, onClick, showPrediction, showResult }) {
  const { home, away, time, status, score, prediction, points, stage } = match;
  const locked = status === 'live' || status === 'done' || status === 'locked';

  return (
    <div onClick={onClick} style={{
      display: 'grid',
      gridTemplateColumns: '52px 1fr auto',
      alignItems: 'center', gap: 12,
      padding: '14px 16px',
      background: T.surface,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{
        fontFamily: T.display, fontSize: 11, fontWeight: 600,
        color: T.ink3, letterSpacing: 0.3,
      }}>
        <div style={{ color: T.ink, fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }}>{time}</div>
        <div>{stage || ''}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <TeamLine code={home} size={22} weight={status === 'done' && score && score.h > score.a ? 700 : 600} />
        <TeamLine code={away} size={22} weight={status === 'done' && score && score.a > score.h ? 700 : 600} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 56 }}>
        {status === 'done' || status === 'live' ? (
          <div style={{
            fontFamily: T.display, fontWeight: 800, fontSize: 22,
            letterSpacing: -0.8, lineHeight: 1,
            color: status === 'live' ? T.live : T.ink,
            fontFeatureSettings: '"tnum" 1',
          }}>
            <span>{score?.h ?? 0}</span>
            <span style={{ color: T.ink4, margin: '0 3px' }}>·</span>
            <span>{score?.a ?? 0}</span>
          </div>
        ) : (
          <StatusChip kind="upcoming" label={match.kickoff || 'Kick-off'} />
        )}
        {showPrediction && prediction && (
          <div style={{
            fontFamily: T.display, fontSize: 11, fontWeight: 600,
            color: T.ink3, letterSpacing: -0.1,
          }}>
            You: <span style={{ color: T.ink }}>{prediction.h}–{prediction.a}</span>
          </div>
        )}
        {showResult && points != null && <PointsChip value={points} />}
      </div>
    </div>
  );
}

Object.assign(window, {
  TeamDisc, TeamLine, ScoreDisplay, StatusChip, Countdown, Stepper,
  Card, Segmented, BottomNav, Avatar, PointsChip, MatchRow,
});
