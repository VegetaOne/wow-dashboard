# WoW Dashboard – Reihenfolge und Entscheide

> Stand: 2026-09-19
> Diese Datei ist die verbindliche Reihenfolge. Sie ersetzt die Abschnitte
> „Reihenfolge-Empfehlung" und „Offene Entscheide" in [Roadmap](./roadmap.md),
> wo dort etwas anderes steht.

---

## Entschieden

| Thema | Entscheid |
| --- | --- |
| **Sprache** | Umschalter Englisch/Deutsch, **Englisch als Standard**. Bisher ist alles auf `de_DE` verdrahtet. |
| **Setup-Modus** | Die `.env` soll nicht mehr von Hand gefüllt werden: beim ersten Start fragt die Website die Werte ab. Kommt **als Letztes, aber vor Warcraft Logs**, weil dessen Zugangsdaten eventuell auch in den Setup gehören (noch offen). |
| **Warcraft Logs** | Ganz am Ende. |
| **Talentbuilds** | Gewünscht: interaktiver Talentbaum, Builds exportieren und importieren, mehrere Builds speichern. Position in der Reihenfolge noch offen. Siehe eigenen Abschnitt unten. |
| **Retail** | Derzeit kein Fokus. Classic und Classic Era zuerst. |
| **Snapshot-Historie** | Behalten, ein Stand je Tag. Grundlage für alles Verlaufsbezogene. |
| **Wochenübersicht** | Eigene Account-Seite, Status aus `last_kill_timestamp` statt aus Snapshot-Diffs, Lockout-Längen als gepflegte Tabelle. Siehe [Wochenübersicht](./wochenuebersicht.md). |

## Fertig

Charakterübersicht · Ausrüstung mit Paperdoll, Icons, Tooltips und Charaktermodell ·
Upgrades und Loot-Kandidaten · Berufe · Fortschritt (Raids, Dungeons, Mythisch+) ·
Sammlungen · Erfolge · Ansehen · PvP · Gilde · Auktionshaus-Preisindex und
Berufs-Wirtschaft · Verlauf.

**Wochenübersicht / Reset-Tracker** — gebaut, aber noch nicht mit echten Daten
geprüft. Details und offene Punkte in [Wochenübersicht](./wochenuebersicht.md). Wöchentliche
Quests und Belohnungen fehlen noch; abgedeckt sind die Schlachtzug-Lockouts.

## Offene Arbeit, in dieser Reihenfolge

1. **Sprachumschalter fertigstellen** — **bereits angefangen, etwa zur Hälfte fertig.**
   Mechanik, Umschalter und die Wörterbücher für Kern, Setup, Fortschritt, Ansehen,
   Erfolge und Sammlungen stehen; elf Komponenten haben noch feste deutsche Strings und
   sechs Bereichswörterbücher sind leere Hüllen. Restliste und Vorgehen:
   [i18n](./i18n.md). Das gehört vor allem Neuen fertiggemacht — ein halb übersetztes
   Wörterbuch ist teurer als ein ganzes oder gar keines, und jede neue Ansicht
   verlängert die Restliste. *Damit rückt der Punkt vom zweiten auf den ersten Platz;
   vorher stand er als „Position noch nicht festgelegt" hier.*
2. **Talentbuilds** — Position noch offen, siehe unten.
3. **Hintergrund-Auffrischer** — blockiert durch einen Entscheid: dafür müssten
   Refresh-Tokens verschlüsselt und dauerhaft gespeichert werden.
4. **Setup-Modus abschliessen** — gebaut, aber ungeprüft; siehe unten und
   [Setup-Modus](./setup-modus.md).
5. **Warcraft Logs** — braucht eine eigene App-Registrierung bei warcraftlogs.com.
6. **WoW Forever** — sobald der Namespace bekannt ist. Nicht über
   `src/lib/adapters/`, siehe „Korrekturen aus dem Code" unten.

Nachzuziehen, wenn die Wochenübersicht im Betrieb steht: wöchentliche Quests und
Belohnungen, und die offenen Punkte aus [Wochenübersicht](./wochenuebersicht.md).

## Zurückgestellt

Nicht gestrichen, aber auch nicht eingeplant: mögliche Erweiterungen, wenn das
Bestehende rund läuft. Sie tauchen in der Reihenfolge oben absichtlich nicht auf, damit
sie keinen Platz besetzen, den sie nicht verdienen.

**Charaktervergleich** — zwei Charaktere nebeneinander. Zurückgestellt am 2026-09-19.
Vor einer Umsetzung wären zwei Fragen zu klären, die den Aufwand bestimmen: was
verglichen wird (nur Ausrüstung und Gegenstandsstufe, oder auch Fortschritt, Berufe und
Sammlungen), und was bei zwei Charakteren aus verschiedenen Spielmodi passiert, wo die
Datensätze nicht deckungsgleich sind — Classic Era führt keine Verzauberungen, Mythisch+
gibt es nur in Retail. Eine Vergleichsspalte, die dort leer bleibt, sieht wie ein Fehler
aus und müsste den Grund benennen.

---

## Talentbuilds

**Gewünscht:** ein Talentbaum, der interaktiv gefüllt werden kann; Builds exportieren und
importieren; mehrere Builds speichern.

Das ist der erste Teil der App, der nicht nur *anzeigt*, sondern den der Nutzer selbst
**befüllt**. Daraus folgen drei Dinge, die vor der Umsetzung geklärt sein müssen.

**1. Woher kommt der Baum?** Zum Zeichnen braucht es die Struktur – Knoten, Positionen,
Verbindungen, Ränge, Voraussetzungen. Für Retail führt die Spieldaten-API Talentbäume
(`/data/wow/talent-tree/…`). Ob die **Classic-Namespaces** das ebenfalls führen, ist
**noch nicht nachgeprüft** – Classic hat das alte Drei-Bäume-System mit Punkten statt
Knotenwahl. Liefert die API es dort nicht, muss die Baumstruktur als statische Daten in
die App, und dann ist sie von Hand zu pflegen. Das ist der Punkt, der über den Aufwand
entscheidet; er wird als Erstes nachgesehen, nicht angenommen.

**2. Welches Exportformat?** Zwei Wege, die sich nicht ausschliessen:

- **Das Format des Spiels.** In Retail liefert der Charakter-Endpunkt `specializations`
  einen Loadout-Code, den das Spiel selbst versteht – Import und Export wären dann mit
  Spiel und Drittseiten kompatibel. Den Codec sauber nachzubauen ist allerdings echte
  Arbeit, und für Classic existiert kein vergleichbarer offizieller Code.
- **Ein eigenes JSON.** Sofort machbar, verlustfrei, aber nur innerhalb dieser App
  brauchbar.

Vorschlag für später: eigenes JSON als Basis, der Spiel-Code als Zusatz, wenn die
Baumstruktur steht. Wichtig ist, dass die Oberfläche sagt, welches Format sie erzeugt –
ein Code, der aussieht wie der des Spiels, es aber nicht ist, wäre schlimmer als keiner.

**3. Wo liegen die Builds?** Builds sind Nutzerdaten, keine API-Daten – also eine eigene
Tabelle mit `userId`, nicht in den Snapshots. Die App ist mehrbenutzerfähig; jeder sieht
nur seine eigenen Builds. Ein Build hängt an Klasse und Spezialisierung, nicht an einem
Charakter, damit er sich auf mehrere Charaktere anwenden lässt.

**Nützlich obendrein, sobald der Baum steht:** den aktuell im Spiel gesetzten Build eines
Charakters aus `specializations` einlesen und als Ausgangspunkt anbieten. Das verbindet
die Funktion mit dem Rest der App, statt sie neben ihm zu stellen.

---

## Auktionshaus: was beim Bauen herauskam

Festgehalten, weil es die Erwartung an den Tab bestimmt.

- **Retail:** ein Haus je verbundenem Realm, Pfad ohne Haus-ID
  (`/data/wow/connected-realm/{id}/auctions`, Namespace `dynamic-{region}`).
- **Classic:** mehrere Häuser je Realm, erst `/auctions/index`, dann je Haus
  (`dynamic-classic-{region}`).
- **Classic Era:** dieselben Pfade, aber laut Blizzards eigenem Forum seit Dezember 2024
  durchgehend **404**. Im März 2025 von einem Mitarbeiter bestätigt, ohne Termin. Ob es
  inzwischen läuft, sagt nur der Versuch — die Oberfläche benennt den Fall und zeigt die
  Häuser ohne Codeänderung, sobald sie wieder liefern.
- Die Rohantwort ist **mehrere Megabyte** (bei vollen Realms über zehn). Sie wird sofort
  verdichtet und nie aufbewahrt: je Gegenstand bleiben günstigster Sofortkaufpreis je
  Einheit, angebotene Menge und Zahl der Angebote.
- **Gebote sind keine Preise.** Angebote ohne Sofortkauf werden gezählt und übersprungen.
- **Ein fehlender Reagenzpreis macht die Kostensumme unbekannt**, nicht kleiner.

---

## Setup-Modus: was vorher geklärt sein muss

Der Wunsch ist klar, aber drei Punkte entscheiden über den Aufbau. Sie sind hier
festgehalten, damit sie nicht erst bei der Umsetzung auffallen. Umsetzungsstand:
[Setup-Modus](./setup-modus.md).

**1. Ein Ei-Henne-Problem beim Login.** Ohne Client ID und Secret gibt es keinen
Battle.net-Login — die Setup-Seite kann also nicht hinter dem Login liegen. Sie muss
unangemeldet erreichbar sein. Damit nicht jeder im Heimnetz die App umkonfigurieren
kann, braucht es eine Absicherung: entweder nur solange keine Konfiguration existiert
(„first run"), oder ein Einmal-Token, das beim Start in die Container-Logs geschrieben
wird. Letzteres ist sicherer, weil es auch beim späteren Ändern greift.

**2. `.env` schreiben oder in die Datenbank?**

- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` und die Battle.net-Zugangsdaten werden heute beim
  **Start** gelesen. Schreibt der Setup in die `.env`, braucht es danach einen Neustart
  des Containers — die App kann sich nicht selbst neu starten, also müsste sie sagen:
  „gespeichert, bitte `docker compose restart`".
- Liegen die Werte stattdessen in SQLite und werden **pro Anfrage** gelesen, entfällt der
  Neustart. Dafür muss die NextAuth-Konfiguration dynamisch werden, und das Secret liegt
  in der Datenbankdatei statt in einer Datei mit `600`-Rechten. Verschlüsseln hilft nur
  begrenzt, weil der Schlüssel dafür ebenfalls irgendwo liegen muss.

Die zweite Variante ist bequemer, die erste ehrlicher. Eine Mischform ist möglich: der
Setup schreibt die `.env` **und** sagt, dass ein Neustart nötig ist.

**3. Was gehört in den Setup?** Battle.net Client ID, Secret, Region, `NEXTAUTH_URL` und
ein selbst erzeugtes `NEXTAUTH_SECRET` (das kann der Setup ohne Nachfrage generieren).
Warcraft-Logs-Zugangsdaten **optional** im selben Schritt — dann muss der Setup aber
ohne sie auskommen, statt sie zu verlangen.

Sinnvoll obendrein: der Setup prüft die eingegebenen Zugangsdaten sofort gegen die
Battle.net-Token-URL und sagt, ob sie funktionieren. Ein Setup, der falsche Werte
stillschweigend annimmt, verschiebt den Fehler nur auf den ersten Login.


---

## Korrekturen aus dem Code (2026-09-19)

Beim Durchsehen des Repos gefunden; hier festgehalten, weil die Notizen an diesen
drei Stellen etwas anderes behaupten als der Code tut.

**1. `src/lib/adapters/` ist toter Code.** Nichts im Projekt importiert es —
`getAdapter` wird nirgends aufgerufen. Der Ordner hat ausserdem seinen eigenen,
veralteten Modusbegriff: `GameMode = "retail" | "wow-forever"`, gelesen aus
`process.env.WOW_GAME_MODE`. Der tatsächliche Erweiterungspunkt ist `GAME_MODES` in
`src/lib/battlenet.ts` mit `retail | classic | classic-era` und Namespaces als Getter.
**Folge für WoW Forever:** der Modus kommt in `GAME_MODES`, nicht in einen Adapter.
Entweder der Ordner wird gelöscht, oder er wird auf denselben Modusbegriff gezogen —
so lange er halb danebensteht, baut jede Erweiterung auf der falschen Seite weiter.
README und [Roadmap](./roadmap.md) benennen ihn noch als Platzhalter für WoW Forever;
das ist überholt.

**2. Die Tests liegen nicht im Repo.** [Setup-Modus](./setup-modus.md) und
[Wochenübersicht](./wochenuebersicht.md) berufen sich auf 14 und 26 grüne Testfälle,
aber `package.json` hat kein Testskript und keinen Runner. Die Fälle waren Wegwerf-
Skripte. Wer die Reset-Arithmetik oder die Verschlüsselung anfasst, hat also kein
Netz. Vorschlag: `node:test` — steckt in Node 20, braucht keine Abhängigkeit,
`node --test` reicht als Skript.

**3. `dev.log` und `prisma/config.key` liegen im Arbeitsverzeichnis.** `.gitignore`
deckt `*.db`, aber nicht `config.key` und nicht `dev.log`. Die Schlüsseldatei ist das
Gegenstück zum verschlüsselten Client Secret — sie gehört so wenig ins Repo wie die
`.env`. Beide Muster gehören in `.gitignore` und `.dockerignore`, und es ist zu
prüfen, ob sie schon einmal committet wurden.
