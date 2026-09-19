# WoW Dashboard — Arbeitsanweisung

Self-hosted WoW-Companion. Next.js 14 (App Router), React 18, TypeScript strict,
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

Es gibt **kein Testskript**. Wenn du etwas mit Arithmetik oder Krypto anfasst
(`src/lib/reset.ts`, `lockouts.ts`, `secrets.ts`), lege Tests als `node:test` an
(`node --test`, steckt in Node 20, braucht keine Abhängigkeit) und trage das Skript in
`package.json` ein. Vorhandene Testbehauptungen in `docs/` stammen aus Wegwerf-Skripten,
die nicht im Repo liegen.

## Wo was hingehört

```
src/app/                    App Router
  api/wow/                  interne Endpunkte fürs Nachladen auf Abruf
  api/setup/, api/settings/  Konfiguration
  dashboard/[mode]/[realm]/[name]/<tab>/   Charakterseiten, ein Ordner je Tab
  dashboard/[mode]/woche/   Wochenübersicht (Account-Ebene, kein Charakter-Tab)
src/components/             UI
src/lib/                    alles Fachliche
  battlenet.ts              API-Zugriff, GAME_MODES, Slots, Farben
  character.ts              Abrufe je Datensatz
  snapshot.ts               Tagesschnappschüsse, Fallback auf alten Stand, Verlauf
  config.ts / config-cache.ts / secrets.ts / runtime.ts   Konfiguration
  i18n.ts / t.ts / dict/    Übersetzung
  trend.ts (rein) / history.ts (DB)
  format.ts, money.ts       Zahlen und Daten ohne toLocaleString
prisma/schema.prisma        + migrations/
docs/                       Konzept und Reihenfolge
```

Ein neuer Charakter-Tab: Ordner unter `dashboard/[mode]/[realm]/[name]/`, Eintrag in
`src/lib/characterTabs.ts` (`enabled` erst auf `true`, wenn die Seite etwas zeigt —
so gibt es nie einen Tab ins Leere), Beschriftung als Wörterbuchschlüssel.

## Harte Regeln

**Ehrlichkeit der Anzeige.** Das ist die Leitlinie des Projekts, nicht Kosmetik:

- Fehlt ein Wert, steht `—`, nie `0`.
- Eine Quote nur, wenn Zähler **und** Nenner bekannt sind. `0/0` darf nie wie
  „vollständig" aussehen.
- **Keine DPS-Zahlen, kein Best-in-Slot, keine Itemwertung.** Der API fehlen die
  Statgewichte; jede Rangfolge wäre erfunden. Gezeigt wird das Belegbare: fehlende
  Verzauberungen, leere Sockel, schwache Slots, Loot-Kandidaten.
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
`src/lib/runtime.ts` aufrufen, und in `GAME_MODES` Namespaces als Getter schreiben.

**Keine festen Oberflächentexte.** Immer über `t()` — `await getT()` in Server-, `useT()`
in Client-Komponenten. Schlüssel mit Bereichspräfix in `src/lib/dict/<bereich>.ts`,
Englisch definiert, Deutsch vollständig. Siehe `docs/i18n.md`.

**Nie `toLocaleString()` ohne Locale.** Fehlen der Laufzeit die ICU-Daten, fällt Node
still auf `en-US` zurück, und `12’345` wird zu `12,345` — auf Deutsch eine Dezimalzahl.
`src/lib/format.ts` benutzen.

**Antworten tolerant lesen.** Classic Era liefert kein `level` an Ausrüstungsteilen und
keine Verzauberungen, Mythisch+ gibt es nur in Retail, Classic Era hat mehrere
Auktionshäuser je Realm und liefert dort seit Dezember 2024 durchgehend 404. Nie
annehmen, dass ein Feld da ist.

**Der Anzeigename eines angelegten Items steht auf oberster Ebene** des Eintrags, nicht
unter `item.name`. Falsch gelesen bleiben Namen still leer — auch in Retail.

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
- `src/lib/adapters/` als Erweiterungspunkt benutzen — siehe unten.

## Fallen, die im Code stehen

- **`src/lib/adapters/` ist toter Code.** Nichts importiert es, und es führt einen
  veralteten Modusbegriff (`"retail" | "wow-forever"` aus `process.env.WOW_GAME_MODE`).
  Der echte Erweiterungspunkt ist `GAME_MODES` in `src/lib/battlenet.ts`
  (`retail | classic | classic-era`). **WoW Forever kommt dort hinein.** Der Ordner
  gehört gelöscht oder auf denselben Modusbegriff gezogen; vorher nicht darauf aufbauen.
- **`src/app/api/wow/character/[realm]/[name]/equipment/route.ts`** benutzt noch
  `authOptions` statt `await getAuthOptions()` — der Pfad war beim Umbau zu tief
  verschachtelt und wurde übersehen.
- **Prisma auf Alpine** braucht `apk add openssl` und den Binary-Target
  `linux-musl-openssl-3.0.x`.
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
