# WoW Dashboard — Arbeitsanweisung

Self-hosted Companion für **WoW Forever** (seit 2026-11-11 der einzige Spielmodus;
Retail, Classic und Classic Era sind entfernt). Next.js 14 (App Router), React 18, TypeScript strict,
Tailwind, NextAuth (Battle.net als **OAuth2**, nicht OIDC), Prisma + SQLite, ein
Docker-Container im Heimnetz. Sprache des Codes und der Kommentare: **Deutsch**.
Oberflächentexte: über das Wörterbuch, Leitsprache Englisch.

Ausführliche Doku: `README.md` (Betrieb, Features, Grenzen der API) und `docs/`
(Konzept, Reihenfolge, offene Entscheide). **`docs/` ist die Quelle** — der Obsidian-Vault
ist nur ein Spiegel davon.

## Befehle

```bash
npm run dev                          # Entwicklung
npx tsc --noEmit                     # Typprüfung — nach jeder Änderung
npm run build                        # Produktionsbau, prüft ebenfalls Typen
npm run lint
npx prisma migrate dev --name <name> # neue Migration
npx prisma generate                  # nach Schemaänderung
npx prisma studio                    # Datenbank ansehen
docker compose up --build            # wie es beim Nutzer läuft
```

`npm test` läuft mit `node:test` (steckt in Node 20, braucht keine Abhängigkeit) und
deckt das Secret-Format in `tools/` und die Reset-Arithmetik in `tests/` ab. TypeScript ohne
Importe lässt sich wie in `tests/reset.test.mjs` mit `ts.transpileModule` laden. Wenn du etwas mit Arithmetik oder Krypto
anfasst (`src/lib/reset.ts`, `lockouts.ts`, `secrets.ts`), lege Tests dazu an und trage sie
im Skript in `package.json` ein. Ändert sich das Format in `secrets.ts`, muss
`tools/secret-format.mjs` mitziehen – der Testvektor bricht sonst. Vorhandene Testbehauptungen in `docs/` stammen aus Wegwerf-Skripten,
die nicht im Repo liegen.

## Wo was hingehört

```
src/app/                    App Router
  api/wow/                  interne Endpunkte fürs Nachladen auf Abruf
  api/setup/, api/settings/  Konfiguration
  dashboard/[character]/<tab>/   Charakterseiten (`{name}-{surname}`), ein Ordner je Tab
  dashboard/woche/          Wochenübersicht (Account-Ebene, kein Charakter-Tab)
  dashboard/talentplaner/   Talentplaner je Klasse (Account-Ebene, in der Kopfzeile)
  api/talent-builds/, api/talent-targets/   Builds und Ziel-Build je Charakter (Nutzerdaten)
src/components/             UI
src/lib/                    alles Fachliche
  battlenet.ts              API-Zugriff (bnetGet), Namespaces, Slugs, Slots, Farben
  character.ts              Abrufe je Datensatz
  snapshot.ts               Tagesschnappschüsse, Fallback auf alten Stand, Verlauf
  config.ts / config-cache.ts / secrets.ts / runtime.ts   Konfiguration
  i18n.ts / t.ts / dict/    Übersetzung
  trend.ts (rein) / history.ts (DB)
  talent-tree.ts (rein: Einlesen, Regeln, Vergleich, JSON) / talents.ts (API) / talent-builds.ts (DB)
  gameIcons.ts              Fraktions- und Klassen-Icons vom Blizzard-CDN (rein)
  format.ts, money.ts       Zahlen und Daten ohne toLocaleString
prisma/schema.prisma        + migrations/
docs/                       Konzept und Reihenfolge
```

Ein neuer Charakter-Tab: Ordner unter `dashboard/[character]/`, Eintrag in
`src/lib/characterTabs.ts` (`enabled` erst auf `true`, wenn die Seite etwas zeigt —
so gibt es nie einen Tab ins Leere), Beschriftung als Wörterbuchschlüssel.

## Harte Regeln

**Ehrlichkeit der Anzeige.** Das ist die Leitlinie des Projekts, nicht Kosmetik:

- Fehlt ein Wert, steht `—`, nie `0`.
- Eine Quote nur, wenn Zähler **und** Nenner bekannt sind. `0/0` darf nie wie
  „vollständig" aussehen.
- **Keine DPS-Zahlen, kein Best-in-Slot, keine Itemwertung.** Der API fehlen die
  Statgewichte; jede Rangfolge wäre erfunden. Gezeigt wird das Belegbare: fehlende
  Verzauberungen, leere Sockel, schwache Slots. (Loot-Kandidaten sind entfallen: die
  Journal-API liefert für Forever keine Instanzen.)
- **404 heisst „nie gespielt", nicht „Fehler"** (PvP-Klassen). Solche Abschnitte
  erscheinen gar nicht, statt leer.
- Ein unbekannter Reagenzpreis macht eine Kostensumme **unbekannt**, nicht kleiner.
- Was die App schätzt oder annimmt, schreibt sie dazu („Lockout angenommen",
  „Zeit unbelegt", „aus 12 von 30 geladen").

**Client/Server-Grenze.** Eine `"use client"`-Komponente, die ein DB-Modul importiert,
zieht Prisma ins Browser-Bündel und der Bau bricht. Darum die Paare
`trend.ts`/`history.ts`, `i18n.ts`/`t.ts`, `config-cache.ts`/`config.ts` — beim
Erweitern auf der richtigen Seite bleiben.

**Keine laufzeitabhängigen Konstanten auf Modulebene.** Region und Sprache stehen in der
Datenbank und ändern sich zur Laufzeit. `const API_BASE = ...` friert sie beim Laden des
Moduls ein. Immer `region()`, `locale()`, `apiBase()`, `oauthBase()` aus
`src/lib/runtime.ts` aufrufen, und Namespaces über `namespace()` aus `battlenet.ts`.

**Keine festen Oberflächentexte.** Immer über `t()` — `await getT()` in Server-, `useT()`
in Client-Komponenten. Schlüssel mit Bereichspräfix in `src/lib/dict/<bereich>.ts`,
Englisch definiert, Deutsch vollständig. Siehe `docs/i18n.md`.

**Nie `toLocaleString()` ohne Locale.** Fehlen der Laufzeit die ICU-Daten, fällt Node
still auf `en-US` zurück, und `12’345` wird zu `12,345` — auf Deutsch eine Dezimalzahl.
`src/lib/format.ts` benutzen.

**Die Forever-API ist nicht dokumentiert.** Namespaces `profile-`, `static-`,
`dynamic-forever-{region}`, gefunden von der Community (Quellen in `docs/roadmap.md`).
Alle Abrufe gehen über `bnetGet()` in `battlenet.ts`, damit Namespace und Fehlerform an
einer Stelle stehen; neue Module bauen keinen eigenen `fetch`.

**Charaktere und Gilden haben keinen Realm.** Ein Charakter ist `{name}-{surname}`
(klein), nur **je Region** eindeutig – darum steht die Region in jedem Datenbankschlüssel.
Pfade über `characterPath(slug, sub)`, Slug aus dem Pfadsegment über `characterFromParam`.

**404 heisst bei Forever meist „noch keine Daten"**, nicht „Fehler": Charaktere erscheinen
erst ab Stufe 10 und nach dem ersten Ausloggen, Bilder später, vielen älteren Gegenständen
fehlen die Stammdaten. `attempt()` setzt `notFound`, die Oberfläche zeigt `<NoDataYet />`.

**Antworten tolerant lesen.** Nie annehmen, dass ein Feld da ist – bei einer
undokumentierten API erst recht nicht.

**Der Anzeigename eines angelegten Items steht auf oberster Ebene** des Eintrags, nicht
unter `item.name`. Falsch gelesen bleiben Namen still leer.

**SQLite kennt `skipDuplicates` nicht.** Dedup auf Anwendungsebene.

**Das Profil aktualisiert sich erst, wenn der Charakter sich ausloggt.** Häufiger
abfragen bringt nichts; kein Polling unter mehreren Minuten einbauen.

**Neue Datensätze gehen über `snapshot.ts`**, nicht mit einem eigenen Abruf pro Aufruf:
ein Stand je Charakter, Datensatz und Tag. Der Verlauf entsteht daraus, und bei
API-Ausfall zeigt die App den letzten bekannten Stand mit Zeitstempel.

**Nachladen auf Abruf beibehalten.** Ratenbegrenzung gilt pro Client; eine Ansicht holt
ihre Daten selbst und erst wenn sie sichtbar ist.

## Niemals

- `.env`, `prisma/config.key`, `*.db` oder `dev.log` committen oder ins Image kopieren.
  Secrets nie in Code, Logs, Kommentare oder Commit-Nachrichten.
- Das Battle.net Client Secret ausgeben oder zurücksenden. Ein leeres Feld im
  Einstellungsformular bedeutet „unverändert".
- Fremdquellen ohne dokumentierte API in den Kern bauen (Wowhead, Raidbots,
  Sixty Upgrades). Höchstens als abschaltbarer Zusatz, von dem nichts abhängt.
- Scope über `wow.profile` hinaus erweitern. Die App schreibt nichts nach Battle.net.
- Eine Datei löschen oder eine Migration umschreiben, die schon ausgeliefert ist.
  Neue Migration statt Änderung an einer alten.
- Datenquellen einplanen, die für Forever nicht belegt sind. Die Liste „Gestrichen bis
  bestätigt" in `docs/roadmap.md` gilt, bis ein Test mit echten Daten sie auflöst.

## Fallen, die im Code stehen

- **Der Static-Namespace kann versioniert sein.** Vor dem Start lieferte nur
  `static-1.60.1_70399-forever-eu`, nicht `static-forever-eu`. `bnetGet` lernt die
  Version aus dem Account-Profil und weicht bei 403 darauf aus – nie hart verdrahten.
- **Auktionshäuser hängen am Ruleset, aber alle Rulesets liefern dieselben.** Gespeichert
  wird je Region und Haus; über Rulesets summiert stünde jeder Preis mehrfach da.
  Der Index braucht den Schrägstrich am Ende (`/auctions/`), sonst 404. **Waren
  (Leder, Stoff, Erz …) stehen nicht in `auctions`**, sondern unter `commodities` –
  wer nur `auctions` liest, hat keinen einzigen Reagenzpreis.
- **Prisma auf Alpine** braucht `apk add openssl` und den Binary-Target
  `linux-musl-openssl-3.0.x`.
- **Zustand auf Modulebene ist nicht geteilt.** Next bündelt `src/lib/*` in jede Seite
  und jede Route einzeln; eine `let cache` gibt es dann einmal pro Bündel. Das hat den
  Setup in eine Endlosschleife geschickt. Geteilter Zustand gehört an `globalThis`
  (`Symbol.for(...)`), siehe `config-cache.ts`.
- **Keine Seite darf beim Bauen vorgerechnet werden.** Alles hängt an der Konfiguration
  in der Datenbank, die es beim `next build` nicht gibt. Das Root-Layout setzt darum
  `dynamic = "force-dynamic"`. Im Build-Protokoll muss jede Seite `ƒ` sein; ein `○`
  heisst, ihr Ergebnis – samt Weiterleitungen – ist fest im Image.
- **`src/instrumentation.ts` wird auch fürs Edge-Bündel übersetzt.** Node-Module nur in
  genau der Form `if (process.env.NEXT_RUNTIME === "nodejs") { await import(…) }` laden;
  ein frühes `return` davor lässt den Bau an `crypto` brechen.
- **Battle.net stellt keine Refresh-Tokens aus.** Ein Nutzertoken lebt 24 Stunden; danach
  meldet man sich neu an. Arbeit ohne Nutzer im Browser hätte nur ein App-Token – ein
  Hintergrund-Auffrischer ist darum gebaut und bewusst wieder verworfen worden
  (`docs/setup-modus.md`).
- **Der Setup ist ungeschützt, solange er offen ist** – bewusst, die Instanz läuft im
  Heimnetz. Der Einrichtungscode im Log ist am 2026-11-13 entfernt worden
  (`docs/setup-modus.md`); nicht ohne Rückfrage wieder einbauen.
- **`config.key` gehört zur Datenbank.** Beides zusammen ins Backup, sonst ist das
  verschlüsselte Secret verloren.

## Arbeitsweise

- Vor einer Änderung die betroffene Datei lesen. Die Kommentare im Code erklären, warum
  etwas so ist — meist steckt eine bereits bezahlte Lehre darin. Nicht wegräumen.
- Kommentare auf Deutsch, im Ton der bestehenden: was und warum, keine Wiederholung
  des Codes.
- Nach jeder Änderung `npx tsc --noEmit`, vor dem Abschluss `npm run build`.
- Was ohne echte Battle.net-Zugangsdaten nicht prüfbar ist, wird als ungeprüft benannt,
  nicht als fertig. Der OAuth-Durchlauf, der Setup und alles, was echte Charakterdaten
  braucht, fällt darunter.
- Reihenfolge und Prioritäten stehen in `docs/reihenfolge.md` — die gilt, auch wenn
  `docs/roadmap.md` an einer Stelle etwas anderes sagt.
- Ausformulierte Aufträge liegen in `docs/auftraege/`. Gibt es für die Aufgabe einen,
  ist er die Vorgabe: Reihenfolge, Abnahmekriterien und die Punkte, die ausdrücklich
  nicht dazugehören, stehen dort.
- Änderst du eine Entscheidung oder findest du eine neue Falle, schreib sie in die
  passende Datei in `docs/`. Der Vault-Spiegel wird daraus nachgezogen.
