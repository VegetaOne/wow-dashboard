# WoW Dashboard – Konzept und Stand

> Stand: 2026-09-15 (v3 – ersetzt die Planung v2, die noch vor der Umsetzung entstand)
> Ziel: Docker-Container, self-hosted, mehrbenutzerfähig über Battle.net OAuth, erweiterbar für WoW Forever

---

## 1. Rahmenbedingungen (entschieden)

| Frage | Entscheid |
| --- | --- |
| Betrieb | Docker Compose, **nur Heimnetz**, kein HTTPS, `docker compose up` und lokal aufrufen |
| Teilen | Per URL. Der Kollege meldet sich mit **seinem eigenen** Battle.net-Account an und sieht nur seine Charaktere |
| Kein Claude Artifact | Artifacts dürfen keine externen API-Aufrufe machen (CSP), und eine `claude.ai`-Subdomain lässt sich nicht als Battle.net-Redirect-URI registrieren |
| Sprache | Deutsche Oberfläche, API-Locale `de_DE` |
| Spielmodi | Retail, Classic, Classic Era – Retail ist derzeit **nicht** der Fokus |
| Warcraft Logs | Bewusst als **Letztes**; alles andere zuerst |
| Code | GitHub, privates Repo `wow-dashboard` |

**Stack (umgesetzt):** Next.js 14 App Router, React 18, Tailwind, NextAuth, Prisma + SQLite.
Abweichungen zur alten Planung: **kein TanStack Query** (Server Components plus eigene
Snapshot-Schicht reichen), **kein Raider.IO** (Mythisch+ kommt aus der Blizzard-API selbst).

---

## 2. Was steht

### Übersicht
- Alle Charaktere des Accounts, gruppiert nach Spielmodus (Tabs) und darin nach Realm
- Fraktionswappen und -farbe, Klassenfarbe am Namen, Favoriten
- **Nachladen auf Abruf**: ein Realm lädt per `IntersectionObserver` erst beim Scrollen;
  Detailabrufe mit begrenzter Parallelität (`mapLimit`)

### Ausrüstung
- Paperdoll wie im Spiel: links, rechts, Waffen unten, **Charaktermodell** in der Mitte,
  vergrössert und drehbar (Renderbilder aus `character-media`)
- Item-Icons, Rahmen in Qualitätsfarbe, Hover-Tooltip mit Itemstufe, Attributen,
  Verzauberung und Sockeln

### Upgrades
- Fehlende Verzauberungen, leere Sockel, schwächste Slots gegen den eigenen Schnitt
- **Loot-Kandidaten** aus den Journal-Loot-Tabellen: welcher Boss welcher Instanz etwas
  für diesen Slot droppt, mit Icon und Tooltip. Index wird im Hintergrund aufgebaut
  und in SQLite gehalten

### Tabs je Charakter
Ausrüstung · Berufe · Fortschritt (Raids, Dungeons, Mythisch+) · Sammlungen (Titel,
Spielzeug, Reittiere, Haustiere) · Erfolge · **Ansehen** · **PvP** · Verlauf

### Querschnitt
- **Tagesschnappschüsse** je Charakter und Datensatz in SQLite. Der Tag ist Teil des
  eindeutigen Schlüssels. Folge: zweiter Aufruf am selben Tag kostet keine API-Anfrage,
  der Verlauf entsteht von selbst, und bei API-Ausfall zeigt die App den letzten
  bekannten Stand mit Hinweis statt einer leeren Seite
- Sparklines (Itemstufe, Erfolgspunkte, Fortschritt) als Inline-SVG, hell/dunkel
- Hell/Dunkel umschaltbar

---

## 3. Gelernte Fallen (damit sie nicht zweimal kosten)

- **Battle.net ist kein brauchbarer OIDC-Provider.** Es schreibt eine eigene Nonce ins
  ID-Token → `nonce mismatch`. Lösung: reiner OAuth2-Provider, Scope nur `wow.profile`,
  BattleTag über `userinfo`
- **Der Anzeigename eines angelegten Items steht auf oberster Ebene** des Eintrags,
  nicht unter `item.name`. Falsch gelesen bleiben Namen still leer – auch in Retail
- **Classic Era liefert kein `level`** an Ausrüstungsteilen und keine Verzauberungen;
  Mythisch+ gibt es nur in Retail. Antworten tolerant lesen
- **`skipDuplicates` gibt es in SQLite nicht** – Dedup auf Anwendungsebene
- **Prisma auf Alpine braucht `apk add openssl`** und den Binary-Target
  `linux-musl-openssl-3.0.x`
- **`toLocaleString` hängt an den ICU-Daten der Laufzeit.** Fehlt die Locale, fällt Node
  still auf `en-US` zurück: aus `12’345` wird `12,345` – auf Deutsch eine Dezimalzahl.
  Darum eigenes `format.ts`
- **Client/Server-Grenze:** eine `"use client"`-Komponente, die ein DB-Modul importiert,
  zieht Prisma ins Browser-Bundle. Darum `trend.ts` (rein) getrennt von `history.ts` (DB)
- **Das Profil aktualisiert sich erst, wenn der Charakter sich ausloggt.** Häufiger
  abfragen bringt nichts
- **`.env` niemals ins Image** (`COPY . .` tat das, bis `.dockerignore` existierte)

---

## 4. Haltung bei Datenlücken

Bewusst durchgezogen, weil ein hübscher falscher Wert schlimmer ist als ein Strich:

- Fehlt ein Wert, steht `—`, nicht `0`
- Eine Quote nur, wenn Zähler **und** Nenner bekannt sind; `0/0` liest sich nie als
  „vollständig"
- **Keine DPS- oder BiS-Aussagen** – der API fehlen die Statgewichte. Gezeigt wird, was
  belegbar ist: fehlende Verzauberungen, leere Sockel, schwache Slots
- **404 heisst „nie gespielt", nicht „Fehler"** (PvP-Wertungen). Solche Klassen erscheinen
  gar nicht, statt als leere Zeile
- Paragon ist kein weiterer Ansehensrang und wird getrennt ausgewiesen

---

## 5. Offen

Ohne Warcraft Logs:
- **Gilde** – Roster mit Itemstufe, Gildenerfolge, Aktivität
- **Auktionshaus / Berufs-Wirtschaft** – Herstellkosten gegen Verkaufspreis; braucht einen
  eigenen Index, die Antworten sind mehrere MB gross
- **Wochenübersicht / Reset-Tracker** – Resets, offene Lockouts, wöchentliche Belohnungen
  → siehe [Wochenübersicht](./wochenuebersicht.md)
- **Charaktervergleich** – zwei Charaktere nebeneinander. Zurückgestellt, siehe
  [Reihenfolge und Entscheide](./reihenfolge.md)
- **Hintergrund-Auffrischer** – blockiert durch einen Entscheid: dafür müssten
  Refresh-Tokens verschlüsselt und dauerhaft gespeichert werden

Danach:
- **Warcraft Logs** – braucht eine eigene Anwendung bei warcraftlogs.com (Client ID und
  Secret in die `.env`)
- **WoW Forever** – `src/lib/adapters/wow-forever.ts` ist ein dokumentierter Platzhalter.
  Sobald Blizzard den Namespace veröffentlicht, wird er dort eingetragen; die Oberfläche
  bleibt unverändert

---

## 6. Sicherheit

- `.env` steht in `.gitignore` **und** `.dockerignore` – weder im Repo noch im Image
- Das Battle.net Client Secret wurde einmal im Chat offengelegt und **muss in der
  Developer Console neu generiert werden**. Ein offengelegtes Secret bleibt offengelegt
- Scope ist ausschliesslich `wow.profile`; die App schreibt nichts nach Battle.net zurück
- Ohne HTTPS gehören Tokens nicht über fremde Netze – das Setup ist fürs Heimnetz

---

Siehe auch: [Roadmap](./roadmap.md) · [Reihenfolge und Entscheide](./reihenfolge.md) · [Setup-Modus](./setup-modus.md)
