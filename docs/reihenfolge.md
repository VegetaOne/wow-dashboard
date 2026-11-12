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
| **Talentbuilds** | War zurückgestellt, bis die Talentbaum-Daten für Forever bestätigt sind. **Bestätigt 2026-11-11**: Bäume, Talente und die gesetzten Talente eines Charakters kommen. Offen nur noch, ob die Knoten Position und Voraussetzungen tragen; die Einordnung in die Reihenfolge folgt danach. Siehe eigenen Abschnitt unten. |
| **Snapshot-Historie** | Behalten, ein Stand je Tag. Grundlage für alles Verlaufsbezogene. |
| **Loot-Bereich** | **Entfernt** (2026-11-11). Die Journal-API liefert für WoW Forever keine Instanzen; ein Loot-Index ohne Inhalt bringt nichts. Tabellen mit Migration `0008_loot_entfernen` gelöscht. Kommt die Journal-API, steht der Code in der Git-Historie. |
| **Hintergrund-Auffrischung** | **Verworfen** (2026-11-11). Der Companion läuft, während gespielt wird; und ohne Spielen ändert sich an den Profilen nichts, weil sie erst beim Ausloggen nachziehen. Ein täglicher Timer hätte höchstens den genauen Tag einer Änderung festgehalten. Kurz gebaut (PR #7) und wieder entfernt; Tabelle mit Migration `0010_auffrischer_entfernen` gelöscht. Der Verlauf bleibt: er entsteht aus den Ständen, die beim Öffnen der Seiten gespeichert werden. |
| **Absicherung des Setups** | **Einrichtungscode im Log des Containers** (2026-11-11). Stufe 1 verlangt ihn, Stufe 2 den Nachweis daraus per Cookie. Gilt bis zum Neustart. |
| **Design** | **Warband Ledger** aus Claude Design (Artifact „Azeroth Ledger Charakter-Manager", Übergabe `design_handoff_warband_ledger`), umgesetzt 2026-11-12 in vier Schritten: Tokens Nacht/Pergament und Schriften Cinzel/Spectral (selbst gehostet), Kopfzeile, Startseite mit Kriegsschar-Bühne und übrigen Charakteren, Charakterseite als Heldenakte. **Abweichungen:** Charakterbilder aus der API statt Upload, keine Wappen-Uploads, kein Spielmodus-Reiter; die Heldenakte blättert über eigene Seiten je Bereich statt eines Schiebereglers, damit jeder Bereich seine Daten erst beim Öffnen lädt; Gold, Währungen, Schatzkammer und Wochenziele entfallen (API liefert sie nicht). |
| **Wochenübersicht** | Eigene Account-Seite, Status aus `last_kill_timestamp` statt aus Snapshot-Diffs, Lockout-Längen als gepflegte Tabelle. Siehe [Wochenübersicht](./wochenuebersicht.md). |

## Fertig – für die alten Spielmodi

Gebaut für Retail und Classic, in Phase 0 auf die Forever-Adressierung umgestellt.
**Mit echten Forever-Daten bestätigt (2026-11-11):** Charakterliste und Charakterkopf, und
die Charakter-Tabs zeigen nach Durchsicht des Nutzers stimmige Daten (Phase 1 der
[Roadmap](./roadmap.md)).

Charakterübersicht · Ausrüstung mit Paperdoll, Icons, Tooltips und Charaktermodell ·
Upgrades (Sockel, Verzauberungen, schwache Slots) · Berufe · Fortschritt (Raids, Dungeons) ·
Sammlungen · Erfolge · Ansehen · PvP · Gilde · Auktionshaus-Preisindex und
Berufs-Wirtschaft · Verlauf.

**Mythisch+** ist mit Retail entfallen.

**Loot-Kandidaten** sind entfernt: die Journal-API liefert für Forever keine Instanzen
(geprüft 2026-11-11).

**Wochenübersicht / Reset-Tracker** — gebaut, aber noch nicht mit echten Daten
geprüft. Details und offene Punkte in [Wochenübersicht](./wochenuebersicht.md). Wöchentliche
Quests und Belohnungen fehlen noch; abgedeckt sind die Schlachtzug-Lockouts. Die
Bindungsdauern gelten für Forever als angenommen.

## Offene Arbeit, in dieser Reihenfolge

Erledigt am 2026-11-11, in dieser Reihenfolge:

1. ~~**Bestehende Ansichten auf Forever prüfen**~~ — vom Nutzer durchgesehen, die Tabs
   zeigen stimmige Daten.
2. ~~**Sprachumschalter fertigstellen**~~ — die letzten festen Texte liegen im Wörterbuch,
   die Abnahme-Greps aus [Auftrag](./auftraege/i18n-abschluss.md) sind leer. Ungeprüft:
   das Umschalten mit echten Daten durch jede Ansicht.
3. ~~**Hintergrund-Auffrischer**~~ — gebaut und auf Wunsch wieder entfernt, siehe
   Entscheid oben.
4. ~~**Setup-Modus abschliessen**~~ — Einrichtungscode gebaut; der Hinweis beim Wechsel der
   Region stand schon und ist an die getrennte Ablage je Region angepasst.

Offen als Nächstes:

1. **Einrichtungscode im echten Setup durchlaufen** — mit frischem Volume.

Nachzuziehen, wenn die Wochenübersicht im Betrieb steht: wöchentliche Quests und
Belohnungen, und die offenen Punkte aus [Wochenübersicht](./wochenuebersicht.md).

## Zurückgestellt

Nicht gestrichen, aber auch nicht eingeplant: mögliche Erweiterungen, wenn das
Bestehende rund läuft. Sie tauchen in der Reihenfolge oben absichtlich nicht auf, damit
sie keinen Platz besetzen, den sie nicht verdienen.

**Warcraft Logs** — zurückgestellt am 2026-11-11. Braucht eine eigene App-Registrierung
bei warcraftlogs.com; vorher zu klären, ob Warcraft Logs Forever-Kämpfe überhaupt führt.

**Talentbuilds** — zurückgestellt am 2026-11-11, bis die Talentbaum-Daten für Forever
bestätigt sind. **Die Daten kommen (geprüft 2026-11-11)**; die Einordnung folgt, sobald
klar ist, ob die Knoten Position und Voraussetzungen tragen. Die Vorüberlegungen stehen
unten im eigenen Abschnitt.

**Charaktervergleich** — zwei Charaktere nebeneinander. Zurückgestellt am 2026-09-19.
Vor einer Umsetzung ist zu klären, was verglichen wird: nur Ausrüstung und
Gegenstandsstufe, oder auch Fortschritt, Berufe und Sammlungen. Die frühere zweite
Frage – Charaktere aus verschiedenen Spielmodi mit unterschiedlichen Datensätzen –
entfällt mit der Umstellung auf Forever.

---

## Talentbuilds

**Gewünscht:** ein Talentbaum, der interaktiv gefüllt werden kann; Builds exportieren und
importieren; mehrere Builds speichern.

Das ist der erste Teil der App, der nicht nur *anzeigt*, sondern den der Nutzer selbst
**befüllt**. Daraus folgen drei Dinge, die vor der Umsetzung geklärt sein müssen.

**1. Woher kommt der Baum?** Zum Zeichnen braucht es die Struktur – Knoten, Positionen,
Verbindungen, Ränge, Voraussetzungen. Ein Community-SDK nennt Talentbäume im Namespace
`static-forever-{region}`, aber ohne Testbericht. **Geprüft 2026-11-11:** die API liefert
die Bäume – je Spezialisierung `/data/wow/talent-tree/{id}/playable-specialization/{specId}`
mit `spec_talent_nodes`, je Knoten Ränge mit Talent, Zauber und Beschreibung. Was ein
Charakter gesetzt hat, steht in `/profile/wow/character/{slug}/specializations`
(`talent_rank` je Talent, `spent_points` je Baum). Ob die Knoten Zeile, Spalte und
Voraussetzungen tragen, wird mit der Diagnose-Route `/api/wow/probe/talents` geprüft.

**2. Welches Exportformat?** Für Forever ist kein offizieller Build-Code des Spiels
bekannt. Damit bleibt ein **eigenes JSON**: sofort machbar, verlustfrei, aber nur
innerhalb dieser App brauchbar. Die Oberfläche sagt, welches Format sie erzeugt – ein
Code, der aussieht wie der des Spiels, es aber nicht ist, wäre schlimmer als keiner.

**3. Wo liegen die Builds?** Builds sind Nutzerdaten, keine API-Daten – also eine eigene
Tabelle mit `userId`, nicht in den Snapshots. Die App ist mehrbenutzerfähig; jeder sieht
nur seine eigenen Builds. Ein Build hängt an Klasse und Spezialisierung, nicht an einem
Charakter, damit er sich auf mehrere Charaktere anwenden lässt.

**Darstellung (2026-11-11, Wunsch des Nutzers):** angelehnt an den Client – Icons im
Raster, Rang unten rechts, Pfeile für Voraussetzungen, Tooltip am Icon. Die drei Bäume
**nebeneinander in der Reihenfolge des Spiels**, gleich breit, zusammen mittig; auf
schmalen Bildschirmen brechen sie um. (Zuerst untereinander nach Punkten – mit dem engen
Rahmen war genug Platz für die Anordnung wie im Spiel.) Ungesetzt grau, gesetzt mit grünem,
voll ausgebaut mit goldenem Rand. Icons aus `/data/wow/media/spell/{id}`, Hintergrund aus
dem `media`-Verweis des Baums – beides für Forever unbelegt, darum mit Rückfall (Name im
Feld, schlichter Grund). **`display_col` liegt in einem gemeinsamen Raster** der drei
Bäume (einer begann rechts, einer links); die Spalten werden je Baum auf 1 gesetzt, die
Zeilen bleiben, weil sie die Stufe tragen.

**Regeln (angenommen, vom Nutzer so bestätigt):** ein Punkt je Stufe ab Stufe 10, jede
Zeile verlangt 5 Punkte mehr im selben Baum, Voraussetzungen voll ausgebaut. Die API
liefert keine dieser Regeln; die Oberfläche schreibt „angenommen" dazu.

**Export:** JSON (Entscheid 2026-11-11).

**Nützlich obendrein, sobald der Baum steht:** den aktuell im Spiel gesetzten Build eines
Charakters aus `specializations` einlesen und als Ausgangspunkt anbieten.

---

## Auktionshaus: was beim Bauen herauskam

Festgehalten, weil es die Erwartung an den Tab bestimmt. Stand für Forever laut
Community-Tests, 2026-11-11.

- **Häuser je Ruleset statt je Realm:** `/data/wow/ruleset/index`, dann
  `/data/wow/ruleset/{id}/auctions/` mit Schrägstrich am Ende, dann je Haus
  (`dynamic-forever-{region}`). Der Pfad je Haus ist mit echten Daten bestätigt
  (2026-11-11, rund 110'000 Angebote).
- **Waren (Commodities) stehen nicht in `auctions`**, sondern im Feld `commodities` der
  Hausantwort bzw. unter `…/auctions/{houseId}/commodities`. Bis 2026-11-11 las die App
  nur `auctions` – kein Leder, kein Stoff, kein Faden im Index, und jede Kostensumme
  blieb „unbekannt". Seitdem werden beide gelesen.
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
**Umgesetzt 2026-11-11:** Einrichtungscode im Log, siehe [Setup-Modus](./setup-modus.md).

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
Region nicht mehr – sie bleiben in der Datenbank, werden aber nicht gemischt. Die
Einstellungsseite sagt das beim Feld „Region".
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
gibt es jetzt; es deckt das Secret-Format und die Reset-Arithmetik
(`tests/reset.test.mjs`) ab. [Setup-Modus](./setup-modus.md) und
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
