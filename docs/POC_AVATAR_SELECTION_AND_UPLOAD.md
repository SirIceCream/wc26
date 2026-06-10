# POC: Avatar-Bibliothek für Leaderboard & „Mein Profil“

## Ziel
Im Leaderboard sollen statt Initialen echte runde Avatare angezeigt werden. In **„Mein Profil“** soll jeder User einen Avatar aus einer **vordefinierten PNG-Bibliothek** wählen können.

Rahmenbedingungen laut Entscheidung:
- Nur private Nutzung (ca. 20 Personen, geschlossene Gruppe).
- **Keine** Upload-Funktion (keine Kamera, keine Galerie).
- **Keine Duplikate** pro League („first come first serve“).

---

## Empfehlung (final)

Wir setzen **nur** auf vordefinierte Avatare im Repo:
- Dateien unter `public/avatars/*.png`.
- Auswahl nur per `avatar_key` aus Whitelist.
- Reservierung atomar in DB, damit kein Avatar doppelt vergeben wird.

Das ist für euren Use Case die schnellste und sauberste Lösung.

---

## Ist-Zustand im Projekt

- `profiles` enthält bereits `avatar_url`.
- Leaderboard nutzt derzeit Initialen-Avatar (Text-Badge).
- `Avatar`-Komponente hat aktuell noch keinen Bild-`src`-Pfad.

=> Gute Basis vorhanden, es fehlt nur der End-to-End-Flow für die Avatar-Auswahl.

---

## Architekturvorschlag

## 1) Avatar-Assets

Struktur:
- `public/avatars/fox.png`
- `public/avatars/panda.png`
- `public/avatars/tiger.png`
- usw.

Zusätzlich zentraler Katalog:
- `src/lib/avatar-catalog.ts`
- Beispiel-Form: `{ key: "fox", label: "Fuchs", src: "/avatars/fox.png" }`

Vorteile:
- Kein zusätzlicher Storage nötig.
- Schnelle Ladezeiten, einfache Caching-Story.
- Sehr geringer Implementierungsaufwand.

---

## 2) Datenmodell für „first come first serve“

Empfehlung: neue Tabelle `league_avatar_assignments`

Felder:
- `id` uuid pk
- `league_id` uuid fk
- `user_id` uuid fk
- `avatar_key` text
- `assigned_at` timestamptz

Constraints:
- `unique (league_id, avatar_key)` → derselbe Avatar nur 1x pro League.
- `unique (league_id, user_id)` → ein Avatar pro User in der League.

Warum so:
- Genau das gewünschte Verhalten.
- DB erzwingt Korrektheit auch bei gleichzeitigen Klicks.

---

## 3) Reservierungs-Flow (atomar)

Server Action z. B. `setLeagueAvatar(leagueId, avatarKey)`:
1. Prüfen: User ist eingeloggt + Mitglied der League.
2. Prüfen: `avatarKey` ist im Katalog (Whitelist).
3. In Transaktion Upsert/Insert für User durchführen.
4. Bei Unique-Conflict auf `(league_id, avatar_key)` -> Fehler „Avatar bereits vergeben“.

Wichtig:
- Keine freie URL vom Client akzeptieren.
- Nur `avatar_key` verarbeiten.

---

## 4) UI in „Mein Profil“

Neue Sektion „Mein Avatar“:
- Aktueller Avatar in groß (kreisförmig).
- Grid mit allen Avatar-Optionen.
- Bereits vergebene Avatare ausgegraut + „belegt“.
- Button „Avatar speichern“.
- Toast bei Erfolg/Fehler.

Optional nice-to-have:
- Schalter „Nur freie anzeigen“.
- Counter „x von y frei“.

---

## 5) Leaderboard-Integration

`Avatar`-Komponente erweitern:
- Props: `{ name: string; src?: string; compact?: boolean }`
- Wenn `src` vorhanden -> Bild kreisförmig anzeigen.
- Sonst Fallback auf Initialen.

Datenpriorität pro Row:
1. Avatar aus `league_avatar_assignments` (über `avatar_key` → Katalog `src`)
2. Fallback Initialen

(Hinweis: `profiles.avatar_url` kann später entfernt oder als Legacy-Fallback behalten werden.)

---

## Aufwandsschätzung (nur PNG-Bibliothek)

- Migration + DB-Layer: **0.5–1 Tag**
- Profil-UI Picker + Save Action: **0.5–1.5 Tage**
- Leaderboard-Rendering + Fallback: **0.5 Tag**
- Test/Polish: **0.5 Tag**

**Gesamt: ca. 2–3 Tage** für ein sauberes MVP.

---

## Konkrete Implementierungs-Checkliste (Repo-spezifisch)

1. Migration anlegen: `league_avatar_assignments` + beide Unique Constraints.
2. `src/lib/avatar-catalog.ts` hinzufügen (harte Whitelist + Labels + `src`).
3. PNGs nach `public/avatars/` legen.
4. Server Action `setLeagueAvatar(leagueId, avatarKey)` bauen (mit Transaction + Conflict-Handling).
5. App-Data erweitern: `avatarSrc` pro Leaderboard-/Profil-User auflösen.
6. `Avatar`-Komponente auf Bild + Fallback erweitern.
7. Profilseite um Avatar-Picker ergänzen.
8. Tests:
   - Whitelist-Validation
   - Double-claim Konflikt
   - UI-Fallback auf Initialen

---

## Endentscheidung

Für euren privaten Kreis ist die **vordefinierte PNG-Avatarbibliothek** die richtige Lösung:
- schnell,
- zuverlässig,
- wenig Komplexität,
- exakt passend zu „keine Duplikate“ und „first come first serve“.
