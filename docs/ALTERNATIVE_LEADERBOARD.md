# Alternative Leaderboard Runbook

This is a local, read-only way to print the alternative points leaderboard from
the configured database. It does not change application code and does not write
to the database.

Run from the real WSL checkout:

```bash
cd /home/aab/dev/wc26
```

Then run:

```bash
node -e 'const {loadEnvFile}=require("node:process"); loadEnvFile(".env.local"); const postgres=require("postgres"); const sql=postgres(process.env.DATABASE_URL||process.env.POSTGRES_URL||process.env.POSTGRES_PRISMA_URL,{max:1,connect_timeout:15,prepare:false}); function calculate_points_alternative_leaderboard(rows){ const outcome=(h,a)=>Math.sign(h-a); const points=(r)=>{ if(r.pred_home===r.actual_home && r.pred_away===r.actual_away) return 4; const predictedOutcome=outcome(r.pred_home,r.pred_away); const actualOutcome=outcome(r.actual_home,r.actual_away); if(predictedOutcome===actualOutcome && (r.pred_home-r.pred_away)===(r.actual_home-r.actual_away)) return 3; if(predictedOutcome===actualOutcome) return 2; return 0; }; const leaderboard=new Map(); for(const r of rows){ const key=`${r.league_id}:${r.user_id}:${r.prediction_row}`; if(!leaderboard.has(key)){ leaderboard.set(key,{name:r.entry_name,row:r.prediction_row,played:0,points:0,exact:0,diff:0,outcome:0,miss:0}); } const entry=leaderboard.get(key); const score=points(r); entry.played++; entry.points+=score; if(score===4) entry.exact++; else if(score===3) entry.diff++; else if(score===2) entry.outcome++; else entry.miss++; } return [...leaderboard.values()].sort((a,b)=>b.points-a.points||b.exact-a.exact||b.diff-a.diff||a.name.localeCompare(b.name)); } (async()=>{ const rows=await sql.unsafe(`select l.id as league_id, p.user_id, case when lm.uses_two_prediction_rows then concat(pr.display_name, chr(32), p.prediction_row::text) else pr.display_name end as entry_name, p.prediction_row, p.home_score as pred_home, p.away_score as pred_away, m.home_score as actual_home, m.away_score as actual_away from predictions p join matches m on m.id=p.match_id join leagues l on l.id=p.league_id join profiles pr on pr.id=p.user_id join league_members lm on lm.league_id=p.league_id and lm.user_id=p.user_id where m.home_score is not null and m.away_score is not null and m.status = $$done$$ order by entry_name, p.prediction_row, m.kickoff_at, m.game_id`); const played=await sql.unsafe(`select count(*)::int as count from matches where home_score is not null and away_score is not null and status = $$done$$`); const leaderboard=calculate_points_alternative_leaderboard(rows); console.log(`Alternative leaderboard: calculate_points_alternative_leaderboard`); console.log(`Played matches counted: ${played[0]?.count ?? 0}`); console.log(`Predictions scored: ${rows.length}`); console.log(""); for(const [index, entry] of leaderboard.entries()){ console.log(`${String(index+1).padStart(2)} ${entry.name.padEnd(24)} ${String(entry.points).padStart(3)}`); } })().catch(err=>{console.error(err); process.exit(1)}).finally(()=>sql.end());'
```

Scoring:

- exact score: `4`
- correct outcome and correct goal difference: `3`
- correct outcome only: `2`
- otherwise: `0`

Draws are covered by the same outcome and goal-difference rule: a non-exact
draw prediction receives `3` points because both the outcome and goal
difference are `0`.

Safety notes:

- The script only executes `select` statements.
- It opens one Postgres connection with `max:1`.
- It reads credentials from `.env.local`.
- It intentionally lives in docs instead of app code until this leaderboard is
  promoted to a product feature.
