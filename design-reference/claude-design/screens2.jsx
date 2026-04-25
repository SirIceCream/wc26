// Screens part 2: Group predictions, Matchday predictions, Match modal, Leaderboard,
// Fixtures, My picks, Profile, Admin

// ═══════════════════════════ 4. GROUP-STAGE PREDICTIONS ═══════════════════════════
function GroupPredictScreen() {
  const [group, setGroup] = React.useState('A');
  const groupKeys = Object.keys(GROUPS);
  const teams = GROUPS[group];
  const table = STANDINGS[group] || STANDINGS.A;

  // Generate 6 matches per group (round-robin)
  const fixtures = [
    { home: teams[0], away: teams[1], md: 1, status: 'done', score: { h: 2, a: 1 }, prediction: { h: 2, a: 1 }, points: 3 },
    { home: teams[2], away: teams[3], md: 1, status: 'done', score: { h: 0, a: 0 }, prediction: { h: 1, a: 0 }, points: 0 },
    { home: teams[0], away: teams[2], md: 2, status: 'done', score: { h: 3, a: 0 }, prediction: { h: 2, a: 0 }, points: 0 },
    { home: teams[3], away: teams[1], md: 2, status: 'done', score: { h: 0, a: 2 }, prediction: { h: 0, a: 1 }, points: 0 },
    { home: teams[3], away: teams[0], md: 3, status: 'open', time: 'Jun 24 · 13:00', prediction: { h: 0, a: 2 }, deadline: 'Locks in 2d 4h' },
    { home: teams[1], away: teams[2], md: 3, status: 'open', time: 'Jun 24 · 16:00', prediction: null, deadline: 'Locks in 2d 7h' },
  ];

  return (
    <ScreenBg>
      <ScreenHeader kicker="Group stage" title="Predict" />

      {/* Group chips scroller */}
      <div style={{
        padding: '0 20px 12px', overflowX: 'auto',
        display: 'flex', gap: 6, scrollbarWidth: 'none',
      }}>
        {groupKeys.map(k => {
          const active = k === group;
          return (
            <button key={k} onClick={() => setGroup(k)} style={{
              flexShrink: 0, padding: '8px 14px',
              background: active ? T.ink : T.surface,
              color: active ? '#fff' : T.ink,
              border: `1px solid ${active ? T.ink : T.line}`,
              borderRadius: T.r.pill,
              fontFamily: T.display, fontSize: 13, fontWeight: 700,
              letterSpacing: -0.1, cursor: 'pointer',
            }}>Group {k}</button>
          );
        })}
      </div>

      <ScreenScroll>
        {/* Standings mini table */}
        <div style={{ padding: '4px 20px 0' }}>
          <Card pad={0}>
            <div style={{
              padding: '10px 14px',
              display: 'grid',
              gridTemplateColumns: '1fr 22px 22px 22px 38px 34px',
              gap: 6, fontSize: 10, fontWeight: 700,
              color: T.ink3, letterSpacing: 0.5, textTransform: 'uppercase',
              borderBottom: `1px solid ${T.lineSoft}`,
            }}>
              <div>Team</div>
              <div style={{ textAlign: 'center' }}>W</div>
              <div style={{ textAlign: 'center' }}>D</div>
              <div style={{ textAlign: 'center' }}>L</div>
              <div style={{ textAlign: 'center' }}>GD</div>
              <div style={{ textAlign: 'right' }}>Pts</div>
            </div>
            {table.map((r, i) => (
              <div key={r.code} style={{
                padding: '10px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 22px 22px 22px 38px 34px',
                gap: 6, alignItems: 'center',
                background: i < 2 ? T.accent + '18' : 'transparent',
                borderBottom: i < table.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                fontFamily: T.display, fontSize: 13,
                fontFeatureSettings: '"tnum" 1',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: T.ink3, width: 10,
                  }}>{i + 1}</span>
                  <TeamDisc code={r.code} size={20} />
                  <span style={{ fontWeight: 600, color: T.ink }}>{TEAMS[r.code]?.name || r.code}</span>
                </div>
                <div style={{ textAlign: 'center', color: T.ink2 }}>{r.w}</div>
                <div style={{ textAlign: 'center', color: T.ink2 }}>{r.d}</div>
                <div style={{ textAlign: 'center', color: T.ink2 }}>{r.l}</div>
                <div style={{ textAlign: 'center', color: T.ink2 }}>{r.gf - r.ga >= 0 ? '+' : ''}{r.gf - r.ga}</div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: T.ink }}>{r.pts}</div>
              </div>
            ))}
          </Card>
        </div>

        {/* Matches grouped by matchday */}
        {[1, 2, 3].map(md => {
          const matches = fixtures.filter(f => f.md === md);
          return (
            <div key={md}>
              <SectionTitle>Matchday {md}</SectionTitle>
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.map((m, i) => <PredictMatchCard key={i} match={m} />)}
              </div>
            </div>
          );
        })}
      </ScreenScroll>
      <BottomNav active="predict" />
    </ScreenBg>
  );
}

function PredictMatchCard({ match, compact }) {
  const { home, away, status, score, prediction, points, time, deadline } = match;
  const locked = status === 'done' || status === 'live';
  const hasGuess = prediction != null;
  const correct = points > 0;

  return (
    <Card pad={0} elevated>
      {/* Top meta row */}
      <div style={{
        padding: '9px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${T.lineSoft}`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.ink3 }}>
          {time || match.stage}
        </div>
        {status === 'done' && <StatusChip kind={correct ? 'hit' : 'miss'} label={correct ? `+${points}` : 'Miss'} />}
        {status === 'live' && <StatusChip kind="live" />}
        {status === 'open' && <StatusChip kind={hasGuess ? 'open' : 'open'} label={hasGuess ? 'Saved' : 'Open'} />}
      </div>

      {/* Teams + score */}
      <div style={{
        padding: '14px 14px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 14,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          <TeamDisc code={home} size={38} />
          <div style={{ fontFamily: T.display, fontSize: 12, fontWeight: 700, color: T.ink, letterSpacing: -0.1 }}>{TEAMS[home]?.code}</div>
        </div>

        {/* Center — score or prediction input */}
        <div style={{ minWidth: 120, textAlign: 'center' }}>
          {locked ? (
            <>
              <ScoreDisplay h={score.h} a={score.a} size={30} />
              {prediction && (
                <div style={{
                  marginTop: 6,
                  fontFamily: T.display, fontSize: 11, fontWeight: 600,
                  color: T.ink3, letterSpacing: -0.1,
                }}>
                  You: {prediction.h}–{prediction.a}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <MiniScoreInput value={prediction?.h ?? null} />
                <div style={{
                  fontFamily: T.display, fontSize: 18, fontWeight: 700, color: T.ink4,
                }}>:</div>
                <MiniScoreInput value={prediction?.a ?? null} />
              </div>
              {deadline && (
                <div style={{
                  marginTop: 6, fontSize: 10, fontWeight: 600,
                  color: T.warn, letterSpacing: -0.1,
                }}>{deadline}</div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          <TeamDisc code={away} size={38} />
          <div style={{ fontFamily: T.display, fontSize: 12, fontWeight: 700, color: T.ink, letterSpacing: -0.1 }}>{TEAMS[away]?.code}</div>
        </div>
      </div>
    </Card>
  );
}

function MiniScoreInput({ value }) {
  return (
    <div style={{
      width: 42, height: 42, borderRadius: T.r.md,
      background: value != null ? T.ink : T.surfaceAlt,
      color: value != null ? '#fff' : T.ink4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.display, fontSize: 22, fontWeight: 800,
      letterSpacing: -0.5, fontFeatureSettings: '"tnum" 1',
      border: value != null ? 'none' : `1.5px dashed ${T.line}`,
      cursor: 'pointer',
    }}>{value != null ? value : '–'}</div>
  );
}

// ═══════════════════════════ 5. MATCHDAY PREDICTIONS ═══════════════════════════
function MatchdayScreen() {
  const [tab, setTab] = React.useState('today');

  return (
    <ScreenBg>
      <ScreenHeader kicker="Matchday 9 · Jun 21" title="Today's picks" right={
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}>
          <span style={{ fontSize: 10, color: T.ink3, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Next lock</span>
          <span style={{
            fontFamily: T.display, fontSize: 15, fontWeight: 800,
            color: T.primary, letterSpacing: -0.3,
            fontFeatureSettings: '"tnum" 1',
          }}>02:14:36</span>
        </div>
      } />

      {/* Day picker */}
      <div style={{
        padding: '0 20px 10px', display: 'flex', gap: 6, overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {[
          { k: 'y', label: 'Yest', date: '20', done: true },
          { k: 'today', label: 'Today', date: '21', active: true, count: 3 },
          { k: 't', label: 'Tom', date: '22', count: 3 },
          { k: '23', label: 'Mon', date: '23', count: 3 },
          { k: '24', label: 'Tue', date: '24', count: 3 },
          { k: '25', label: 'Wed', date: '25', count: 2 },
        ].map(d => (
          <button key={d.k} style={{
            flexShrink: 0, minWidth: 56, padding: '8px 10px',
            background: d.active ? T.ink : T.surface,
            color: d.active ? '#fff' : T.ink,
            border: `1px solid ${d.active ? T.ink : T.line}`,
            borderRadius: T.r.md,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.label}</span>
            <span style={{ fontFamily: T.display, fontSize: 17, fontWeight: 800, letterSpacing: -0.4 }}>{d.date}</span>
            {d.count && <span style={{
              fontSize: 9, fontWeight: 700,
              background: d.active ? T.accent : T.surfaceAlt,
              color: d.active ? T.accentInk : T.ink3,
              padding: '1px 5px', borderRadius: T.r.pill,
              marginTop: 2,
            }}>{d.count} GAMES</span>}
          </button>
        ))}
      </div>

      <ScreenScroll>
        {/* Live pill */}
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{
            background: T.live2, border: `1px solid ${T.live}33`,
            borderRadius: T.r.md, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: T.live,
              boxShadow: `0 0 0 4px ${T.live}22`,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.live, letterSpacing: 0.5, textTransform: 'uppercase' }}>Playing now · 67'</div>
              <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: T.ink }}>USA 1–0 WAL · your pick 2–0</div>
            </div>
          </div>
        </div>

        {/* Full match cards with stepper */}
        <SectionTitle>Your predictions</SectionTitle>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigPredictCard match={TODAY_MATCHES[1]} prediction={{ h: 2, a: 1 }} saved />
          <BigPredictCard match={TODAY_MATCHES[2]} prediction={null} />
        </div>
      </ScreenScroll>

      {/* Sticky action */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 84, zIndex: 15,
        padding: '12px 20px',
        background: `linear-gradient(180deg, transparent, ${T.bg} 40%)`,
      }}>
        <button style={{
          width: '100%', padding: '14px',
          background: T.primary, color: '#fff', border: 'none',
          borderRadius: T.r.md, boxShadow: T.sh2,
          fontFamily: T.display, fontSize: 15, fontWeight: 700,
          letterSpacing: -0.1, cursor: 'pointer',
        }}>Save all predictions</button>
      </div>

      <BottomNav active="predict" />
    </ScreenBg>
  );
}

function BigPredictCard({ match, prediction, saved }) {
  const [h, setH] = React.useState(prediction?.h ?? null);
  const [a, setA] = React.useState(prediction?.a ?? null);
  const complete = h != null && a != null;

  return (
    <Card pad={0} elevated>
      <div style={{
        padding: '10px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${T.lineSoft}`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink3 }}>
          {match.time} · {match.stage}
        </div>
        {saved ? <StatusChip kind="open" label="Saved ✓" /> : complete ? <StatusChip kind="open" label="Ready" /> : <StatusChip kind="upcoming" label="Open" />}
      </div>

      <div style={{ padding: '16px 14px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: 10, alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <TeamDisc code={match.home} size={44} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: -0.1 }}>{TEAMS[match.home]?.name}</div>
              <div style={{ fontSize: 10, color: T.ink3, fontWeight: 600, marginTop: 1 }}>{TEAMS[match.home]?.code}</div>
            </div>
          </div>
          <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 700, color: T.ink4 }}>vs</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <TeamDisc code={match.away} size={44} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: -0.1 }}>{TEAMS[match.away]?.name}</div>
              <div style={{ fontSize: 10, color: T.ink3, fontWeight: 600, marginTop: 1 }}>{TEAMS[match.away]?.code}</div>
            </div>
          </div>
        </div>

        {/* Prediction controls */}
        <div style={{
          marginTop: 16, padding: 12,
          background: T.surfaceAlt, borderRadius: T.r.md,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        }}>
          <Stepper value={h} onChange={setH} accent />
          <div style={{
            fontFamily: T.display, fontSize: 22, fontWeight: 700, color: T.ink4,
          }}>:</div>
          <Stepper value={a} onChange={setA} accent />
        </div>

        {/* Deadline */}
        <div style={{
          marginTop: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 11, color: T.ink3, fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="14" rx="2" stroke={T.ink3} strokeWidth="2"/><path d="M8 2v4M16 2v4M4 10h16" stroke={T.ink3} strokeWidth="2" strokeLinecap="round"/></svg>
            <span>Locks {match.kickoff || 'at kickoff'}</span>
          </div>
          {complete && <span style={{ color: T.primary, fontWeight: 700 }}>Exact 3 pts</span>}
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════ 6. SINGLE MATCH DRAWER ═══════════════════════════
function MatchDrawerScreen() {
  const [h, setH] = React.useState(2);
  const [a, setA] = React.useState(1);

  return (
    <ScreenBg bg="rgba(0,0,0,0.5)">
      {/* Faded background content */}
      <div style={{
        position: 'absolute', inset: 0,
        background: T.bg, opacity: 0.25, pointerEvents: 'none',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingBottom: 40, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
      }}>
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: T.line, borderRadius: 2 }} />
        </div>

        {/* Meta */}
        <div style={{
          padding: '10px 20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: 1, textTransform: 'uppercase' }}>Group D · Matchday 3</div>
            <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: T.ink, letterSpacing: -0.3, marginTop: 2 }}>Today · 16:00 ET</div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: T.surface, border: `1px solid ${T.line}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        </div>

        {/* Teams hero */}
        <div style={{
          padding: '24px 20px 16px',
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10,
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <TeamDisc code="ARG" size={64} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: -0.3 }}>Argentina</div>
              <div style={{ fontSize: 11, color: T.ink3, fontWeight: 600, marginTop: 2 }}>P2 · W2 · 1st</div>
            </div>
          </div>
          <div style={{
            fontFamily: T.display, fontSize: 14, fontWeight: 700,
            color: T.ink4, padding: '4px 10px',
            background: T.surfaceAlt, borderRadius: T.r.pill,
          }}>VS</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <TeamDisc code="KOR" size={64} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: -0.3 }}>South Korea</div>
              <div style={{ fontSize: 11, color: T.ink3, fontWeight: 600, marginTop: 2 }}>P2 · D1 L1 · 3rd</div>
            </div>
          </div>
        </div>

        {/* Your prediction header */}
        <div style={{
          padding: '0 20px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: T.ink3, letterSpacing: 0.5, textTransform: 'uppercase' }}>Your prediction</div>
          <Countdown text="02:14:36" label="Until lock" compact />
        </div>

        {/* Stepper bar */}
        <div style={{
          margin: '0 20px 14px',
          padding: '20px 14px',
          background: T.surface, borderRadius: T.r.lg,
          border: `1px solid ${T.line}`,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          boxShadow: T.sh1,
        }}>
          <Stepper value={h} onChange={setH} accent />
          <div style={{
            fontFamily: T.display, fontSize: 28, fontWeight: 700, color: T.ink4,
            letterSpacing: -1,
          }}>:</div>
          <Stepper value={a} onChange={setA} accent />
        </div>

        {/* Quick presets */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Quick picks</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['2-0', '2-1', '3-1', '1-1', '1-0', '3-0'].map(s => (
              <button key={s} style={{
                padding: '7px 12px',
                background: s === `${h}-${a}` ? T.ink : T.surface,
                color: s === `${h}-${a}` ? '#fff' : T.ink,
                border: `1px solid ${s === `${h}-${a}` ? T.ink : T.line}`,
                borderRadius: T.r.pill,
                fontFamily: T.display, fontSize: 13, fontWeight: 700,
                letterSpacing: -0.1, cursor: 'pointer',
                fontFeatureSettings: '"tnum" 1',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Group pick % */}
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{
            background: T.surface, borderRadius: T.r.md,
            padding: '12px 14px', border: `1px solid ${T.line}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.ink3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Friends are leaning…</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'ARG win', pct: 70 },
                { label: 'Draw', pct: 18 },
                { label: 'KOR win', pct: 12 },
              ].map(b => (
                <div key={b.label}>
                  <div style={{ fontFamily: T.display, fontWeight: 800, fontSize: 20, letterSpacing: -0.5, color: T.ink }}>{b.pct}%</div>
                  <div style={{ fontSize: 11, color: T.ink3, fontWeight: 600 }}>{b.label}</div>
                  <div style={{
                    height: 3, background: T.lineSoft, borderRadius: 2, marginTop: 4,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${b.pct}%`, background: T.primary,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px', display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1, padding: '14px',
            background: T.surface, color: T.ink,
            border: `1px solid ${T.line}`, borderRadius: T.r.md,
            fontFamily: T.display, fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}>Clear</button>
          <button style={{
            flex: 2, padding: '14px',
            background: T.primary, color: '#fff', border: 'none',
            borderRadius: T.r.md, boxShadow: T.sh2,
            fontFamily: T.display, fontSize: 14, fontWeight: 700,
            letterSpacing: -0.1, cursor: 'pointer',
          }}>Save 2–1 pick</button>
        </div>
      </div>
    </ScreenBg>
  );
}

Object.assign(window, {
  GroupPredictScreen, PredictMatchCard, MiniScoreInput,
  MatchdayScreen, BigPredictCard, MatchDrawerScreen,
});
