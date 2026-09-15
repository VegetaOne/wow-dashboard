# WoW Dashboard

Ein selbst gehosteter Companion für den eigenen World-of-Warcraft-Account:
alle Charaktere über alle Spielmodi hinweg, Ausrüstung wie im Charakterfenster,
mögliche Upgrades, Berufe, Fortschritt, Sammlungen, Erfolge, Ansehen und PvP –
mit Verlauf über die Zeit.

Läuft als einzelner Docker-Container im Heimnetz. Jede Person meldet sich mit
ihrem eigenen Battle.net-Account an und sieht ausschliesslich ihre eigenen
Charaktere.

> Nicht mit Blizzard Entertainment verbunden. Die Daten kommen aus der
> offiziellen Battle.net-API; WoW und World of Warcraft sind Marken von
> Blizzard Entertainment.

---

## Inhalt

- [Funktionen](#funktionen)
- [Schnellstart](#schnellstart)
- [Battle.net-Anwendung anlegen](#battlenet-anwendung-anlegen)
- [Konfiguration](#konfiguration)
- [Im Heimnetz teilen](#im-heimnetz-teilen)
- [Entwicklung ohne Docker](#entwicklung-ohne-docker)
- [Wie es funktioniert](#wie-es-funktioniert)
- [Spielmodi und WoW Forever](#spielmodi-und-wow-forever)
- [Projektstruktur](#projektstruktur)
- [Grenzen der API](#grenzen-der-api)
- [Roadmap](#roadmap)
- [Sicherheit](#sicherheit)

---

## Funktionen

### Übersicht

- **Alle Charaktere** des angemeldeten Accounts, gruppiert nach Spielmodus
  (Retail, Classic, Classic Era) und darin nach Realm.
- **Fraktionsbewusste Darstellung**: Wappen und Farbe je Horde/Allianz,
  Klassenfarbe am Namen.
- **Favoriten**: häufig gespielte Charaktere nach oben.
- **Nachladen auf Abruf**: Ein Realm lädt erst, wenn er ins Bild scrollt.
  Bei 40 Charakteren wird nicht alles auf einmal geholt.

### Ausrüstung

- Alle angelegten Gegenstände als Paperdoll – links, rechts, Waffen unten,
  genau wie im Spiel.
- **Item-Icons** aus der Game-Data-API, Rahmen in der Qualitätsfarbe.
- **Hover-Tooltip** mit Itemstufe, Attributen, Verzauberung und Sockeln.
- **Charaktermodell** in der Mitte, vergrössert und drehbar (die API liefert
  Renderbilder aus mehreren Winkeln).

### Upgrades

- **Fehlende Verzauberungen und leere Sockel** je Slot.
- **Schwächste Slots** im Vergleich zum eigenen Schnitt – ohne Behauptungen
  über DPS, denn dafür fehlen der API die Statgewichte.
- **Loot-Kandidaten** aus den Loot-Tabellen der Journal-API: welche Bosse
  welcher Instanz etwas für diesen Slot droppen, mit Icon und Tooltip.
  Der Index wird im Hintergrund aufgebaut und in der Datenbank gehalten.

### Weitere Tabs je Charakter

| Tab | Inhalt |
| --- | --- |
| **Berufe** | Haupt- und Nebenberufe, Fertigkeitsstufen je Erweiterungsstufe, bekannte Rezepte |
| **Fortschritt** | Raid- und Dungeon-Bosskills je Schwierigkeit mit Datum, Mythisch+ Wertung und Läufe |
| **Sammlungen** | Titel, Spielzeug, Reittiere und Haustiere (account-weit, einmal geladen) |
| **Erfolge** | Erfolge nach Kategorie, mit Punktestand |
| **Ansehen** | Ruf bei allen Fraktionen, höchste Stufe zuerst, Paragon getrennt ausgewiesen, mit Suche |
| **PvP** | Ehrestufe, ehrenhafte Siege, Wertungen für 2v2/3v3/RBG und Statistik je Schlachtfeld |
| **Verlauf** | Entwicklung von Itemstufe, Erfolgspunkten und Fortschritt über die Zeit als Sparkline |

### Allgemein

- **Deutsche Oberfläche** (`de_DE`), auch die Item- und Fraktionsnamen aus
  der API.
- **Hell/Dunkel** umschaltbar.
- **Verlauf ohne Zusatzaufwand**: Jeder Abruf wird als Tagesschnappschuss
  gespeichert. Damit gibt es Historie, und wenn die API ausfällt, zeigt die App
  den letzten bekannten Stand statt einer leeren Seite – sichtbar
  gekennzeichnet.

---

## Schnellstart

Vorausgesetzt sind Docker und Docker Compose.

```bash
git clone <URL dieses Repos> wow-dashboard
cd wow-dashboard

# Konfiguration anlegen
cp .env.example .env

# Session-Schlüssel erzeugen und in .env bei NEXTAUTH_SECRET eintragen
openssl rand -base64 32

# Battle.net Client ID und Secret in .env eintragen (siehe unten)
# Danach:
docker compose up -d --build
```

Die App läuft dann auf <http://localhost:3000>.

Der erste Build dauert einige Minuten, weil im Container `npm install`,
`prisma generate` und `next build` laufen. Danach startet der Container in
Sekunden.

Logs ansehen, falls etwas nicht startet:

```bash
docker compose logs -f app
```

---

## Battle.net-Anwendung anlegen

Die App greift mit dem OAuth-Login des jeweiligen Nutzers auf dessen
Profildaten zu. Dafür braucht es eine eigene Anwendung in der Battle.net
Developer Console:

1. <https://develop.battle.net> öffnen und mit dem Battle.net-Account anmelden.
2. **Create New Client** – Name frei wählbar, z. B. `wow-dashboard`.
3. Als **Redirect URI** genau die Callback-Adresse eintragen:

   ```
   http://localhost:3000/api/auth/callback/battlenet
   ```

   Soll die App auch von anderen Geräten im Heimnetz erreichbar sein, zusätzlich
   die Adresse mit der lokalen IP eintragen, z. B.
   `http://192.168.1.42:3000/api/auth/callback/battlenet`. Battle.net erlaubt
   mehrere Redirect-URIs pro Client – jede Adresse, unter der sich jemand
   anmeldet, muss dort stehen.
4. **Client ID** und **Client Secret** in die `.env` übernehmen.

Der verwendete Scope ist ausschliesslich `wow.profile`. Die App liest nie
Zahlungs- oder Accountdaten und schreibt nichts nach Battle.net zurück.

---

## Konfiguration

Alle Werte stehen in der `.env` (Vorlage: `.env.example`). Die Datei ist
bewusst **nicht** im Repository und wird auch nicht ins Docker-Image kopiert.

| Variable | Bedeutung |
| --- | --- |
| `NEXTAUTH_URL` | Adresse, unter der die App aufgerufen wird. Muss zu einer Redirect-URI im Battle.net-Client passen. |
| `NEXTAUTH_SECRET` | Schlüssel für die Session-Verschlüsselung. `openssl rand -base64 32` |
| `BNET_CLIENT_ID` | Client ID aus der Developer Console |
| `BNET_CLIENT_SECRET` | Client Secret aus der Developer Console |
| `BNET_REGION` | `eu`, `us`, `kr` oder `tw` |
| `DATABASE_URL` | Wird von Compose auf das Volume gesetzt – in der `.env` nicht überschreiben. |

`docker-compose.yml` lädt die `.env` über `env_file`. Fehlt die Datei, bricht
Compose mit einer klaren Meldung ab, statt still mit leeren Werten zu starten.

---

## Im Heimnetz teilen

Die App ist von Anfang an mehrbenutzerfähig: Jede Person meldet sich mit ihrem
eigenen Battle.net-Account an, und die Charakterliste kommt aus deren eigenem
Token. Es gibt keinen geteilten Datenbestand zwischen Accounts.

Damit jemand anderes im Heimnetz zugreifen kann:

1. Lokale IP des Rechners ermitteln (`ipconfig getifaddr en0` auf macOS,
   `hostname -I` auf Linux).
2. `NEXTAUTH_URL` in der `.env` auf `http://<diese-IP>:3000` setzen.
3. Dieselbe Adresse als Redirect-URI im Battle.net-Client hinterlegen.
4. `docker compose up -d` neu starten.

HTTPS ist dafür nicht eingerichtet – das Setup ist fürs lokale Netz gedacht,
nicht fürs offene Internet. Wer die App ins Internet stellt, braucht davor
einen Reverse Proxy mit TLS.

---

## Entwicklung ohne Docker

```bash
npm install
cp .env.example .env          # Werte eintragen
echo 'DATABASE_URL="file:./dev.db"' >> .env

npx prisma migrate dev        # Datenbank anlegen
npm run dev
```

Nützliche Befehle:

```bash
npx tsc --noEmit              # Typen prüfen
npm run build                 # Produktionsbuild
npx prisma studio             # Datenbank ansehen
npx prisma migrate dev --name <name>   # neue Migration
```

---

## Wie es funktioniert

**Stack:** Next.js 14 (App Router) mit React 18, Tailwind CSS, NextAuth für
den Battle.net-OAuth-Login, Prisma mit SQLite als Datenbank. Kein externer
Dienst, keine Registrierung, keine Cloud.

**Login:** Battle.net wird als reiner OAuth2-Provider konfiguriert, nicht als
OIDC-Provider. Grund: Battle.net schreibt eine eigene Nonce ins ID-Token, was
die OIDC-Prüfung von NextAuth scheitern lässt (`nonce mismatch`). Der BattleTag
kommt darum über den `userinfo`-Endpunkt.

**Schnappschüsse:** Jeder Datensatz je Charakter und Tag landet als Snapshot in
SQLite. Der Tag ist Teil des eindeutigen Schlüssels. Daraus folgt dreierlei:
Ein zweiter Aufruf am selben Tag kostet keine API-Anfrage, der Verlauf entsteht
von selbst, und wenn die API nicht antwortet, liefert die App den letzten
bekannten Stand mit Hinweis („Letzter bekannter Stand vom …") statt eines
Fehlers.

**Nachladen:** Realms laden per `IntersectionObserver` erst beim Scrollen,
Detailabrufe laufen mit begrenzter Parallelität. Das schont das Ratelimit und
hält die Startseite schnell.

**Ehrlichkeit bei Lücken:** Fehlt ein Wert, zeigt die App `—` und nicht `0`.
Eine Quote wird nur berechnet, wenn Zähler und Nenner bekannt sind; `0/0` liest
sich nie als „vollständig". Wo die API etwas nicht hergibt, steht das im
Interface.

---

## Spielmodi und WoW Forever

Die Spielmodi unterscheiden sich in der API nur über den Namespace:

| Modus | Profil-Namespace |
| --- | --- |
| Retail | `profile-<region>` |
| Classic (aktuell) | `profile-classic-<region>` |
| Classic Era | `profile-classic1x-<region>` |

Die Antworten weichen im Detail voneinander ab – in Classic Era fehlt etwa das
`level`-Feld an Ausrüstungsteilen, Verzauberungen gibt es dort nicht, und
Mythisch+ existiert nur in Retail. Die App liest die Antworten darum tolerant
und blendet aus, was ein Modus nicht kennt.

Für **WoW Forever** liegt unter `src/lib/adapters/wow-forever.ts` ein
dokumentierter Platzhalter. Sobald Blizzard den Namespace veröffentlicht, ist
dort der Modus einzutragen; die Oberfläche braucht dafür keine Änderung.

---

## Projektstruktur

```
src/
  app/                       Next.js App Router
    api/auth/                NextAuth-Route
    api/wow/                 interne Endpunkte fürs Nachladen
    dashboard/[mode]/[realm]/[name]/
                             Charakterseiten (Tabs als Unterordner)
  components/                UI – Paperdoll, Tooltips, Panels, Charts
  lib/
    auth.ts                  Battle.net als OAuth2-Provider
    battlenet.ts             API-Zugriff, Namespaces, Slots, Farben
    character.ts             gecachte Abrufe je Datensatz
    snapshot.ts              Schnappschüsse, Stale-Fallback, Verlauf
    journal.ts / loot.ts     Loot-Tabellen und Kandidaten
    reputations.ts / pvp.ts  Ansehen und PvP
    trend.ts / history.ts    Sparkline-Geometrie (rein) / Datenzugriff
    adapters/                Spielmodi, inkl. Platzhalter für WoW Forever
    format.ts                Zahlen und Datum ohne toLocaleString
prisma/
  schema.prisma
  migrations/
```

`trend.ts` und `history.ts` sind getrennt, damit die Chart-Komponente auf dem
Client nicht Prisma in das Browser-Bundle zieht. `format.ts` verzichtet
absichtlich auf `toLocaleString`: fehlen im Container die ICU-Daten, fällt Node
still auf `en-US` zurück, und aus `12’345` würde `12,345` – auf Deutsch als
Dezimalzahl zu lesen.

---

## Grenzen der API

Gut zu wissen, bevor etwas als Fehler aussieht:

- **Das Profil aktualisiert sich erst beim Ausloggen** des Charakters. Häufiger
  als alle paar Minuten abzufragen bringt nichts.
- **Keine Statgewichte.** Die API sagt nicht, welches Item für welche Spielart
  besser ist. Die App zeigt deshalb fehlende Verzauberungen, leere Sockel und
  schwache Slots – aber keine BiS-Liste und keine DPS-Zahlen.
- **Ungespieltes antwortet mit 404.** Bei PvP-Wertungen heisst das „nie
  angetreten", nicht „Fehler". Die App zeigt solche Klassen gar nicht an.
- **Keine Gruppierung nach Erweiterung** beim Ansehen – darum die Suche.
- **Ratelimit** pro Client. Schnappschüsse und Nachladen auf Abruf sind genau
  dafür da.

---

## Roadmap

Umgesetzt: Charakterübersicht, Ausrüstung mit Paperdoll und Tooltips, Upgrades
und Loot-Kandidaten, Berufe, Fortschritt, Sammlungen, Erfolge, Ansehen, PvP,
Verlauf.

Geplant:

- **Gilde** – Roster mit Itemstufe, Gildenerfolge, Aktivität
- **Auktionshaus / Berufs-Wirtschaft** – Herstellkosten gegen Verkaufspreis
  (braucht einen eigenen Index, die Antworten sind mehrere MB gross)
- **Wochenübersicht** – Resets, offene Lockouts, wöchentliche Belohnungen
- **Charaktervergleich** – zwei Charaktere nebeneinander
- **Hintergrund-Auffrischer** – noch offen, weil dafür verschlüsselte
  Refresh-Tokens persistent gespeichert werden müssten
- **Warcraft Logs** – Raid-Performance; braucht eine eigene Anwendung bei
  warcraftlogs.com mit Client ID und Secret
- **WoW Forever** – sobald der Namespace der API bekannt ist

---

## Sicherheit

- Die `.env` ist in `.gitignore` **und** in `.dockerignore`. Sie landet weder
  im Repository noch im Image.
- Das Client Secret gehört ausschliesslich in die `.env`. Wer es versehentlich
  woanders hinschreibt (Chat, Commit, Screenshot), sollte es in der Developer
  Console neu generieren – ein einmal offengelegtes Secret bleibt offengelegt.
- Die Session-Cookies sind mit `NEXTAUTH_SECRET` signiert. Ein neuer Wert
  macht alle bestehenden Sessions ungültig.
- Ohne HTTPS gehören Tokens nicht über fremde Netze. Das Setup ist fürs
  Heimnetz gedacht.
