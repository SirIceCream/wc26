# POC Plan: Locked Prediction Transparency + User Result History

## Goal
Build a production-directed POC on branch `poc` that keeps pre-kickoff prediction secrecy, then reveals all submitted score predictions after lock so every participant can verify fairness.

This plan adds:
1. **Match-level integrity view** (who predicted what, post-lock only)
2. **Potential winnings calculator** per scoreline group
3. **Profile-level historical results** per user and per tip row (`Tippreihe 1/2`), including `0 €` outcomes
4. **Clickable drill-down** from profile history to match integrity view for past matches (and long-term archive)

---

## Product Requirements (consolidated)

### R1 — Integrity gate (hard rule)
- Before lock (`match.lockedAt > now`):
  - show only own prediction
  - show explicit hint: "Andere Tipps werden erst nach Anpfiff sichtbar"
- After lock (`locked/live/done`):
  - show all predictions in same league for that match
  - show grouped distribution + payout math

### R2 — Potential winnings transparency
For each scoreline group (`2:1`, `1:1`, etc):
- participants in group
- computed share = `current_match_pot / group_count`
- rounded monetary display to 2 decimals

Show prominently for current user:
- own picked scoreline
- own potential payout for that match (even if later actual payout can differ due to settlement rules)

### R3 — Profile results must always show
In profile history, per match and per tip row:
- show result row regardless of payout (`0 €` must appear)
- if user has 2 tip rows, both rows are visible separately
- show status + final amount + basic reasoning label (`Treffer` / `Kein Treffer`)

### R4 — Click-through audit trail
From profile result item, user can click to:
- match detail integrity page
- see historical group distribution and prediction list for that past game

This is retained beyond the tournament end to preserve auditability.

---

## UX Proposal

## 1) Match card -> Integrity Detail
Entry point: click game card.

### Pre-lock screen
- header: teams, kickoff, countdown
- own tip card only
- locked message + shield icon
- no other-user predictions rendered

### Post-lock screen
Top summary strip:
- Match pot
- Total tip rows in play
- Your picked scoreline
- Your potential win amount

Middle:
- scoreline distribution chart/chips (grouped counts + potential €/row)

Bottom:
- grouped list of all submissions (30–35 rows supported)
  - group heading = scoreline
  - subgroup payout value
  - member chips (name + tip row)

Filters:
- all
- my scoreline
- highest potential payout
- most popular scoreline

## 2) Profile -> "Meine Ergebnisse"
Each match result item:
- match label
- `Tippreihe 1` / `Tippreihe 2`
- predicted score
- final score
- payout amount (`0.00 €` allowed and visible)
- button/link: "Integrität prüfen" -> match detail

Optional profile totals:
- total won amount
- total exact hits
- row-wise totals (row 1 vs row 2)

---

## Data/Domain Plan

## A. Read model for match integrity view
Return shape:
- match info (`id`, teams, kickoff, lock status)
- pot info (`currentPot`)
- all predictions for match in league (`user`, `predictionRow`, `scoreline`)
- grouped aggregates by scoreline:
  - `count`
  - `potentialWin = currentPot / count`

## B. Read model for profile results
Per user + league + tip row + match:
- predicted score
- final score
- hit bool
- payout amount (including zero)
- match status/date

If payout settlement is not finalized for future/live, allow:
- potential or pending label, but keep row present

## C. Authorization
- only league participants can access integrity details for league matches
- reveal of others tied to lock state

---

## Implementation Ticket Breakdown

### Ticket 1 — Route skeleton: Match Integrity Detail (`/match/[id]`)
**Scope**
- new page route + layout blocks (pre-lock/post-lock variants)
- reuse existing match status inference

**Acceptance criteria**
- open match shows secrecy state
- locked match shows placeholder sections ready for data

### Ticket 2 — Backend query: grouped predictions + potential payout
**Scope**
- fetch all league predictions for match
- group by scoreline + compute counts/potential
- include user prediction row context

**Acceptance criteria**
- outputs deterministic grouped structure
- supports 35 rows without N+1 queries

### Ticket 3 — UI component: `PredictionDistributionPanel`
**Scope**
- scoreline chips/bars
- potential payout badges
- filter state

**Acceptance criteria**
- filters work client-side on provided dataset
- mobile remains readable

### Ticket 4 — UI component: `MatchSubmissionsList`
**Scope**
- grouped rendering of participants by scoreline
- compact visual mode for 30–35 rows

**Acceptance criteria**
- all rows visible and scannable
- own row visually emphasized

### Ticket 5 — Profile results section (`/profile`)
**Scope**
- list all played matches per tip row
- always show payout amount including `0.00 €`
- add drill-down link to integrity detail

**Acceptance criteria**
- if member has two tip rows, both appear
- historical rows remain visible post-tournament

### Ticket 6 — Integrity safeguards
**Scope**
- server-side guard: do not reveal others before lock
- add tests for lock boundary conditions

**Acceptance criteria**
- no pre-lock leakage in server response
- boundary test for exact kickoff moment

### Ticket 7 — POC visual polish
**Scope**
- final styling pass for charts/chips/cards
- empty + loading states

**Acceptance criteria**
- visually coherent with current UI theme
- demo-ready for stakeholder review

---

## PR Structure Recommendation

Suggested branch flow:
1. `poc` base branch
2. optional stacked PRs:
   - PR A: data/query + guards
   - PR B: match detail UI
   - PR C: profile history integration

If single PR preferred, split commits by concern:
1. data contracts
2. integrity route
3. profile results + links
4. visual polish

---

## Definition of Done (POC)
- No pre-lock visibility of others' predictions
- Post-lock full league transparency for each match
- Profile history displays all outcomes including 0€
- Two-tip-row users see both tracks
- Drill-down to past-match integrity views works
- Layout remains readable at 35 tip rows

