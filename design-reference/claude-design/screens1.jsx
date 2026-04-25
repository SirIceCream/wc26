// Screens part 1: Home, Login, Tournament, Group-stage, Matchday, Match modal

// ─────────────────────────── Shared frame helpers ───────────────────────────
function ScreenBg({ children, bg }) {
  return (
    <div style={{
      height: '100%', background: bg || T.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: T.body, color: T.ink,
    }}>{children}</div>
  );
}

function ScreenHeader({ title, kicker, right, sticky }) {
  return (
    <div style={{
      padding: '62px 20px 12px', position: sticky ? 'sticky' : 'static',
      top: 0, background: T.bg, zIndex: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {kicker && (
            <div style={{
              fontFamily: T.display, fontSize: 11, fontWeight: 700,
              color: T.primary, letterSpacing: 1.2, textTransform: 'uppercase',
              marginBottom: 2,
            }}>{kicker}</div>
          )}
          <div style={{
            fontFamily: T.display, fontSize: 28, fontWeight: 800,
            letterSpacing: -0.8, color: T.ink, lineHeight: 1.05,
          }}>{title}</div>
        </div>
        {right}
      </div>
    </div>
  );
}

function ScreenScroll({ children, pb = 90 }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', paddingBottom: pb,
    }}>{children}</div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '18px 20px 10px',
    }}>
      <div style={{
        fontFamily: T.display, fontSize: 12, fontWeight: 700,
        letterSpacing: 0.8, color: T.ink3, textTransform: 'uppercase',
      }}>{children}</div>
      {action && (
        <div style={{
          fontFamily: T.display, fontSize: 12, fontWeight: 600,
          color: T.primary, cursor: 'pointer',
        }}>{action}</div>
      )}
    </div>
  );
}

// ═══════════════════════════ 1. HOME DASHBOARD ═══════════════════════════
function HomeScreen() {
  return (
    <ScreenBg>
      {/* Big hero header — tournament branding */}
      <div style={{
        padding: '58px 20px 20px',
        background: `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryInk} 100%)`,
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative numerals */}
        <div style={{
          position: 'absolute', right: -20, top: 40,
          fontFamily: T.display, fontSize: 180, fontWeight: 900,
          color: 'rgba(255,255,255,0.06)', letterSpacing: -8,
          lineHeight: 0.8, pointerEvents: 'none',
        }}>26</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{
              fontFamily: T.display, fontSize: 11, fontWeight: 700,
              letterSpacing: 1.4, opacity: 0.7, textTransform: 'uppercase',
            }}>The Usual Suspects · WC26</div>
            <div style={{
              fontFamily: T.display, fontSize: 22, fontWeight: 700,
              letterSpacing: -0.5, marginTop: 2,
            }}>Hey Alex 👋</div>
          </div>
          <Avatar name="Alex" size={40} color="rgba(255,255,255,0.2)" />
        </div>

        {/* Stage + deadline pill */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'stretch',
          marginTop: 16,
        }}>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.12)',
            borderRadius: T.r.md, padding: '10px 12px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Stage</div>
            <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Group · MD 3</div>
          </div>
          <div style={{
            flex: 1.3, background: T.accent,
            borderRadius: T.r.md, padding: '10px 12px',
            color: T.accentInk,
          }}>
            <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Next lock</div>
            <div style={{
              fontFamily: T.display, fontSize: 15, fontWeight: 800, marginTop: 2,
              fontFeatureSettings: '"tnum" 1',
            }}>02:14:36 · ARG–KOR</div>
          </div>
        </div>
      </div>

      <ScreenScroll>
        {/* Your rank card */}
        <div style={{ padding: '16px 20px 0' }}>
          <Card pad={0} elevated>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: T.r.md,
                background: T.surfaceAlt,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.ink3, letterSpacing: 0.5 }}>RANK</div>
                <div style={{
                  fontFamily: T.display, fontSize: 26, fontWeight: 800,
                  color: T.ink, letterSpacing: -0.8, lineHeight: 1,
                }}>4<span style={{ fontSize: 14, color: T.ink3 }}>/10</span></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.ink3, fontWeight: 600 }}>Your points</div>
                <div style={{
                  fontFamily: T.display, fontSize: 32, fontWeight: 800,
                  color: T.ink, letterSpacing: -1, lineHeight: 1,
                  fontFeatureSettings: '"tnum" 1',
                }}>12</div>
                <div style={{ fontSize: 11, color: T.ink3, marginTop: 4 }}>
                  3 behind Tomás · 3 ahead of Léa
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={T.ink3} strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            {/* progress bar */}
            <div style={{ height: 4, background: T.lineSoft, position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '25%', background: T.primary,
              }} />
            </div>
          </Card>
        </div>

        {/* Open picks CTA */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{
            background: T.ink, color: '#fff', borderRadius: T.r.lg,
            padding: 16, display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', boxShadow: T.sh2,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: T.r.pill,
              background: T.accent, color: T.accentInk,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.display, fontSize: 20, fontWeight: 800,
            }}>3</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 15, letterSpacing: -0.2 }}>
                Open picks today
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                ARG·KOR, FRA·DEN, ENG·URU
              </div>
            </div>
            <div style={{
              background: T.accent, color: T.accentInk,
              padding: '8px 14px', borderRadius: T.r.pill,
              fontFamily: T.display, fontSize: 13, fontWeight: 700,
            }}>Predict →</div>
          </div>
        </div>

        {/* Today's fixtures */}
        <SectionTitle action="See all">Today's fixtures</SectionTitle>
        <div style={{ padding: '0 20px' }}>
          <Card pad={0}>
            {TODAY_MATCHES.map((m, i) => (
              <div key={m.id} style={{
                borderBottom: i < TODAY_MATCHES.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
              }}>
                <MatchRow match={m} showPrediction />
              </div>
            ))}
          </Card>
        </div>

        {/* Friends leaderboard preview */}
        <SectionTitle action="Full ranking">Friends leaderboard</SectionTitle>
        <div style={{ padding: '0 20px' }}>
          <Card pad={0}>
            {LEADERBOARD.slice(0, 5).map((row, i) => (
              <MiniLBRow key={row.name} row={row} isLast={i === 4} />
            ))}
          </Card>
        </div>

        {/* Recent result */}
        <SectionTitle>Recent results</SectionTitle>
        <div style={{ padding: '0 20px' }}>
          <Card pad={0}>
            {RESULTS.slice(0, 2).map((m, i) => (
              <div key={m.id} style={{
                borderBottom: i < 1 ? `1px solid ${T.lineSoft}` : 'none',
              }}>
                <MatchRow match={m} showPrediction showResult />
              </div>
            ))}
          </Card>
        </div>
      </ScreenScroll>
      <BottomNav active="home" />
    </ScreenBg>
  );
}

function MiniLBRow({ row, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: row.isMe ? T.primary + '0F' : 'transparent',
      borderBottom: isLast ? 'none' : `1px solid ${T.lineSoft}`,
    }}>
      <div style={{
        width: 24, textAlign: 'center',
        fontFamily: T.display, fontWeight: 700, fontSize: 13,
        color: row.rank <= 3 ? T.primary : T.ink3,
        fontFeatureSettings: '"tnum" 1',
      }}>{row.rank}</div>
      <Avatar name={row.name} size={30} />
      <div style={{ flex: 1, fontSize: 14, fontWeight: row.isMe ? 700 : 500, color: T.ink }}>
        {row.name}
      </div>
      <div style={{
        fontFamily: T.display, fontWeight: 800, fontSize: 18,
        color: T.ink, letterSpacing: -0.5, fontFeatureSettings: '"tnum" 1',
      }}>{row.pts}</div>
    </div>
  );
}

// ═══════════════════════════ 2. LOGIN / JOIN GROUP ═══════════════════════════
function LoginScreen() {
  return (
    <ScreenBg bg={T.ink}>
      {/* Hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '80px 24px 24px',
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 20% 30%, ${T.primary}55, transparent 60%),
                       radial-gradient(circle at 80% 80%, ${T.accent}22, transparent 50%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            fontFamily: T.display, fontSize: 11, fontWeight: 700,
            letterSpacing: 2, color: T.accent, textTransform: 'uppercase',
          }}>Canada · Mexico · USA</div>
          <div style={{
            fontFamily: T.display, fontSize: 56, fontWeight: 900,
            letterSpacing: -2.5, lineHeight: 0.95, marginTop: 10,
          }}>
            World Cup<br/>'26 Predict.
          </div>
          <div style={{
            marginTop: 14, fontSize: 15, opacity: 0.7,
            lineHeight: 1.45, maxWidth: 280,
          }}>
            Private league for you and your friends. Exact score only. Winner takes all.
          </div>
        </div>
      </div>

      {/* Sheet */}
      <div style={{
        background: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '28px 24px 40px', position: 'relative',
      }}>
        <div style={{
          fontFamily: T.display, fontSize: 18, fontWeight: 700,
          color: T.ink, letterSpacing: -0.3, marginBottom: 16,
        }}>Join your group</div>

        <div style={{
          background: T.surface, border: `1px solid ${T.line}`,
          borderRadius: T.r.md, padding: '14px 16px', marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: 0.8, textTransform: 'uppercase' }}>Group invite code</div>
          <div style={{
            fontFamily: T.mono, fontSize: 22, fontWeight: 700,
            color: T.ink, letterSpacing: 2, marginTop: 2,
          }}>USUAL-2026</div>
        </div>

        <button style={{
          width: '100%', padding: '16px',
          background: T.primary, color: '#fff', border: 'none',
          borderRadius: T.r.md,
          fontFamily: T.display, fontSize: 15, fontWeight: 700,
          letterSpacing: -0.1, cursor: 'pointer',
          boxShadow: T.sh2,
        }}>
          Join as Alex
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '18px 0 14px',
        }}>
          <div style={{ flex: 1, height: 1, background: T.line }} />
          <span style={{ fontSize: 11, color: T.ink3, fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>

        <button style={{
          width: '100%', padding: '14px',
          background: T.surface, color: T.ink,
          border: `1px solid ${T.line}`, borderRadius: T.r.md,
          fontFamily: T.display, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', marginBottom: 8,
        }}>
           Continue with Apple
        </button>
        <button style={{
          width: '100%', padding: '14px',
          background: T.surface, color: T.ink,
          border: `1px solid ${T.line}`, borderRadius: T.r.md,
          fontFamily: T.display, fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
        }}>
          Enter different code
        </button>
      </div>
    </ScreenBg>
  );
}

// ═══════════════════════════ 3. TOURNAMENT OVERVIEW ═══════════════════════════
function TournamentScreen() {
  return (
    <ScreenBg>
      <ScreenHeader kicker="Tournament" title="WC 2026" right={
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: T.surface,
          borderRadius: T.r.pill, border: `1px solid ${T.line}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
          <span style={{ fontFamily: T.display, fontSize: 12, fontWeight: 600, color: T.ink }}>Day 8</span>
        </div>
      } />

      <ScreenScroll>
        {/* Timeline */}
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{
            background: T.surface, borderRadius: T.r.lg,
            border: `1px solid ${T.line}`, padding: 16, boxShadow: T.sh1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: T.ink3, fontWeight: 600 }}>Jun 11 — Jul 19</span>
              <span style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: T.primary }}>28% done</span>
            </div>
            {/* Stage bar */}
            <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
              {[
                { label: 'Group', w: 40, active: true, done: 0.5 },
                { label: 'R32', w: 14 },
                { label: 'R16', w: 14 },
                { label: 'QF', w: 10 },
                { label: 'SF', w: 8 },
                { label: 'F', w: 6 },
              ].map((s, i) => (
                <div key={i} style={{ flex: s.w, minWidth: 0 }}>
                  <div style={{
                    height: 8, borderRadius: 2,
                    background: s.active ? T.surfaceAlt : T.lineSoft,
                    position: 'relative', overflow: 'hidden',
                    border: s.active ? `1px solid ${T.primary}` : 'none',
                  }}>
                    {s.done && <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${s.done * 100}%`, background: T.primary,
                    }} />}
                  </div>
                  <div style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3,
                    color: s.active ? T.primary : T.ink4,
                    marginTop: 4, textAlign: 'center',
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, color: T.ink2, paddingTop: 10,
              borderTop: `1px solid ${T.lineSoft}`,
            }}>
              <div>
                <div style={{ color: T.ink3, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Played</div>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, color: T.ink }}>24<span style={{ color: T.ink3, fontSize: 13 }}>/104</span></div>
              </div>
              <div>
                <div style={{ color: T.ink3, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Today</div>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, color: T.ink }}>3</div>
              </div>
              <div>
                <div style={{ color: T.ink3, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Next ko</div>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, color: T.ink }}>Jun 27</div>
              </div>
            </div>
          </div>
        </div>

        {/* Groups grid */}
        <SectionTitle>Group stage · 12 groups</SectionTitle>
        <div style={{
          padding: '0 20px', display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          {Object.entries(GROUPS).slice(0, 8).map(([k, codes]) => (
            <GroupMiniCard key={k} letter={k} codes={codes} />
          ))}
        </div>

        {/* Knockout progression — vertical mobile-native */}
        <SectionTitle>Knockout path</SectionTitle>
        <div style={{ padding: '0 20px' }}>
          <Card pad={0}>
            {[
              { label: 'Round of 32', date: 'Jun 27 — Jul 1', count: 16, state: 'upcoming' },
              { label: 'Round of 16', date: 'Jul 3 — 7', count: 8, state: 'upcoming' },
              { label: 'Quarter-finals', date: 'Jul 9 — 11', count: 4, state: 'upcoming' },
              { label: 'Semi-finals', date: 'Jul 14 — 15', count: 2, state: 'upcoming' },
              { label: '3rd place', date: 'Jul 18', count: 1, state: 'upcoming' },
              { label: 'Final', date: 'Jul 19', count: 1, state: 'final', venue: 'MetLife, NJ' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < arr.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                background: s.state === 'final' ? `${T.primary}08` : 'transparent',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: T.r.md,
                  background: s.state === 'final' ? T.primary : T.surfaceAlt,
                  color: s.state === 'final' ? '#fff' : T.ink,
                  fontFamily: T.display, fontWeight: 800, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  letterSpacing: -0.3,
                }}>{s.count}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: T.display, fontWeight: 700, fontSize: 14,
                    color: T.ink, letterSpacing: -0.15,
                  }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: T.ink3, marginTop: 1 }}>
                    {s.date}{s.venue ? ' · ' + s.venue : ''}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={T.ink4} strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
            ))}
          </Card>
        </div>
      </ScreenScroll>
      <BottomNav active="predict" />
    </ScreenBg>
  );
}

function GroupMiniCard({ letter, codes }) {
  return (
    <div style={{
      background: T.surface, borderRadius: T.r.lg,
      border: `1px solid ${T.line}`, padding: 12,
      boxShadow: T.sh1, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{
          fontFamily: T.display, fontSize: 11, fontWeight: 700,
          color: T.ink3, letterSpacing: 1, textTransform: 'uppercase',
        }}>Group</div>
        <div style={{
          fontFamily: T.display, fontSize: 22, fontWeight: 900,
          color: T.primary, letterSpacing: -0.8, lineHeight: 1,
        }}>{letter}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {codes.map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TeamDisc code={c} size={16} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.ink2, letterSpacing: -0.1 }}>
              {TEAMS[c]?.code}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenBg, ScreenHeader, ScreenScroll, SectionTitle, MiniLBRow,
  HomeScreen, LoginScreen, TournamentScreen, GroupMiniCard,
});
