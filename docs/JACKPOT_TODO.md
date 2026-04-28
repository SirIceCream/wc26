# Jackpotspiel Rules And Todo

Purpose: product and implementation checklist for the private WC26 Jackpotspiel.

## Confirmed Rules

- The game is private, invite-only, and played only among friends.
- There is no rake or operator margin; the complete paid-in stake is paid out.
- A paid `Tippreihe` is the accounting unit.
- One complete `Tippreihe` costs `115 EUR`:
  - `104 EUR` match stake (`1 EUR` per match)
  - `5 EUR` world champion special pot
  - `5 EUR` total tournament goals special pot
  - `1 EUR` lucky-loser pot
- Players can have multiple `Tippreihen`. The first implementation supports one or two rows per user; a third row can later be handled through another user/account or a future admin extension.
- Match tips lock at the originally scheduled kickoff time.
- The fixed jackpot order is the original chronological MESZ kickoff order, even if a match starts later in reality.
- If nobody hits an exact match result, that match pot carries into the next match in jackpot order.
- If multiple `Tippreihen` hit an exact match result, the available match pot is split evenly and rounded to two decimals.
- Knockout match tips use the result after extra time when extra time is played, excluding penalties.
- Special tips lock before tournament start, currently the planned opening kickoff: `2026-06-11T19:00:00.000Z` (`11. Juni 2026, 21:00 MESZ`).
- World champion and total-goals tips are separate `5 EUR` pots per `Tippreihe`.
- Lucky loser is calculated per `Tippreihe`; a player with two rows pays two lucky-loser Euros and has two lucky-loser entries.
- Account creation is only for already-paid participants, so the app does not need to delete/deactivate unpaid `Tippreihen` in the first admin flow.

## Current Product Direction

- Dashboard is the landing base.
- Match tips remain in `/predict`.
- Special tips get a separate `/special-picks` flow.
- Dashboard shows two separate special-tip entries:
  - `Tippe auf den Weltmeister!`
  - `Tippe auf die Anzahl der geschossenen Tore bei der WM 2026`
- Each special-tip entry shows a yellow `Noch ...` countdown until the tournament-start deadline.
- Once saved, an entry changes to the saved state:
  - `Dein Weltmeistertipp: <Flagge> <Land>`
  - `Dein Tortipp: <Anzahl> Tore`
  - primary action becomes `Tipp ändern`

## Implementation Todo

- [x] Copy the official rule PDF into `/rules`.
- [x] Document private jackpot assumptions and clarified payout rules.
- [x] Add `special_predictions` persistence per `league_id`, `user_id`, and `prediction_row`.
- [x] Add RLS policies for member-owned special predictions.
- [x] Add server actions for saving world champion and total-goals tips.
- [x] Add dashboard special-tip cards with deadline countdown and saved state.
- [x] Add `/special-picks` page with:
  - [x] Tippreihe selector when the user has two rows.
  - [x] Team search/autocomplete with flag and German team name.
  - [x] World champion save/change form.
  - [x] Total-goals save/change form.
- [ ] Build jackpot settlement model:
  - [ ] `jackpot_ledger` or equivalent immutable pot events.
  - [ ] Match base pot calculation from active `Tippreihen`.
  - [ ] Carry-over when no exact match winner exists.
  - [ ] Even split rounded to two decimals when multiple exact winners exist.
  - [ ] Final fallback to world champion, then total goals.
- [ ] Build admin result confirmation and payout review.
- [ ] Replace points-first leaderboard with jackpot-first money/treffer overview.
- [ ] Add tests for cent rounding and carry-over edge cases.
