// Screens part 3: Leaderboard, Fixtures, My Picks, Profile, Admin

// ═══════════════════════════ 7. LEADERBOARD ═══════════════════════════
function LeaderboardScreen() {
  const [scope, setScope] = React.useState('overall');
  const top3 = LEADERBOARD.slice(0, 3);

  return (
    <ScreenBg>
      <ScreenHeader kicker="Private league" title="The Usual Suspects" right={
        <div style={{
          width: 36, height: 36, borderRadius: T.r.pill,
          background: T.surface, border: `1px solid ${T.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={T.ink} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      } />

      <div style={{ padding: '0 20px 10px' }}>
        <Segmented
          options={[
            { value: 'overall', label: 'Overall' },
            { value: 'group', label: 'Group stage' },
            { value: 'ko', label: 'Knockouts' },
            { value: 'form', label: 'Last 5' },
          ]}
          value={scope}
          onChange={setScope}
        />
      </div>

      <ScreenScroll>
        {/* Podium */}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{
            background: `linear-gradient(180deg, ${T.primary} 0%, ${T.primaryInk} 100%)`,
            borderRadius: T.r.lg, padding: '24px 16px 20px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -30, top: -30,
              fontFamily: T.display, fontSize: 140, fontWeight: 900,
              color: 'rgba(255,255,255,0.07)', letterSpacing: -6, lineHeight: 0.8,
            }}>🏆</div>
            <div style={{
              color: '#fff', fontFamily: T.display, fontSize: 11,
              fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              opacity: 0.7, textAlign: 'center', marginBottom: 14,
            }}>Top of the table</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr',
              gap: 8, alignItems: 'end', position: 'relative',
            }}>
              {[top3[1], top3[0], top3[2]].map((r, idx) => {
                const rank = r.rank;
                const heights = { 1: 94, 2: 74, 3: 58 };
                return (
                  <div key={r.name} style={{ textAlign: 'center' }}>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <Avatar name={r.name} size={rank === 1 ? 56 : 48} />
                      {rank === 1 && (
                        <div style={{
                          position: 'absolute', top: -10, left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 18,
                        }}>👑</div>
                      )}
                    </div>
                    <div style={{ color: '#fff', fontFamily: T.display, fontSize: 13, fontWeight: 700, marginBottom: 2, letterSpacing: -0.1 }}>{r.name}</div>
                    <div style={{
                      fontFamily: T.display, fontSize: 22, fontWeight: 900,
                      color: T.accent, letterSpacing: -0.5, fontFeatureSettings: '"tnum" 1',
                    }}>{r.pts}</div>
                    <div style={{
                      marginTop: 6, height: heights[rank],
                      background: rank === 1 ? T.accent : 'rgba(255,255,255,0.18)',
                      color: rank === 1 ? T.accentInk : '#fff',
                      borderRadius: '6px 6px 0 0',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                      paddingTop: 8,
                      fontFamily: T.display, fontSize: 20, fontWeight: 900,
                      letterSpacing: -0.3,
                    }}>{rank}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full table */}
        <SectionTitle>Full standings</SectionTitle>
        <div style={{ padding: '0 20px' }}>
          <Card pad={0}>
            {LEADERBOARD.map((row, i) => (
              <LBRow key={row.name} row={row} isLast={i === LEADERBOARD.length - 1} />
            ))}
          </Card>
        </div>

        <div style={{ padding: '18px 20px 0', fontSize: 11, color: T.ink3, fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
          Scoring: exact score only · 3 pts<br/>
          If nobody hits exact → next match is a jackpot
        </div>
      </ScreenScroll>
      <BottomNav active="board" />
    </ScreenBg>
  );
}

function LBRow({ row, isLast }) {
  const delta = row.prev - row.rank;
  const deltaColor = delta > 0 ? T.accentInk : delta < 0 ? T.live : T.ink4;
  const deltaBg = delta > 0 ? T.accent : delta < 0 ? T.live2 : T.lineSoft;
  const accuracy = ((row.correct / row.total) * 100).toFixed(0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 40px 1fr 58px 50px',
      alignItems: 'center', gap: 10,
      padding: '12px 14px',
      background: row.isMe ? T.primary + '10' : 'transparent',
      borderLeft: row.isMe ? `3px solid ${T.primary}` : '3px solid transparent',
      borderBottom: isLast ? 'none' : `1px solid ${T.lineSoft}`,
    }}>
      <div style={{
        fontFamily: T.display, fontWeight: 800, fontSize: 15,
        color: row.rank <= 3 ? T.primary : T.ink2, textAlign: 'center',
        fontFeatureSettings: '"tnum" 1', letterSpacing: -0.3,
      }}>{row.rank}</div>
      <Avatar name={row.name} size={34} />
      <div>
        <div style={{
          fontFamily: T.display, fontSize: 14, fontWeight: row.isMe ? 800 : 600,
          color: T.ink, letterSpacing: -0.1,
        }}>{row.name}{row.isMe ? ' · you' : ''}</div>
        <div style={{ fontSize: 11, color: T.ink3, fontWeight: 500, marginTop: 1 }}>
          {row.correct} exact · {accuracy}%
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        {delta !== 0 ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            background: deltaBg, color: deltaColor,
            padding: '2px 6px', borderRadius: T.r.sm,
            fontFamily: T.display, fontSize: 11, fontWeight: 700,
          }}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
          </div>
        ) : (
          <span style={{ color: T.ink4, fontSize: 12 }}>—</span>
        )}
      </div>
      <div style={{
        fontFamily: T.display, fontWeight: 800, fontSize: 20,
        color: T.ink, textAlign: 'right', letterSpacing: -0.5,
        fontFeatureSettings: '"tnum" 1',
      }}>{row.pts}</div>
    </div>
  );
}

// ═══════════════════════════ 8. FIXTURES / RESULTS ═══════════════════════════
function FixturesScreen() {
  const [stage, setStage] = React.useState('all');

  const allFixtures = [
    { date: 'Today · Jun 21', items: TODAY_MATCHES },
    { date: 'Tomorrow · Jun 22', items: UPCOMING.slice(0, 3) },
    { date: 'Yesterday · Jun 20', items: RESULTS.slice(0, 2) },
    { date: 'Jun 18', items: RESULTS.slice(2, 4) },
  ];

  return (
    <ScreenBg>
      <ScreenHeader kicker="All matches" title="Fixtures" />

      <div style={{ padding: '0 20px 10px' }}>
        <Segmented
          options={[
            { value: 'all', label: 'All' },
            { value: 'group', label: 'Groups' },
            { value: 'ko', label: 'Knockouts' },
            { value: 'done', label: 'Results' },
          ]}
          value={stage}
          onChange={setStage}
        />
      </div>

      <ScreenScroll>
        {allFixtures.map((day, i) => (
          <div key={i}>
            <div style={{
              padding: '16px 20px 8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              position: 'sticky', top: 0, background: T.bg, zIndex: 1,
            }}>
              <div style={{
                fontFamily: T.display, fontSize: 13, fontWeight: 800,
                color: T.ink, letterSpacing: -0.15,
              }}>{day.date}</div>
              <div style={{ fontSize: 11, color: T.ink3, fontWeight: 600 }}>
                {day.items.length} matches
              </div>
            </div>
            <div style={{ padding: '0 20px' }}>
              <Card pad={0}>
                {day.items.map((m, j) => (
                  <div key={m.id} style={{
                    borderBottom: j < day.items.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                  }}>
                    <MatchRow match={m} showPrediction showResult={m.status === 'done'} />
                  </div>
                ))}
              </Card>
            </div>
          </div>
        ))}
      </ScreenScroll>
      <BottomNav active="fixtures" />
    </ScreenBg>
  );
}

// ═══════════════════════════ 9. MY PICKS / HISTORY ═══════════════════════════
function MyPicksScreen() {
  const totals = {
    points: 12, exact: 4, played: 6, jackpot: 0, pending: 3,
  };

  return (
    <ScreenBg>
      <ScreenHeader kicker="Alex · Your journey" title="My picks" />

      <ScreenScroll>
        {/* Stats strip */}
        <div style={{
          padding: '4px 20px 0',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
        }}>
          {[
            { v: totals.points, l: 'Total pts', color: T.primary },
            { v: totals.exact, l: 'Exact hits', color: T.accentInk, bg: T.accent },
            { v: totals.pending, l: 'Pending', color: T.ink },
          ].map((s, i) => (
            <div key={i} style={{
              background: s.bg || T.surface, borderRadius: T.r.md,
              border: s.bg ? 'none' : `1px solid ${T.line}`,
              padding: '12px 12px', boxShadow: T.sh1,
            }}>
              <div style={{
                fontFamily: T.display, fontWeight: 800, fontSize: 26,
                color: s.color, letterSpacing: -0.8, lineHeight: 1,
                fontFeatureSettings: '"tnum" 1',
              }}>{s.v}</div>
              <div style={{ fontSize: 11, color: s.bg ? s.color : T.ink3, fontWeight: 600, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Form dots */}
        <SectionTitle>Form · last 8 picks</SectionTitle>
        <div style={{ padding: '0 20px' }}>
          <Card>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
              {['H', 'M', 'M', 'H', 'H', 'M', 'H', '·'].map((v, i) => (
                <div key={i} style={{
                  flex: 1, height: 32, borderRadius: T.r.sm,
                  background: v === 'H' ? T.accent : v === '·' ? T.surfaceAlt : T.lineSoft,
                  color: v === 'H' ? T.accentInk : T.ink3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: T.display, fontSize: 12, fontWeight: 800,
                  border: v === '·' ? `1.5px dashed ${T.line}` : 'none',
                }}>{v === '·' ? '' : v}</div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.ink3 }}>
              <span>Oldest</span>
              <span>Latest</span>
            </div>
          </Card>
        </div>

        {/* Full history list */}
        <SectionTitle action="Export">All predictions</SectionTitle>
        <div style={{ padding: '0 20px' }}>
          <Card pad={0}>
            {MY_PICKS.map((m, i) => (
              <div key={m.id} style={{
                borderBottom: i < MY_PICKS.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
              }}>
                <HistoryRow match={m} />
              </div>
            ))}
          </Card>
        </div>
      </ScreenScroll>
      <BottomNav active="me" />
    </ScreenBg>
  );
}

function HistoryRow({ match }) {
  const correct = match.points > 0;
  return (
    <div style={{
      padding: '12px 14px',
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      alignItems: 'center', gap: 12,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: 0.4, textTransform: 'uppercase' }}>{match.time} · {match.stage}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamDisc code={match.home} size={18} />
          <span style={{ fontFamily: T.display, fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: -0.1 }}>{TEAMS[match.home]?.code}</span>
          <span style={{ fontSize: 12, color: T.ink4, fontWeight: 600 }}>vs</span>
          <TeamDisc code={match.away} size={18} />
          <span style={{ fontFamily: T.display, fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: -0.1 }}>{TEAMS[match.away]?.code}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: T.ink3, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 }}>Pick</div>
        <div style={{
          fontFamily: T.display, fontWeight: 700, fontSize: 14,
          color: correct ? T.accentInk : T.ink3,
          background: correct ? T.accent : T.lineSoft,
          padding: '2px 8px', borderRadius: T.r.sm,
          fontFeatureSettings: '"tnum" 1', letterSpacing: -0.1,
        }}>{match.prediction.h}–{match.prediction.a}</div>
      </div>

      <div style={{ textAlign: 'center', minWidth: 42 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: T.ink3, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 }}>Final</div>
        <div style={{
          fontFamily: T.display, fontWeight: 800, fontSize: 14, color: T.ink,
          fontFeatureSettings: '"tnum" 1', letterSpacing: -0.1,
        }}>{match.score.h}–{match.score.a}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════ 10. PROFILE / SETTINGS ═══════════════════════════
function ProfileScreen() {
  return (
    <ScreenBg bg="#F2F2F7">
      <div style={{
        padding: '58px 20px 20px', background: T.bg,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ position: 'relative' }}>
            <Avatar name="Alex Chen" size={64} color={T.primary} />
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: '50%',
              background: T.surface, border: `1px solid ${T.line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5l4 4L8 20l-5 1 1-5L16.5 3.5z" stroke={T.ink} strokeWidth="2" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 800, color: T.ink, letterSpacing: -0.4 }}>Alex Chen</div>
            <div style={{ fontSize: 12, color: T.ink3, fontWeight: 500, marginTop: 2 }}>@alexc · Joined Jun 10</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <div style={{
                padding: '2px 8px', background: T.primary + '18',
                color: T.primary, borderRadius: T.r.pill,
                fontFamily: T.display, fontSize: 11, fontWeight: 700,
              }}>Rank #4</div>
              <div style={{
                padding: '2px 8px', background: T.accent,
                color: T.accentInk, borderRadius: T.r.pill,
                fontFamily: T.display, fontSize: 11, fontWeight: 700,
              }}>12 pts</div>
            </div>
          </div>
        </div>
      </div>

      <ScreenScroll>
        {/* Group */}
        <SettingsGroup header="League">
          <SettingsRow label="The Usual Suspects" value="10 members" />
          <SettingsRow label="Invite code" value="USUAL-2026" mono />
          <SettingsRow label="Scoring" value="Exact · 3 pts" />
          <SettingsRow label="Leave league" destructive />
        </SettingsGroup>

        <SettingsGroup header="Notifications">
          <SettingsRowToggle label="Match starting" on />
          <SettingsRowToggle label="Prediction locked" on />
          <SettingsRowToggle label="Results & points" on />
          <SettingsRowToggle label="Friend activity" />
          <SettingsRowToggle label="Daily reminder (9am)" on />
        </SettingsGroup>

        <SettingsGroup header="Display">
          <SettingsRow label="Time zone" value="ET · Eastern" />
          <SettingsRow label="Language" value="English" />
          <SettingsRow label="Theme" value="Light" />
        </SettingsGroup>

        <SettingsGroup header="">
          <SettingsRow label="Help & rules" />
          <SettingsRow label="About WC26 Predict" />
          <SettingsRow label="Sign out" destructive />
        </SettingsGroup>

        <div style={{ padding: '20px', textAlign: 'center', fontSize: 11, color: T.ink4 }}>
          WC26 Predict v1.0.4 · Made for the Usual Suspects
        </div>
      </ScreenScroll>
      <BottomNav active="me" />
    </ScreenBg>
  );
}

function SettingsGroup({ header, children }) {
  return (
    <div>
      {header && <div style={{
        padding: '20px 20px 8px', fontFamily: T.display,
        fontSize: 11, fontWeight: 700, color: T.ink3,
        letterSpacing: 0.6, textTransform: 'uppercase',
      }}>{header}</div>}
      {!header && <div style={{ height: 16 }} />}
      <div style={{
        margin: '0 16px', background: T.surface,
        borderRadius: T.r.lg, overflow: 'hidden',
        border: `1px solid ${T.line}`,
      }}>{children}</div>
    </div>
  );
}

function SettingsRow({ label, value, destructive, mono }) {
  return (
    <div style={{
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: `1px solid ${T.lineSoft}`,
    }}>
      <div style={{
        flex: 1, fontSize: 14, fontWeight: 500,
        color: destructive ? T.live : T.ink,
      }}>{label}</div>
      {value && <span style={{
        fontFamily: mono ? T.mono : T.body, fontSize: 13,
        color: T.ink3, fontWeight: mono ? 700 : 500,
        letterSpacing: mono ? 1 : 0,
      }}>{value}</span>}
      {!destructive && <svg width="8" height="14" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke={T.ink4} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
    </div>
  );
}

function SettingsRowToggle({ label, on }) {
  return (
    <div style={{
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: `1px solid ${T.lineSoft}`,
    }}>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.ink }}>{label}</div>
      <div style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? T.primary : T.line,
        position: 'relative', transition: 'all 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 20 : 2,
          width: 22, height: 22, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
        }} />
      </div>
    </div>
  );
}

// ═══════════════════════════ 11. ADMIN — ENTER RESULTS ═══════════════════════════
function AdminScreen() {
  return (
    <ScreenBg bg={T.ink}>
      <div style={{
        padding: '58px 20px 16px', color: '#fff',
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
        }}>
          <div style={{
            padding: '3px 8px', background: T.primary,
            borderRadius: T.r.sm, fontSize: 10, fontWeight: 800,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Admin</div>
          <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 500 }}>Marco V. · Owner</div>
        </div>
        <div style={{
          fontFamily: T.display, fontSize: 26, fontWeight: 800,
          letterSpacing: -0.8,
        }}>Enter results</div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 3 }}>
          3 matches waiting for final score
        </div>
      </div>

      <ScreenScroll>
        <div style={{ padding: '16px 20px 0' }}>
          {/* State summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8, marginBottom: 16,
          }}>
            {[
              { v: 3, l: 'Pending', c: T.warn, bg: 'rgba(245,158,11,0.1)' },
              { v: 1, l: 'Live', c: T.live, bg: 'rgba(239,68,68,0.1)' },
              { v: 24, l: 'Verified', c: T.accent, bg: 'rgba(190,242,100,0.1)' },
            ].map((s, i) => (
              <div key={i} style={{
                background: s.bg, padding: '10px 12px',
                borderRadius: T.r.md,
                border: `1px solid ${s.c}33`,
              }}>
                <div style={{
                  fontFamily: T.display, fontSize: 22, fontWeight: 800,
                  color: s.c, letterSpacing: -0.4, lineHeight: 1,
                }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Pending match card */}
          <div style={{
            background: '#18181B', borderRadius: T.r.lg,
            border: `1px solid rgba(255,255,255,0.08)`,
            overflow: 'hidden', marginBottom: 10,
          }}>
            <div style={{
              padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: `1px solid rgba(255,255,255,0.06)`,
              background: 'rgba(245,158,11,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.warn }} />
                <span style={{ fontFamily: T.display, fontSize: 12, fontWeight: 700, color: T.warn, letterSpacing: 0.4, textTransform: 'uppercase' }}>Awaiting result</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Gr. C · MD 2</span>
            </div>
            <div style={{
              padding: 16,
              display: 'grid', gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <TeamDisc code="USA" size={40} />
                <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: '#fff' }}>USA</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AdminScoreInput dark />
                <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: T.display, fontSize: 22, fontWeight: 700 }}>:</div>
                <AdminScoreInput dark />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <TeamDisc code="WAL" size={40} />
                <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: '#fff' }}>WAL</div>
              </div>
            </div>
            <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
              <button style={{
                flex: 1, padding: '10px', borderRadius: T.r.md,
                background: 'rgba(255,255,255,0.06)', color: '#fff',
                border: `1px solid rgba(255,255,255,0.1)`,
                fontFamily: T.display, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Mark live</button>
              <button style={{
                flex: 2, padding: '10px', borderRadius: T.r.md,
                background: T.accent, color: T.accentInk,
                border: 'none',
                fontFamily: T.display, fontSize: 12, fontWeight: 800,
                cursor: 'pointer', letterSpacing: -0.1,
              }}>Submit final · recalc board</button>
            </div>
          </div>

          {/* Queue rows */}
          {[
            { home: 'ARG', away: 'KOR', stage: 'Gr. D · MD 2', state: 'Starts 16:00' },
            { home: 'FRA', away: 'DEN', stage: 'Gr. F · MD 2', state: 'Starts 20:00' },
          ].map((m, i) => (
            <div key={i} style={{
              background: '#18181B', borderRadius: T.r.md,
              border: `1px solid rgba(255,255,255,0.08)`,
              padding: '12px 14px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <TeamDisc code={m.home} size={26} />
              <TeamDisc code={m.away} size={26} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.display, fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  {m.home} vs {m.away}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                  {m.stage} · {m.state}
                </div>
              </div>
              <button style={{
                padding: '6px 10px', background: 'rgba(255,255,255,0.08)',
                color: '#fff', border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: T.r.sm,
                fontFamily: T.display, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Lock picks</button>
            </div>
          ))}

          <div style={{
            marginTop: 16, padding: 14,
            background: 'rgba(109,40,217,0.12)',
            border: `1px solid ${T.primary}44`,
            borderRadius: T.r.md,
            fontSize: 12, color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.5,
          }}>
            <div style={{ fontFamily: T.display, fontWeight: 700, color: T.accent, marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase', fontSize: 11 }}>Jackpot watch</div>
            MD 2 had <b style={{ color: '#fff' }}>0 exact hits</b> on POR–SEN. Next match (BRA–CRO) carries <b style={{ color: T.accent }}>+6 pts</b> if exact.
          </div>
        </div>
      </ScreenScroll>
    </ScreenBg>
  );
}

function AdminScoreInput({ dark }) {
  return (
    <div style={{
      width: 54, height: 54, borderRadius: T.r.md,
      background: dark ? 'rgba(255,255,255,0.05)' : T.surface,
      border: `1.5px solid ${dark ? 'rgba(255,255,255,0.15)' : T.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.display, fontSize: 26, fontWeight: 800,
      color: dark ? '#fff' : T.ink, letterSpacing: -0.8,
      cursor: 'text',
    }}>_</div>
  );
}

Object.assign(window, {
  LeaderboardScreen, LBRow,
  FixturesScreen, MyPicksScreen, HistoryRow,
  ProfileScreen, SettingsGroup, SettingsRow, SettingsRowToggle,
  AdminScreen, AdminScoreInput,
});
