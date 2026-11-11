# WoW Dashboard – Reihenfolge und Entscheide

> Stand: 2026-11-11 · Umgestellt auf **nur WoW Forever**.
> Diese Datei ist die verbindliche Reihenfolge. Sie ersetzt die Abschnitte
> „Reihenfolge-Empfehlung" und „Entscheide" in [Roadmap](./roadmap.md),
> wo dort etwas anderes steht.

---

## Entschieden

| Thema | Entscheid |
| --- | --- |
| **Spielmodus** | **Nur noch WoW Forever** (2026-11-11). Retail, Classic und Classic Era sind nicht mehr relevant und werden aus der App entfernt, nicht nur ausgeblendet. Ersetzt den früheren Entscheid „Retail kein Fokus, Classic und Classic Era zuerst". |
| **Alte Daten** | Snapshots und andere gespeicherte Daten von Retail-, Classic- und Classic-Era-Charakteren werden **gelöscht** (2026-11-11). Migration `0007_wow_forever`, mit Backup der Datenbank und von `prisma/config.key` davor. |
| **Region** | **Standard EU**, umstellbar auf US, KR oder TW (2026-11-11). Gesetzt im Setup-Modus; Namespaces und API-Host werden daraus gebildet. |
| **Unbelegte Datenquellen** | Was für Forever nicht nachweislich liefert, wird gestrichen, bis ein Test es bestätigt. Liste in [Roadmap](./roadmap.md), Abschnitt 2 „Gestrichen bis bestätigt". |
| **Sprache** | Umschalter Englisch/Deutsch, **Englisch als Standard**. |
| **Setup-Modus** | Die `.env` soll nicht mehr von Hand gefüllt werden: beim ersten Start fragt die Website die Werte ab. |
| **Warcraft Logs** | Zurückgestellt, bis geklärt ist, ob Warcraft Logs WoW Forever führt. |
| **Talentbuilds** | Zurückgestellt, bis die Talentbaum-Daten für Forever bestätigt sind. Siehe eigenen Abschnitt unten. |
| **Snapshot-Historie** | Behalten, ein Stand je Tag. Grundlage für alles Verlaufsbezogene. |
| **Wochenübersicht** | Eigene Account-Seite, Status aus `last_kill_timestamp` statt aus Snapshot-Diffs, Lockout-Längen als gepflegte Tabelle. Siehe [Wochenübersicht](./wochenuebersicht.md). |

## Fertig – für die alten Spielmodi

Gebaut für Retail und Classic, in Phase 0 auf die Forever-Adressierung umgestellt,
**mit echten Forever-Daten noch ungeprüft**. Die Prüfung ist [Roadmap](./roadmap.md), Phase 1.

Charakterübersicht · Ausrüstung mit Paperdoll, Icons, Tooltips und Charaktermodell ·
Upgrades und Loot-Kandidaten · Berufe · Fortschritt (Raids, Dungeons) ·
Sammlungen · Erfolge · Ansehen · PvP · Gilde · Auktionshaus-Preisindex und
Berufs-Wirtschaft · Verlauf.

**Mythisch+** ist mit Retail entfallen.

**Loot-Kandidaten** stehen auf der Journal-API. Ob sie für Forever liefert, ist nicht
belegt – bis dahin ist die Upgrade-Funktion für Forever offen.

**Wochenübersicht / Reset-Tracker** — gebaut, aber noch nicht mit echten Daten
geprüft. Details und offene Punkte in [Wochenübersicht](./wochenuebersicht.md). Wöchentliche
Quests und Belohnungen fehlen noch; abgedeckt sind die Schlachtzug-Lockouts. Die
Bindungsdauern gelten für Forever als angenommen.

## Offene Arbeit, in dieser Reihenfolge

1. **Umstellung auf WoW Forever** — [Roadmap](./roadmap.md), Phase 0. **Umgesetzt im Branch
   `wow-forever-umstellung` (2026-11-11), ungeprüft.** Offen ist der Teil, der echte
   Zugangsdaten braucht: Migration auf eine Kopie der Datenbank einspielen, mit dem eigenen
   EU-Charakter anmelden und festhalten, was die Endpunkte tatsächlich liefern – allen voran
   die Journal-API. Danach die bestehenden Ansichten auf Forever prüfen (Phase 1).
   *Vom sechsten auf den ersten Platz gerückt am 2026-11-11: Forever-Snapshots entstehen
   erst, wenn die App Forever abruft – jede Woche davor fehlt später im Verlauf.*
2. **Sprachumschalter fertigstellen** — **bereits angefangen, etwa zur Hälfte fertig.**
   Mechanik, Umschalter und die Wörterbücher für Kern, Setup, Fortschritt, Ansehen,
   Erfolge und Sammlungen stehen; elf Komponenten hatten noch feste deutsche Strings und
   sechs Bereichswörterbücher waren leere Hüllen (Stand vor der Umstellung). Restliste und
   Vorgehen:
   [i18n](./i18n.md). Kommt direkt nach der Umstellung, weil die Umstellung Ansichten
   entfernt hat und die Restliste damit kürzer wird (Mythisch+, Spielmodus-Auswahl). Der
   Charakterkopf ist mit der Umstellung bereits übersetzt.
3. **Hintergrund-Auffrischer** — blockiert durch einen Entscheid: dafür müssten
   Refresh-Tokens verschlüsselt und dauerhaft gespeichert werden.
4. **Setup-Modus abschliessen** — gebaut, aber ungeprüft; siehe unten und
   [Setup-Modus](./setup-modus.md). Die Spielmodus-Auswahl ist entfallen; die Regionswahl
   mit Standard EU war schon drin.

Nachzuziehen, wenn die Wochenübersicht im Betrieb steht: wöchentliche Quests und
Belohnungen, und die offenen Punkte aus [Wochenübersicht](./wochenuebersicht.md).

## Zurückgestellt

Nicht gestrichen, aber auch nicht eingeplant: mögliche Erweiterungen, wenn das
Bestehende rund läuft. Sie tauchen in der Reihenfolge oben absichtlich nicht auf, damit
sie keinen Platz besetzen, den sie nicht verdienen.

**Warcraft Logs** — zurückgestellt am 2026-11-11. Braucht eine eigene App-Registrierung
bei warcraftlogs.com; vorher zu klären, ob Warcraft Logs Forever-Kämpfe überhaupt führt.

**Talentbuilds** — zurückgestellt am 2026-11-11, bis die Talentbaum-Daten für Forever
bestätigt sind. Die Vorüberlegungen stehen unten im eigenen Abschnitt.

**Charaktervergleich** — zwei Charaktere nebeneinander. Zurückgestellt am 2026-09-19.
Vor einer Umsetzung ist zu klären, was verglichen wird: nur Ausrüstung und
Gegenstandsstufe, oder auch Fortschritt, Berufe und Sammlungen. Die frühere zweite
Frage – Charaktere aus verschiedenen Spielmodi mit unterschiedlichen Datensätzen –
entfällt mit der Umstellung auf Forever.

---

## Talentbuilds (zurückgestellt)

**Gewünscht:** ein Talentbaum, der interaktiv gefüllt werden kann; Builds exportieren und
importieren; mehrere Builds speichern.

Das ist der erste Teil der App, der nicht nur *anzeigt*, sondern den der Nutzer selbst
**befüllt**. Daraus folgen drei Dinge, die vor der Umsetzung geklärt sein müssen.

**1. Woher kommt der Baum?** Zum Zeichnen braucht es die Struktur – Knoten, Positionen,
Verbindungen, Ränge, Voraussetzungen. Ein Community-SDK nennt Talentbäume im Namespace
`static-forever-{region}`, aber ohne Testbericht. **Das ist der Grund für die
Zurückstellung** und wird als Erstes nachgesehen, nicht angenommen. Liefert die API es
nicht, muss die Baumstruktur als statische Daten in die App, und dann ist sie von Hand
zu pflegen.

**2. Welches Exportformat?** Für Forever ist kein offizieller Build-Code des Spiels
bekannt. Damit bleibt ein **eigenes JSON**: sofort machbar, verlustfrei, aber nur
innerhalb dieser App brauchbar. Die Oberfläche sagt, welches Format sie erzeugt – ein
Code, der aussieht wie der des Spiels, es aber nicht ist, wäre schlimmer als keiner.

**3. Wo liegen die Builds?** Builds sind Nutzerdaten, keine API-Daten – also eine eigene
Tabelle mit `userId`, nicht in den Snapshots. Die App ist mehrbenutzerfähig; jeder sieht
nur seine eigenen Builds. Ein Build hängt an Klasse und Spezialisierung, nicht an einem
Charakter, damit er sich auf mehrere Charaktere anwenden lässt.

**Nützlich obendrein, sobald der Baum steht:** den aktuell im Spiel gesetzten Build eines
Charakters aus `specializations` einlesen und als Ausgangspunkt anbieten.

---

## Auktionshaus: was beim Bauen herauskam

Festgehalten, weil es die Erwartung an den Tab bestimmt. Stand für Forever laut
Community-Tests, 2026-11-11.

- **Häuser je Ruleset statt je Realm:** `/data/wow/ruleset/index`, dann
  `/data/wow/ruleset/{id}/auctions/` mit Schrägstrich am Ende, dann je Haus
  (`dynamic-forever-{region}`). Der Pfad je Haus ist abgeleitet und ungeprüft.
- **Jedes Ruleset liefert dieselben 15 Häuser** und Angebote — nicht aufsummieren.
  Gespeichert wird darum je Region und Haus. Siehe [Roadmap](./roadmap.md), Abschnitt 2.
- Die Rohantwort ist **mehrere Megabyte**. Sie wird sofort verdichtet und nie
  aufbewahrt: je Gegenstand bleiben günstigster Sofortkaufpreis je Einheit, angebotene
  Menge und Zahl der Angebote.
- **Gebote sind keine Preise.** Angebote ohne Sofortkauf werden gezählt und übersprungen.
- **Ein fehlender Reagenzpreis macht die Kostensumme unbekannt**, nicht kleiner.
- **Fehlende Item-Stammdaten** (in Forever häufig bei älteren Gegenständen) dürfen den
  Preis nicht verschwinden lassen – die Item-ID bleibt, der Name wird nachgeholt, wenn
  er kommt.

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
**Region:** vorausgewählt EU, wählbar US, KR, TW. Sie bestimmt bei Forever die
Namespaces (`profile-forever-{region}` usw.) und den API-Host, und sie steht in jedem
Datenbankschlüssel. Wird die Region später gewechselt, erscheinen die Stände der alten
Region nicht mehr – sie bleiben in der Datenbank, werden aber nicht gemischt. Ein Hinweis
beim Umstellen fehlt noch.
Warcraft-Logs-Zugangsdaten entfallen, solange Warcraft Logs zurückgestellt ist.

Sinnvoll obendrein: der Setup prüft die eingegebenen Zugangsdaten sofort gegen die
Battle.net-Token-URL und sagt, ob sie funktionieren. Ein Setup, der falsche Werte
stillschweigend annimmt, verschiebt den Fehler nur auf den ersten Login.


---

## Korrekturen aus dem Code (2026-09-19, nachgeführt 2026-11-11)

Beim Durchsehen des Repos gefunden; hier festgehalten, weil die Notizen an diesen
Stellen etwas anderes behaupten als der Code tut.

**1. `src/lib/adapters/` war toter Code.** — **Erledigt 2026-11-11:** mit der Umstellung auf
Forever gelöscht. `GAME_MODES` ist ebenfalls entfallen; Namespaces kommen aus
`namespace()` in `src/lib/battlenet.ts`.

**2. Die Tests liegen nicht im Repo.** — Teilweise behoben 2026-11-11 (PR #2): `npm test`
gibt es jetzt, es deckt aber nur das Secret-Format ab. [Setup-Modus](./setup-modus.md) und
[Wochenübersicht](./wochenuebersicht.md) berufen sich auf 14 und 26 grüne Testfälle,
aber `package.json` hat kein Testskript und keinen Runner. Die Fälle waren Wegwerf-
Skripte. Wer die Reset-Arithmetik oder die Verschlüsselung anfasst, hat also kein
Netz. Vorschlag: `node:test` — steckt in Node 20, braucht keine Abhängigkeit,
`node --test` reicht als Skript.

**3. `dev.log` und `prisma/config.key` waren im Repo.** Nachgeprüft 2026-11-11: beide
Dateien waren **eingecheckt**, obwohl `.gitignore` sie nennt – das Ignorieren greift nur
für noch nicht verfolgte Dateien. Das Repo ist öffentlich. — **Behoben 2026-11-11 (PR #2):**
beide aus der Versionsverwaltung genommen, in älteren Commits stehen sie weiter (bewusst
keine umgeschriebene Historie). Der Schlüssel der Entwicklungsinstanz wird mit
`node tools/rotate-key.mjs` erneuert, siehe [Setup-Modus](./setup-modus.md),
„Schlüssel erneuern". Der Docker-Container ist nicht betroffen.

**4. Lint ist nicht eingerichtet.** `npm run lint` startet den interaktiven Einrichtungs-
dialog von Next, statt zu prüfen – es gibt keine ESLint-Konfiguration im Repo.
