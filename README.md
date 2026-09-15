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

# Create the configuration
cp .env.example .env

# Generate a session key and put it in .env as NEXTAUTH_SECRET
openssl rand -base64 32

# Add your Battle.net client ID and secret to .env (see below), then:
docker compose up -d --build
```

The app is then on <http://localhost:3000>.

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
4. Copy **Client ID** and **Client Secret** into your `.env`

The only scope requested is `wow.profile`. The app never reads payment or account data
and never writes anything back to Battle.net.

---

## ⚙ Configuration

All values live in `.env` (template: `.env.example`). That file is deliberately **not**
in the repository and is not copied into the Docker image.

| Variable | Meaning |
| --- | --- |
| `NEXTAUTH_URL` | The address the app is served on. Must match a redirect URI on the Battle.net client |
| `NEXTAUTH_SECRET` | Key for session encryption — `openssl rand -base64 32` |
| `BNET_CLIENT_ID` | Client ID from the Developer Console |
| `BNET_CLIENT_SECRET` | Client secret from the Developer Console |
| `BNET_REGION` | `eu`, `us`, `kr` or `tw` |
| `DATABASE_URL` | Set by Compose to the volume path — do not override it in `.env` |

`docker-compose.yml` loads `.env` via `env_file`. If the file is missing, Compose stops
with a clear error instead of starting silently with blank values.

---

## 🏠 Sharing on your home network

The app is multi-user by design: everyone signs in with their own Battle.net account and
the character list comes from their own token. No data is shared between accounts.

1. Find your local IP — `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux)
2. Set `NEXTAUTH_URL=http://<that-ip>:3000` in `.env`
3. Add the same address as a redirect URI on the Battle.net client
4. `docker compose up -d`

> [!CAUTION]
> There is no HTTPS in this setup — it is built for a local network, not the open
> internet. Exposing it publicly requires a reverse proxy with TLS in front.

---

## 🧑‍💻 Development without Docker

```bash
npm install
cp .env.example .env                    # fill in the values
echo 'DATABASE_URL="file:./dev.db"' >> .env

npx prisma migrate dev                  # create the database
npm run dev
```

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

- `.env` is in `.gitignore` **and** `.dockerignore`. It reaches neither the repository nor
  the image
- The client secret belongs in `.env` and nowhere else. If it ever lands somewhere else —
  a chat, a commit, a screenshot — regenerate it in the Developer Console. A secret that
  has been exposed stays exposed
- Session cookies are signed with `NEXTAUTH_SECRET`; changing it invalidates all sessions
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

cp .env.example .env
openssl rand -base64 32        # Ergebnis als NEXTAUTH_SECRET in die .env

# Battle.net Client ID und Secret in die .env eintragen, dann:
docker compose up -d --build
```

Die App läuft auf <http://localhost:3000>. Der erste Build dauert einige Minuten.
Logs: `docker compose logs -f app`.

### Battle.net-Anwendung

1. <https://develop.battle.net> öffnen und anmelden
2. **Create New Client**, Name frei wählbar
3. **Redirect URI** genau so eintragen:
   `http://localhost:3000/api/auth/callback/battlenet` — für Zugriff aus dem Heimnetz
   zusätzlich die Adresse mit der lokalen IP. Jede Adresse, unter der sich jemand anmeldet,
   muss dort stehen
4. **Client ID** und **Client Secret** in die `.env`

Verwendeter Scope ist ausschliesslich `wow.profile`. Die App schreibt nichts nach
Battle.net zurück.

### Konfiguration

| Variable | Bedeutung |
| --- | --- |
| `NEXTAUTH_URL` | Adresse, unter der die App läuft. Muss zu einer Redirect-URI passen |
| `NEXTAUTH_SECRET` | Schlüssel für die Session-Verschlüsselung |
| `BNET_CLIENT_ID` | Client ID aus der Developer Console |
| `BNET_CLIENT_SECRET` | Client Secret aus der Developer Console |
| `BNET_REGION` | `eu`, `us`, `kr` oder `tw` |
| `DATABASE_URL` | Setzt Compose auf das Volume — in der `.env` nicht überschreiben |

`docker-compose.yml` lädt die `.env` über `env_file`. Fehlt sie, bricht Compose mit klarer
Meldung ab statt still mit leeren Werten zu starten.

### Im Heimnetz teilen

Lokale IP ermitteln (`ipconfig getifaddr en0` / `hostname -I`), `NEXTAUTH_URL` darauf
setzen, dieselbe Adresse als Redirect-URI hinterlegen, `docker compose up -d`.

> [!CAUTION]
> Kein HTTPS — das Setup ist fürs lokale Netz gedacht. Wer die App ins Internet stellt,
> braucht davor einen Reverse Proxy mit TLS.

### Entwicklung ohne Docker

```bash
npm install
cp .env.example .env
echo 'DATABASE_URL="file:./dev.db"' >> .env
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

`.env` steht in `.gitignore` **und** `.dockerignore` — weder im Repo noch im Image. Das
Client Secret gehört ausschliesslich dorthin; landet es woanders (Chat, Commit,
Screenshot), in der Developer Console neu generieren. Ein offengelegtes Secret bleibt
offengelegt. Ohne HTTPS gehören Tokens nicht über fremde Netze.

</details>
