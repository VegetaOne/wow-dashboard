<div align="center">

# ⚔️ WoW Dashboard

**A self-hosted companion for your own World of Warcraft account.**
Every character across every game mode, gear the way the character sheet shows it,
the upgrades you are actually missing, and a history that builds itself.

[![Next.js 14](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![SQLite](https://img.shields.io/badge/SQLite-file--based-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-compose%20up-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

Runs as a single Docker container on your home network.
Everyone signs in with their own Battle.net account and sees only their own characters.

</div>

> [!NOTE]
> Not affiliated with Blizzard Entertainment. All data comes from the official
> Battle.net API. World of Warcraft and WoW are trademarks of Blizzard Entertainment.

> [!IMPORTANT]
> The interface is currently **German**. An **English/German switch is planned, with
> English as the default** — see the [roadmap](#-roadmap). Item and faction names come
> from the API in the selected locale.

---

## Contents

- [✨ Features](#-features)
- [🚀 Quick start](#-quick-start)
- [🔑 Battle.net application](#-battlenet-application)
- [⚙ Configuration](#-configuration)
- [🏠 Sharing on your home network](#-sharing-on-your-home-network)
- [🧑‍💻 Development without Docker](#-development-without-docker)
- [🧠 How it works](#-how-it-works)
- [🌍 Game modes and WoW Forever](#-game-modes-and-wow-forever)
- [📁 Project structure](#-project-structure)
- [⚠ What the API cannot do](#-what-the-api-cannot-do)
- [🗺 Roadmap](#-roadmap)
- [🔒 Security](#-security)
- [📄 License](#-license)
- [🇩🇪 Deutsche Fassung](#-deutsche-fassung)

---

## ✨ Features

### Overview

- **Every character** on the account, grouped by game mode (Retail, Classic, Classic Era)
  and by realm within each mode
- **Faction-aware**: crest and colour per Horde/Alliance, class colour on the name
- **Favourites** pin the characters you actually play to the top
- **Loads on demand** — a realm is fetched when it scrolls into view, not all at once.
  With 40 characters that is the difference between usable and unusable

### Gear

- All equipped items as a **paperdoll**: left column, right column, weapons below,
  the way the game lays it out
- **Item icons** from the Game Data API, bordered in the item's quality colour
- **Hover tooltip** with item level, stats, enchant and sockets
- **Character model** in the middle, enlarged and rotatable (the API serves rendered
  views from several angles)

### Upgrades

- **Missing enchants and empty sockets**, per slot
- **Weakest slots** relative to your own average
- **Loot candidates** from the Journal API loot tables: which boss in which instance
  drops something for that slot, with icon and tooltip. The index is built in the
  background and kept in the database

> [!WARNING]
> No DPS numbers and no best-in-slot list. The API does not publish stat weights, so any
> such ranking would be invented. This app shows what the data supports and says so.

### Per-character tabs

<details>
<summary><b>What each tab shows</b></summary>

| Tab | Contents |
| --- | --- |
| **Gear** | Equipped items, paperdoll, character model, upgrades, loot candidates |
| **Professions** | Primary and secondary professions, skill tiers per expansion, known recipes |
| **Progression** | Raid and dungeon boss kills per difficulty with dates, Mythic+ rating and runs |
| **Collections** | Titles, toys, mounts and pets (account-wide, fetched once) |
| **Achievements** | Achievements by category, with point total |
| **Reputation** | Standing with every faction, highest tier first, paragon shown separately, with search |
| **PvP** | Honor level, honorable kills, 2v2 / 3v3 / RBG ratings, per-battleground statistics |
| **History** | Item level, achievement points and progression over time as sparklines |

</details>

### Across the app

- **Light and dark** mode
- **History for free**: every fetch is stored as a daily snapshot. That gives you trends,
  and when the API is down the app shows the last known state — clearly labelled — instead
  of an empty page
- **Honest about gaps**: a missing value renders as `—`, never as `0`. A ratio appears only
  when both numerator and denominator are known, so `0/0` never reads as "complete"

---

## 🚀 Quick start

**Requirements:** Docker and Docker Compose.

```bash
git clone https://github.com/<your-user>/wow-dashboard.git
cd wow-dashboard

docker compose up -d --build
```

The app is then on <http://localhost:3000>, where it walks you through setup on the
first visit: language, region and your Battle.net client ID and secret. There is no
configuration file to fill in — the values go into the database and can be changed
later under Settings.

The first build takes a few minutes — `npm install`, `prisma generate` and `next build`
all run inside the container. After that it starts in seconds.

```bash
docker compose logs -f app      # if something does not come up
docker compose down             # stop (the database volume survives)
```

---

## 🔑 Battle.net application

The app reads profile data with each user's own OAuth login, so it needs an application
in the Battle.net Developer Console.

1. Open <https://develop.battle.net> and sign in
2. **Create New Client** — any name, e.g. `wow-dashboard`
3. Set the **Redirect URI** to exactly this callback address:

   ```
   http://localhost:3000/api/auth/callback/battlenet
   ```

   To reach the app from other devices on your network, add the address with your local
   IP as well, e.g. `http://192.168.1.42:3000/api/auth/callback/battlenet`. Battle.net
   allows several redirect URIs per client — every address anyone signs in from has to
   be listed
4. Enter **Client ID** and **Client Secret** on the setup page, which also shows the
   redirect URI to copy

The only scope requested is `wow.profile`. The app never reads payment or account data
and never writes anything back to Battle.net.

---

## ⚙ Configuration

Configuration lives in the database, not in a file. On the first visit the app opens a
setup in two stages:

1. **Before signing in** — language, region, Battle.net client ID and secret. It has to
   be this way round: without those credentials there is no Battle.net login to put the
   setup behind. The page shows the exact redirect URI to paste into the Developer
   Console and checks the credentials against Battle.net before saving. It is reachable
   only while the setup is unfinished; afterwards it is closed.
2. **After signing in** — which game modes you care about, which one the roster starts
   on, how often it refreshes, and optionally Warcraft Logs credentials.

The account that finishes the setup becomes the owner of the instance and is the only
one who can change these values afterwards, under **Settings**. Changes take effect
immediately; no container restart.

The client secret is stored encrypted (AES-256-GCM). The key is generated on first use
and written next to the database as `config.key`. That protects the database file on its
own — a copied backup is useless without the key — but not against someone with access
to the filesystem. It is never displayed, and the settings form never sends it back.

The only environment variable left is `DATABASE_URL`, which Compose sets to the volume
path: without it the app could not find the database in the first place. `NEXTAUTH_URL`
is optional — when unset, the app derives the address from the request, so the same
instance works over `localhost` and over your LAN IP.

---

## 🏠 Sharing on your home network

The app is multi-user by design: everyone signs in with their own Battle.net account and
the character list comes from their own token. No data is shared between accounts.

1. Find your local IP — `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux)
2. Add `http://<that-ip>:3000/api/auth/callback/battlenet` as a redirect URI on the
   Battle.net client. Battle.net allows several per client, so `localhost` can stay.
3. Open the app from the other device at that address — nothing to reconfigure

> [!CAUTION]
> There is no HTTPS in this setup — it is built for a local network, not the open
> internet. Exposing it publicly requires a reverse proxy with TLS in front.

---

## 🧑‍💻 Development without Docker

```bash
npm install
cp .env.example .env                    # only DATABASE_URL matters

npx prisma migrate dev                  # create the database
npm run dev
```

Then open <http://localhost:3000> and go through the setup.

<details>
<summary><b>Useful commands</b></summary>

```bash
npx tsc --noEmit                        # type-check
npm run build                           # production build
npx prisma studio                       # inspect the database
npx prisma migrate dev --name <name>    # new migration
```

</details>

---

## 🧠 How it works

**Stack:** Next.js 14 (App Router) with React 18, Tailwind CSS, NextAuth for the
Battle.net OAuth login, Prisma with SQLite. No external service, no sign-up, no cloud.

**Login.** Battle.net is configured as a plain **OAuth2** provider, not an OIDC one —
it writes its own nonce into the ID token, which makes NextAuth's OIDC check fail with
`nonce mismatch`. The BattleTag therefore comes from the `userinfo` endpoint.

**Snapshots.** Every dataset is stored per character and per day in SQLite, with the day
as part of the unique key. Three things follow: a second call on the same day costs no API
request, the history builds itself, and when the API does not answer the app serves the
last known state with a timestamp instead of an error.

**On-demand loading.** Realms load via `IntersectionObserver` as you scroll, and detail
requests run with limited concurrency. That keeps the landing page fast and the rate
limit intact.

---

## 🌍 Game modes and WoW Forever

In the API the game modes differ only by namespace:

| Mode | Profile namespace |
| --- | --- |
| Retail | `profile-<region>` |
| Classic (current) | `profile-classic-<region>` |
| Classic Era | `profile-classic1x-<region>` |

The responses diverge in the details — Classic Era omits `level` on equipped items, has
no enchants at all, and Mythic+ exists only in Retail. The app reads responses
tolerantly and hides whatever a mode does not know about.

For **WoW Forever** there is a documented placeholder at
`src/lib/adapters/wow-forever.ts`. Once Blizzard publishes the namespace, the mode gets
added there — the interface needs no changes.

---

## 📁 Project structure

<details>
<summary><b>Where things live</b></summary>

```
src/
  app/                       Next.js App Router
    api/auth/                NextAuth route
    api/wow/                 internal endpoints for on-demand loading
    dashboard/[mode]/[realm]/[name]/
                             character pages (tabs as subfolders)
  components/                UI — paperdoll, tooltips, panels, charts
  lib/
    auth.ts                  Battle.net as an OAuth2 provider
    battlenet.ts             API access, namespaces, slots, colours
    character.ts             cached fetches per dataset
    snapshot.ts              snapshots, stale fallback, history
    journal.ts / loot.ts     loot tables and candidates
    reputations.ts / pvp.ts  reputation and PvP
    trend.ts / history.ts    sparkline geometry (pure) / data access
    adapters/                game modes, incl. the WoW Forever placeholder
    format.ts                numbers and dates without toLocaleString
prisma/
  schema.prisma
  migrations/
```

Two splits are deliberate:

- `trend.ts` (pure) is separate from `history.ts` (database) so the client-side chart
  component does not drag Prisma into the browser bundle
- `format.ts` avoids `toLocaleString` on purpose. If the runtime's ICU data is
  incomplete, Node falls back to `en-US` silently and `12’345` becomes `12,345` — which
  in German reads as a decimal

</details>

---

## ⚠ What the API cannot do

<details>
<summary><b>Worth knowing before something looks like a bug</b></summary>

- **The profile only updates when the character logs out.** Polling more often than every
  few minutes achieves nothing
- **No stat weights.** The API does not say which item is better for which playstyle. So
  the app shows missing enchants, empty sockets and weak slots — not a BiS list and not
  DPS figures
- **Things never played answer with 404.** For PvP brackets that means "never queued", not
  "error", and such brackets are not displayed at all
- **No grouping by expansion** for reputation — hence the search box
- **Gold, currencies and bag contents are not in the API** at all. Only an addon export
  could provide them
- **The character model is a rendered image**, not a 3D model — the rotation uses the
  angles the API serves
- **Rate limits** apply per client. Snapshots and on-demand loading exist for that reason

</details>

---

## 🗺 Roadmap

**Done:** character overview, gear with paperdoll and tooltips, upgrades and loot
candidates, professions, progression, collections, achievements, reputation, PvP, history.

| Next | What it needs |
| --- | --- |
| **🌐 English/German switch** | UI strings extracted, API locale per request, English as the default |
| **🏰 Guild** | Roster with item levels, guild achievements, activity |
| **💰 Auction house / craft economy** | Crafting cost versus sale price — needs its own index, responses run to several MB |
| **📅 Weekly overview** | Resets, open lockouts, weekly rewards |
| **⚖️ Character comparison** | Two characters side by side |
| **🔄 Background refresher** | Open question — it would require persisting encrypted refresh tokens |
| **📊 Warcraft Logs** | Raid performance; needs a separate application registered at warcraftlogs.com |
| **♾️ WoW Forever** | As soon as the API namespace is known |

---

## 🔒 Security

- The client secret lives encrypted in the database (AES-256-GCM) and nowhere else. The
  key sits beside the database as `config.key`, so a copied database file alone is
  useless — but anyone with filesystem access has both. That is the honest limit
- The secret is never displayed and never sent back to the browser. If it ever lands
  somewhere else — a chat, a commit, a screenshot — regenerate it in the Developer
  Console. A secret that has been exposed stays exposed
- The setup page is reachable without signing in, because the Battle.net login needs the
  credentials it collects. It is closed as soon as the setup is finished
- Session cookies are signed with a key generated during setup; replacing it would
  invalidate all sessions, so it is written once and never touched again
- `.env` is in `.gitignore` **and** `.dockerignore`, and holds nothing secret any more
- Without HTTPS, tokens should not travel across networks you do not control

---

## 📄 License

Private project — no license granted. If you have access to this repository and want to
reuse something, just ask.

---

## 🇩🇪 Deutsche Fassung

<details>
<summary><b>Aufklappen für die deutsche Dokumentation</b></summary>

<br>

**WoW Dashboard** — ein selbst gehosteter Companion für den eigenen World-of-Warcraft-Account:
alle Charaktere über alle Spielmodi, Ausrüstung wie im Charakterfenster, die Upgrades, die
wirklich fehlen, und ein Verlauf, der von selbst entsteht.

Läuft als einzelner Docker-Container im Heimnetz. Jede Person meldet sich mit ihrem eigenen
Battle.net-Account an und sieht ausschliesslich ihre eigenen Charaktere.

> [!NOTE]
> Nicht mit Blizzard Entertainment verbunden. Die Daten kommen aus der offiziellen
> Battle.net-API. Die Oberfläche ist derzeit deutsch; ein **Umschalter Englisch/Deutsch mit
> Englisch als Standard ist geplant**.

### Funktionen

**Übersicht** — Alle Charaktere des Accounts, gruppiert nach Spielmodus (Retail, Classic,
Classic Era) und darin nach Realm. Fraktionswappen und -farbe, Klassenfarbe am Namen,
Favoriten. **Nachladen auf Abruf:** ein Realm lädt erst, wenn er ins Bild scrollt — bei
40 Charakteren der Unterschied zwischen benutzbar und unbenutzbar.

**Ausrüstung** — Paperdoll wie im Spiel: links, rechts, Waffen unten, Charaktermodell in
der Mitte, vergrössert und drehbar. Item-Icons mit Rahmen in der Qualitätsfarbe,
Hover-Tooltip mit Itemstufe, Attributen, Verzauberung und Sockeln.

**Upgrades** — Fehlende Verzauberungen, leere Sockel, schwächste Slots gegen den eigenen
Schnitt. **Loot-Kandidaten** aus den Journal-Loot-Tabellen: welcher Boss welcher Instanz
etwas für diesen Slot droppt, mit Icon und Tooltip.

> [!WARNING]
> Keine DPS-Zahlen und keine BiS-Liste. Die API liefert keine Statgewichte — jede solche
> Rangfolge wäre erfunden. Gezeigt wird, was die Daten hergeben.

**Tabs je Charakter** — Ausrüstung · Berufe · Fortschritt (Raids, Dungeons, Mythisch+) ·
Sammlungen (Titel, Spielzeug, Reittiere, Haustiere) · Erfolge · Ansehen (Paragon getrennt
ausgewiesen) · PvP (Ehre, Wertungen, Schlachtfeld-Statistik) · Verlauf (Sparklines).

**Querschnitt** — Hell/Dunkel umschaltbar. **Verlauf ohne Zusatzaufwand:** jeder Abruf wird
als Tagesschnappschuss gespeichert; fällt die API aus, zeigt die App den letzten bekannten
Stand mit Hinweis statt einer leeren Seite. **Ehrlich bei Lücken:** fehlt ein Wert, steht
`—` und nicht `0`; eine Quote erscheint nur, wenn Zähler und Nenner bekannt sind.

### Schnellstart

Vorausgesetzt sind Docker und Docker Compose.

```bash
git clone https://github.com/<dein-user>/wow-dashboard.git
cd wow-dashboard

docker compose up -d --build
```

Die App läuft auf <http://localhost:3000> und führt beim ersten Aufruf durch die
Einrichtung: Sprache, Region, Battle.net Client ID und Secret. Es gibt keine
Konfigurationsdatei mehr auszufüllen — die Werte landen in der Datenbank und lassen
sich später unter Einstellungen ändern.

Der erste Build dauert einige Minuten. Logs: `docker compose logs -f app`.

### Battle.net-Anwendung

1. <https://develop.battle.net> öffnen und anmelden
2. **Create New Client**, Name frei wählbar
3. **Redirect URI** genau so eintragen:
   `http://localhost:3000/api/auth/callback/battlenet` — für Zugriff aus dem Heimnetz
   zusätzlich die Adresse mit der lokalen IP. Jede Adresse, unter der sich jemand anmeldet,
   muss dort stehen. Die Einrichtungsseite zeigt die passende Adresse zum Kopieren an
4. **Client ID** und **Client Secret** in die Einrichtungsseite eintragen

Verwendeter Scope ist ausschliesslich `wow.profile`. Die App schreibt nichts nach
Battle.net zurück.

### Konfiguration

Die Konfiguration liegt in der Datenbank, nicht in einer Datei. Beim ersten Aufruf
öffnet die App eine Einrichtung in zwei Stufen:

1. **Vor der Anmeldung** — Sprache, Region, Battle.net Client ID und Secret. Diese
   Reihenfolge ist zwingend: ohne Zugangsdaten gibt es keinen Battle.net-Login, hinter
   dem der Setup liegen könnte. Die Seite zeigt die exakte Redirect-URI zum Kopieren und
   prüft die Zugangsdaten vor dem Speichern gegen Battle.net. Erreichbar ist sie nur,
   solange der Setup offen ist; danach wird sie gesperrt.
2. **Nach der Anmeldung** — welche Spielmodi dich interessieren, womit die Kaderliste
   startet, wie oft sie nachzieht, optional Warcraft-Logs-Zugangsdaten.

Der Account, der den Setup abschliesst, wird Besitzer der Instanz und darf diese Werte
danach als Einziger ändern, unter **Einstellungen**. Änderungen greifen sofort, ohne
Neustart des Containers.

Das Client Secret liegt verschlüsselt (AES-256-GCM). Der Schlüssel entsteht beim ersten
Bedarf und liegt als `config.key` neben der Datenbank. Das schützt die Datenbankdatei
für sich — ein kopiertes Backup ist ohne Schlüssel wertlos —, nicht aber gegen jemanden
mit Zugriff aufs Dateisystem. Angezeigt wird das Secret nie, und das Einstellungsformular
sendet es auch nie zurück.

Übrig bleibt als Umgebungsvariable nur `DATABASE_URL`, die Compose auf das Volume setzt:
ohne sie fände die App die Datenbank gar nicht erst. `NEXTAUTH_URL` ist optional — ohne
Angabe leitet die App die Adresse aus der Anfrage ab, dieselbe Instanz funktioniert dann
über `localhost` und über die lokale IP.

### Im Heimnetz teilen

Lokale IP ermitteln (`ipconfig getifaddr en0` / `hostname -I`) und
`http://<diese-ip>:3000/api/auth/callback/battlenet` als weitere Redirect-URI beim
Battle.net-Client hinterlegen. Mehr ist nicht nötig: die App erkennt die Adresse, unter
der sie aufgerufen wurde, selbst.

> [!CAUTION]
> Kein HTTPS — das Setup ist fürs lokale Netz gedacht. Wer die App ins Internet stellt,
> braucht davor einen Reverse Proxy mit TLS.

### Entwicklung ohne Docker

```bash
npm install
cp .env.example .env                    # nur DATABASE_URL ist relevant
npx prisma migrate dev
npm run dev
```

Nützlich: `npx tsc --noEmit`, `npm run build`, `npx prisma studio`.

### Wie es funktioniert

**Stack:** Next.js 14 (App Router), React 18, Tailwind, NextAuth, Prisma mit SQLite.
Kein externer Dienst, keine Registrierung, keine Cloud.

**Login:** Battle.net wird als reiner **OAuth2**-Provider konfiguriert, nicht als OIDC —
es schreibt eine eigene Nonce ins ID-Token, woran die OIDC-Prüfung von NextAuth mit
`nonce mismatch` scheitert. Der BattleTag kommt darum über `userinfo`.

**Schnappschüsse:** Jeder Datensatz landet je Charakter und Tag in SQLite, der Tag ist Teil
des eindeutigen Schlüssels. Folge: zweiter Aufruf am selben Tag kostet keine API-Anfrage,
der Verlauf entsteht von selbst, und bei Ausfall gibt es den letzten Stand mit Zeitstempel.

**Nachladen:** Realms per `IntersectionObserver`, Detailabrufe mit begrenzter Parallelität.

### Spielmodi und WoW Forever

| Modus | Profil-Namespace |
| --- | --- |
| Retail | `profile-<region>` |
| Classic (aktuell) | `profile-classic-<region>` |
| Classic Era | `profile-classic1x-<region>` |

Die Antworten weichen im Detail ab: Classic Era liefert kein `level` an Ausrüstungsteilen
und keine Verzauberungen, Mythisch+ gibt es nur in Retail. Für **WoW Forever** liegt unter
`src/lib/adapters/wow-forever.ts` ein dokumentierter Platzhalter.

### Grenzen der API

- **Das Profil aktualisiert sich erst beim Ausloggen** des Charakters
- **Keine Statgewichte** — darum keine BiS-Liste und keine DPS-Zahlen
- **404 heisst „nie gespielt"**, nicht „Fehler" (PvP-Wertungen)
- **Keine Gruppierung nach Erweiterung** beim Ansehen — darum die Suche
- **Gold, Währungen und Taschen** führt die API nicht
- **Das Charaktermodell ist ein gerendertes Bild**, kein 3D-Modell
- **Ratelimit** pro Client — dafür gibt es Schnappschüsse und Nachladen auf Abruf

### Offen

Umschalter Englisch/Deutsch (Englisch als Standard) · Gilde · Auktionshaus und
Berufs-Wirtschaft · Wochenübersicht · Charaktervergleich · Hintergrund-Auffrischer
(braucht persistente, verschlüsselte Refresh-Tokens) · Warcraft Logs (eigene App-
Registrierung) · WoW Forever.

### Sicherheit

Das Client Secret liegt verschlüsselt in der Datenbank, der Schlüssel als `config.key`
daneben: eine kopierte Datenbankdatei allein nützt nichts, wer aufs Dateisystem kommt,
hat beides. Angezeigt wird es nie. Landet es woanders (Chat, Commit, Screenshot), in
der Developer Console neu generieren — ein offengelegtes Secret bleibt offengelegt.
Die Einrichtungsseite ist ohne Anmeldung erreichbar, weil der Login die Daten braucht,
die sie einsammelt; sobald der Setup durch ist, wird sie gesperrt. Ohne HTTPS gehören
Tokens nicht über fremde Netze.

</details>
