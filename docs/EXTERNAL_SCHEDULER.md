# External Football-Data Scheduler

Purpose: run the live football-data sync every minute when Vercel Cron is not
available at one-minute frequency on the current plan.

## Endpoint

Call the production sync route:

```bash
https://www.jackpotspiel.at/api/cron/football-data-sync
```

The request must include:

```bash
Authorization: Bearer <CRON_SECRET>
```

`CRON_SECRET` is configured in Vercel production environment variables and in
the local `.env.local` file used during deployment. Do not commit the secret.

## Mac Mini Option

A Mac mini or always-on local agent can run the scheduler with `launchd`.

Store the secret in macOS Keychain:

```bash
security add-generic-password -a "$USER" -s jackpotspiel-cron-secret -w "<CRON_SECRET>"
```

Create `~/bin/jackpotspiel-sync.sh`:

```bash
#!/bin/zsh
set -euo pipefail

SECRET="$(security find-generic-password -a "$USER" -s jackpotspiel-cron-secret -w)"

curl --fail --silent --show-error \
  -H "Authorization: Bearer ${SECRET}" \
  "https://www.jackpotspiel.at/api/cron/football-data-sync"
```

Make it executable:

```bash
chmod +x ~/bin/jackpotspiel-sync.sh
```

Create `~/Library/LaunchAgents/at.jackpotspiel.football-data-sync.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>at.jackpotspiel.football-data-sync</string>

  <key>ProgramArguments</key>
  <array>
    <string>/Users/YOUR_MAC_USERNAME/bin/jackpotspiel-sync.sh</string>
  </array>

  <key>StartInterval</key>
  <integer>60</integer>

  <key>RunAtLoad</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/tmp/jackpotspiel-football-data-sync.log</string>

  <key>StandardErrorPath</key>
  <string>/tmp/jackpotspiel-football-data-sync.err</string>
</dict>
</plist>
```

Load and start it:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/at.jackpotspiel.football-data-sync.plist
launchctl kickstart -k gui/$(id -u)/at.jackpotspiel.football-data-sync
```

Stop it later:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/at.jackpotspiel.football-data-sync.plist
```

## Checks

Manual unauthorized check should return `401`:

```bash
curl -i https://www.jackpotspiel.at/api/cron/football-data-sync
```

Manual authorized check should return `200` with a JSON sync result:

```bash
curl -i \
  -H "Authorization: Bearer <CRON_SECRET>" \
  https://www.jackpotspiel.at/api/cron/football-data-sync
```

During active match windows, inspect `provider_sync_log` in the database to
confirm successful sync runs and provider errors.

## Known Edge Case: Short Postponements

Observed on July 6, 2026: Mexico vs England was delayed by about one hour. The
cron route kept running successfully every minute, but football-data still
reported the match as `SCHEDULED` with no score. Because the local sync only
polls mapped matches in a limited active window around the stored kickoff time,
the match later fell out of the candidate set and recent sync logs showed:

```json
{
  "candidateCount": 0,
  "fetchedCount": 0,
  "updatedCount": 0,
  "status": "finished"
}
```

This means the cron job was healthy; it was no longer polling the delayed match.

If this happens again:

- Check the match row in `matches` for stale `status`, `provider_status`,
  `kickoff_at`, and scores.
- Check `provider_sync_log.payload` for `candidateCount`.
- Check `match_provider_mappings.provider_payload` for the stale provider
  status.
- Verify the official score against FIFA before correcting production data.
- Apply a targeted transaction for the single affected `game_id`; do not run a
  broad/manual update across unrelated matches.

Manual correction used for the Mexico vs England incident:

- `game_id = 92`
- `MEX 2 - 3 ENG`
- `status = done`
- `provider_status = FINISHED`
- `result_type = REGULAR`
- official kickoff corrected to `2026-07-06T01:00:00Z`

Future code improvement: keep delayed or scheduled mapped matches in the active
polling window longer when `locked_at <= now()` but the provider still reports
`SCHEDULED`/`TIMED`, or use FIFA as a fallback for final scores.
