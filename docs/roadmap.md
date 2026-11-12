# WoW Dashboard – Roadmap zum Companion für WoW Forever

> Stand: 2026-11-11 · Umgestellt auf **nur WoW Forever**. Retail, Classic und Classic Era
> sind nicht mehr Teil der Planung und aus der App entfernt (Phase 0, umgesetzt).
> Ziel: ein Begleiter für die eigene Forever-Zeit – Charaktere, Ausrüstung, Fortschritt,
> Berufe, Sammlungen und Gilde an einem Ort, self-hosted.

---

## 1. Leitprinzipien

Diese Regeln haben sich beim Bau der ersten Version bewährt und gelten weiter:

**Ehrlich beschriften.** Was die Daten nicht hergeben, wird nicht behauptet. „schwache Slots" statt „Best in Slot", „aus 12 von 30 geladen" statt eines stillschweigend wandernden Schnitts. Eine Zahl ohne Grundlage ist schlimmer als keine Zahl. Für Forever heisst das zusätzlich: ein 404 der API ist oft „noch keine Daten", nicht „Fehler" – und die Oberfläche sagt, welches von beiden.

**Nur laden, was gebraucht wird.** Ein Companion hat viele Ansichten. Würde jede beim Aufruf alles holen, wäre die App unbenutzbar. Jede neue Ansicht lädt ihre Daten selbst und erst wenn sie sichtbar ist.

**Offizielle APIs zuerst.** Fremdquellen ohne dokumentierte API (Wowhead, Raidbots, Sixty Upgrades) kommen nicht in den Kern. Wo sie unvermeidlich sind, werden sie als abschaltbarer Zusatz gebaut, von dem die App nicht abhängt. Die Forever-API ist Blizzards eigene, aber **nicht dokumentiert** – sie gilt als offiziell, wird aber behandelt wie etwas, das sich jederzeit ändern kann.

**Nur belegte Datenquellen einplanen.** Was für Forever nicht nachweislich liefert, kommt nicht in die Phasen, sondern in die Liste „Gestrichen bis bestätigt" (Abschnitt 2). Ein Feature, das auf einer Annahme steht, wird erst eingeplant, wenn die Annahme geprüft ist.

**Namespaces an einer Stelle.** Alle Namespaces und Pfadmuster liegen in `src/lib/battlenet.ts` (`namespace()`, `characterPath()`, `bnetGet()`). Ändert Blizzard etwas an der undokumentierten API, ist es eine Stelle, kein Suchen durch die Ansichten.

---

## 2. Datenquellen – was geht, was nicht

### Namespaces (Stand 2026-11-11)

Seit dem Start am 4. November 2026 antwortet die Battle.net-API für Forever. Alles hier stammt aus Community-Tests, nicht aus einer Dokumentation von Blizzard.

| Namespace | Inhalt |
|---|---|
| `static-forever-{region}` | Spieldaten. Derzeit Version 1.60.1_70399, fest einstellbar als `static-1.60.1_70399-forever-{region}`. Vor dem Start lieferte der unversionierte Name 403. Die aktuelle Version steht in den `playable_class`-/`playable_race`-Links des Account-Profils – `bnetGet` lernt sie dort und weicht bei 403 darauf aus. |
| `dynamic-forever-{region}` | Rulesets, Region, Auktionshäuser |
| `profile-forever-{region}` | Account, Charaktere, Gilden |

Regionen: US, EU, KR, TW (CN braucht wie immer einen eigenen Client). **Standard ist EU**, umstellbar im Setup und in den Einstellungen.

### Was Forever anders adressiert

- **Charaktere haben keinen Realm.** Vor- und Nachname, pro Region eindeutig. Slug ist `{name}-{surname}` in Kleinbuchstaben.
- **Gilden haben keinen Realm:** `/data/wow/guild/{guild-slug}` plus `roster`, `activity`, `achievements`, im Profil-Namespace.
- **Rulesets statt Realms.** Realm-Index liefert 404, Realm-Suche 0 Treffer. Stattdessen `/data/wow/ruleset/index` – EU und US: 1 PvP, 2 Normal, 3 Rollenspiel, 15 Rollenspiel-PvP; KR und TW nur 1 und 2.

### Blizzard Profil-API (OAuth mit Nutzer-Token)

Laut Community-Tests liefernd, alle unter `/profile/wow/character/{name}-{surname}/…?namespace=profile-forever-{region}`:

| Endpunkt | Liefert | Für Feature |
|---|---|---|
| *(ohne Unterpfad)* | Charakterprofil | Charakterübersicht |
| `equipment` | Angelegte Ausrüstung | Ausrüstung, Upgrades |
| `character-media` | Gerendertes Charakterbild | Darstellung |
| `appearance` | Aussehen | Darstellung |
| `specializations` | Aktive Spezialisierung, Talente | Übersicht |
| `professions` | Berufe, Rezepte, Fertigkeitsstufen | Berufe |
| `collections` | Sammlungen des Charakters | Sammlungen |
| `achievements` | Erfolge mit Zeitstempel | Erfolge |
| `statistics` | Charakterstatistiken | Auswertungen |
| `titles` | Freigeschaltete Titel | Sammlungen |
| `reputations` | Ansehen bei Fraktionen | Ansehen |
| `quests` | Quests | Wochenübersicht |
| `encounters` | Raid- und Dungeon-Abschlüsse | Fortschritt, Wochenübersicht |
| `pvp-summary` | PvP-Werte | PvP |

Account-weit (`/profile/user/wow`, Scope `wow.profile`): listet die Forever-Charaktere; `collections` liefert ebenfalls.
**Wichtig:** Die Account-Übersicht kann dem Charakterprofil um **20–40 Minuten** nachlaufen, z. B. bei der Stufe. Für Stufe und Ausrüstung gilt das Charakterprofil, nicht die Account-Liste.

### Blizzard Spieldaten-API

| Endpunkt | Liefert | Für Feature |
|---|---|---|
| `/data/wow/item/{id}` | Werte, Slot, Stufe, Qualität | Tooltips, Upgrade-Vergleich |
| `/data/wow/playable-class/*`, `playable-race/*` | Klassen, Völker | Darstellung |
| `/data/wow/profession/*`, `recipe/*` | Berufs- und Rezept-Stammdaten | Berufe: Fehlliste |
| `/data/wow/ruleset/index` | Rulesets | Auktionshaus |
| `/data/wow/ruleset/{id}/auctions/` | Auktionshäuser, dann je Haus | Berufs-Wirtschaft |

**Auktionshaus:** Schrägstrich am Ende nötig, sonst 404. 15 Häuser (IDs 110–121, 123–125). Jedes Ruleset liefert dieselben Häuser und Angebote – **nicht über Rulesets aufsummieren**. **Waren (Commodities) laufen pro Haus, aber getrennt:** im Feld `commodities` der Hausantwort bzw. unter `/data/wow/ruleset/{id}/auctions/{houseId}/commodities`; `auctions` enthält nur Einzelstücke. Der alte regionsweite Commodities-Endpunkt liefert 404. Die Häuser 112, 115 und 118 hatten kein `auctions`-Feld. Der Pfad je Haus (`/auctions/{houseId}`) ist **bestätigt** (2026-11-11, rund 110'000 Angebote).

### 404, das kein Fehler ist

- Charaktere unter Stufe 10 oder ohne bisherigen Logout
- `character-media` eine Weile nach dem ersten Auftauchen eines Charakters
- **Gegenstände:** in einem EU-Allianz-Haus lieferten 652 von 1'515 Item-IDs 404 aus static-forever, meist ältere Classic-Gegenstände. Tooltips und Icons brauchen darum eine Darstellung für „keine Stammdaten", statt zu brechen.
- EU-Charakterendpunkte waren am 2026-11-06 bei einem Nutzer durchgehend 404, am selben Tag bei anderen mit 200. Vermutlich Timing – mit dem eigenen Charakter prüfen, nicht annehmen.

### Gestrichen bis bestätigt

Für Forever nicht belegt. Nicht eingeplant, bis ein Test mit echten Daten sie bestätigt:

| Quelle | Hängt daran | Stand |
|---|---|---|
| `/data/wow/journal-instance/*`, `journal-encounter/*` | Loot-Kandidaten je Slot | **Geprüft 2026-11-11: liefert keine Instanzen.** Die Abfrage scheitert nicht (kein Fehler im Log), die Liste ist aber leer. Loot-Index und Kandidatenliste sind darum entfernt, die Tabellen gelöscht (Migration `0008_loot_entfernen`). Der Code steht in der Git-Historie, falls Blizzard nachzieht. |
| `/data/wow/media/item/{id}` | Item-Icons | Kein ausdrücklicher Bericht für Forever |
| Stammdaten Reittiere, Begleiter, Spielzeug, Erfolge, Titel | Fehllisten in Sammlungen und Erfolgen | Nur in der Abdeckungsliste eines Community-SDK genannt, ohne Testbericht |
| `mythic-keystone-profile` | – | Antwortet laut Tests, aber Mythisch+ hat in Forever keinen erkennbaren Inhalt. Aus der App entfernt. |
| `hunter-pets` | Jägertiere | Liefert 404 |
| Warcraft Logs | Raid-Leistung | Nicht geklärt, ob Warcraft Logs Forever führt |
| Bindungsdauern der Schlachtzüge | Wochenübersicht | Die Vanilla-Tabelle gilt als Annahme; jede Länge wird als „angenommen" angezeigt |

### Bestätigt nach Test mit echten Daten

| Quelle | Hängt daran | Stand |
|---|---|---|
| `/data/wow/talent-tree/index`, `/data/wow/talent-tree/{id}/playable-specialization/{specId}`, `/data/wow/talent/index`, `/data/wow/playable-specialization/index` | Talentbuilds | **200, 2026-11-11** (static, versionierter Namespace). Ein Baum je Spezialisierung, klassisch drei je Klasse; Knoten in `spec_talent_nodes` mit Rängen und Tooltips. Die Knoten tragen `display_row`, `display_col` und `locked_by`; die Spalten liegen in einem gemeinsamen Raster der Bäume einer Klasse. |
| `/profile/wow/character/{slug}/specializations` | Talentbuilds, Übersicht | **200, 2026-11-11.** `specialization_groups` mit aktiver Gruppe, je Baum `talents` (mit `talent_rank`) und `spent_points`. |

### Nicht verfügbar – unabhängig vom Aufwand

| Wunsch | Warum nicht |
|---|---|
| Gold, Währungen, Taschen- und Bankinhalt | Die API führt das nicht. Nur über einen Export aus einem AddOn. |
| DPS-Bewertung, Best-in-Slot | Braucht Statgewichte. Blizzard liefert keine, Raidbots hat keine offene API. Nur über eigene SimulationCraft-Instanz. |
| Drehbares 3D-Charaktermodell | Die API liefert ein gerendertes PNG aus festem Winkel. Nur über Fremd-Viewer. |
| Live-Daten während des Spielens | Die Profil-API aktualisiert erst beim Ausloggen des Charakters. |
| Dokumentation | Blizzard hat die Forever-API nicht dokumentiert. Jeder Endpunkt kann sich ohne Ankündigung ändern. |

**Die Verzögerung der Profil-API ist wichtig für die Erwartung:** Charakterdaten spiegeln den Stand beim letzten Ausloggen, nicht den Moment. Ein Polling-Intervall unter mehreren Minuten bringt darum nichts.

---

## 3. Phase 0 – Umstellung auf Forever (umgesetzt, Grundfunktion geprüft)

> **Stand 2026-11-11:** umgesetzt und gemergt. Der erste Durchlauf mit echten Daten im
> Docker-Container ist bestätigt: Setup, Anmeldung, Account-Liste mit Vor- und Nachnamen,
> Charakterkopf mit Stufe, Gegenstandsstufe und Ruleset. Die Charakter-Tabs hat der Nutzer
> danach durchgesehen: „die Informationen, die abgebildet werden, stimmen" (Phase 1).

### Alte Spielmodi entfernen – erledigt

- [x] `GAME_MODES` ist ganz entfallen, nicht auf einen Eintrag geschrumpft: bei einem Modus wäre die Liste nur noch Umweg. An ihre Stelle tritt `namespace("profile" | "static" | "dynamic")` in `battlenet.ts`, das die Region bei jedem Aufruf liest.
- [x] `GameModeTabs` entfernt
- [x] `src/lib/adapters/` gelöscht
- [x] Mythisch+ entfernt (Panel, Abruf, Verlaufsreihe, Wörterbuch)
- [x] Modus-Weichen aufgelöst (Auktionshaus, Verzauberungen, Gegenstandsstufe, Ausrüstungshinweise)
- [x] Spielmodus-Auswahl aus Setup und Einstellungen entfernt; Wörterbücher um die entfallenen Schlüssel gekürzt
- [x] **Alte Daten löschen:** Migration `0007_wow_forever` legt Snapshots, Favoriten, Loot-Index und Auktionspreise neu an – die alten Zeilen sind damit weg – und entfernt `gameModes`/`defaultMode` aus der Konfiguration. **Vor dem Einspielen Datenbank und `prisma/config.key` sichern.**

### Forever-Adressierung einbauen – erledigt

- [x] **Charakterpfad** `{name}-{surname}`: in den API-Aufrufen (`characterPath`), in den Routen (`/dashboard/[character]`) und im Snapshot-Schlüssel (`region` + `charSlug`)
- [x] Der Slug kommt bevorzugt aus `character.href` der Account-Liste, sonst aus `name` + `surname`
- [x] **Static-Version** wird aus den `playable_class`-Links gelernt und bei 403 benutzt
- [x] **Gilde** über `/data/wow/guild/{guild-slug}`, Mitglieder über ihren Slug
- [x] **Auktionshaus** über Rulesets, gespeichert je Region und Haus
- [x] **Region:** war schon im Setup und in den Einstellungen wählbar, Standard EU. Neu: sie steht in jedem Datenbankschlüssel, damit ein Wechsel nie Stände der alten Region zeigt.
- [x] Kopf der Charakterseite: Vor- und Nachname, Stufe und Ruleset statt Realm
- [x] Charakterliste nach Fraktion gruppiert – die Account-Liste nennt weder Realm noch Ruleset
- [x] Wochenübersicht: Bindungsdauern gelten als angenommen (siehe „Gestrichen bis bestätigt")

### 404 sauber einordnen – erledigt

- [x] `attempt()` setzt `notFound` bei 404; gemeinsame Darstellung `<NoDataYet />` im Charakterkopf und auf allen Charakterseiten
- [x] Ein Account ohne Forever-Charakter ergibt eine leere Liste, keinen Fehler
- [x] Gegenstände ohne Stammdaten: die Ausrüstung kommt ohne sie aus (Name, Stufe und Werte stehen in der Ausrüstungsantwort), es fehlt höchstens das Icon. Der Kandidaten-Tooltip, der Stammdaten gebraucht hätte, ist mit dem Loot-Bereich entfallen.

### Mit echten Daten prüfen – Grundfunktion erledigt (2026-11-11)

- [x] Migrationen im Container eingespielt
- [x] Setup und Anmeldung im Container – dabei zwei Fehler gefunden und behoben: der Konfigurationsspeicher war je Seite getrennt, und `next build` hatte die Setup-Seiten samt Weiterleitung vorgerechnet (siehe [Setup-Modus](./setup-modus.md))
- [x] Account-Liste: Vor- und Nachname, Stufe kommen
- [x] Profil: Stufe, Gegenstandsstufe und Ruleset kommen und werden angezeigt
- [x] Journal-API: liefert keine Instanzen → Loot-Bereich entfernt
- [ ] Gilde: in welcher Form `guild.slug` kommt, ist nicht einzeln geprüft
- [ ] Die übrigen Endpunkte aus Abschnitt 2 einzeln festhalten (Phase 1)

---

## 4. Architektur-Entscheidungen

Die drei Punkte bleiben, ändern sich aber durch den Wegfall der Realms.

### 4.1 Caching: Snapshots statt Durchreichen

Die Snapshot-Tabelle bleibt die Grundlage für Verlauf, Offline-Anzeige und weniger Anfragen. Für Forever hat sich nur der Schlüssel geändert: `gameMode` fällt weg, `realmSlug` und `charName` werden zu einem `charSlug`, dazu kommt die Region. Der Tag bleibt im eindeutigen Schlüssel – so entsteht die Historie von selbst.

```prisma
model CharacterSnapshot {
  id        String   @id @default(cuid())
  region    String
  /// `{name}-{surname}`, `@account` oder `@guild:<slug>`
  charSlug  String
  dataset   String
  /// Tag als YYYY-MM-DD
  day       String
  payload   String
  fetchedAt DateTime @default(now())

  @@unique([region, charSlug, dataset, day])
}
```

Vorteile, die über Geschwindigkeit hinausgehen:

- **Verlauf.** Behält man alte Snapshots, entsteht die eigentliche Companion-Funktion: „Deine Gegenstandsstufe ist diese Woche gestiegen", „drei neue Reittiere seit Montag", „Erfolg X am 12.11. abgeschlossen". Das kann keine Live-Abfrage.
- **Offline benutzbar.** Ist Battle.net gerade nicht erreichbar, zeigt die App den letzten Stand mit Zeitstempel statt eines Fehlers.
- **Weniger Anfragen.** Ein Datensatz wird nur geholt, wenn der Snapshot älter als eine gesetzte Frist ist.

**Für Forever besonders wichtig:** Liefert ein Endpunkt plötzlich 404, weil Blizzard die undokumentierte API umbaut, bleibt der letzte Stand sichtbar.

### 4.2 Navigation: Unterseiten je Charakter

```
/dashboard                                Charakterliste
/dashboard/account                        Sammlungen, accountweite Statistik
/dashboard/woche                          Wochenübersicht
/dashboard/{name}-{surname}               Übersicht: Kopfzeile, Ausrüstung
/dashboard/{name}-{surname}/berufe
/dashboard/{name}-{surname}/erfolge
/dashboard/{name}-{surname}/fortschritt   Raids, Dungeons
/dashboard/{name}-{surname}/pvp
/dashboard/{name}-{surname}/verlauf       Aus den Snapshots
```

Tab-Leiste unter dem Charakterkopf. Die Spielmodus-Tabs sind entfallen. Die Region steht nicht in der URL, sondern kommt aus der Konfiguration. Die statischen Seiten (`account`, `woche`, `einstellungen`) kollidieren nicht mit Charakteren: ein Charakter-Slug enthält immer einen Bindestrich.

### 4.3 Auffrischen im Hintergrund

Momentan zieht der Browser. Für einen Companion wäre ein serverseitiger Auffrischer besser: einmal täglich alle Charaktere durchgehen, Snapshots schreiben, damit die Verlaufsdaten auch entstehen, wenn niemand die Seite offen hat.

**Verworfen 2026-11-11.** Der Companion läuft, während gespielt wird, und die Profile ziehen erst beim Ausloggen nach – an Tagen ohne Spielen gäbe es nichts Neues zu holen. Kurz gebaut und wieder entfernt. Nebenbei geklärt: Battle.net stellt keine Refresh-Tokens aus, ein Nutzertoken lebt 24 Stunden. Siehe [Setup-Modus](./setup-modus.md).

---

## 5. Phasen

### Phase 1 – Bestehende Ansichten auf Forever prüfen

Die Ansichten sind für Retail und Classic gebaut und in Phase 0 auf die Forever-Adressierung umgestellt. Jede wird gegen echte Forever-Daten geprüft und angepasst, bevor Neues dazukommt.

> **2026-11-11:** Der Nutzer hat die Charakter-Tabs durchgesehen; die gezeigten Daten
> stimmen. Abgehakt ist, was damit belegt ist. Offen bleiben die Punkte mit einer
> eigenen, nicht sichtbaren Frage (Waren im Auktionshaus, Bindungsdauern – Letztere vom
> Nutzer vorerst zurückgestellt).

- [x] **Charakterliste und Übersicht:** Nachname, Ruleset, Stufe, Gegenstandsstufe (2026-11-11)
- [x] **Ausrüstung:** Paperdoll und Tooltips mit Rückfall für fehlende Item-Stammdaten
- [x] **Berufe:** Fertigkeitsstufen und bekannte Rezepte; Fehlliste gegen `/data/wow/profession/*`
- [x] **Fortschritt:** Raids und Dungeons aus `encounters`
- [x] **Sammlungen, Erfolge, Titel, Ansehen:** Anzeige des Besessenen; Fehllisten nur, wo die Stammdaten bestätigt sind
- [x] **PvP:** aus `pvp-summary`; „nie gespielt" statt leerer Zeile
- [x] **Gilde:** realmlos, mit Roster und Aktivität
- [ ] **Auktionshaus und Berufs-Wirtschaft:** Pfad je Haus bestätigt (2026-11-11); dabei fehlten die Waren im Index – behoben, Kostensummen mit echten Daten noch zu prüfen
- [ ] **Wochenübersicht:** Lockouts aus `encounters`, Bindungsdauern der Forever-Raids belegen
- [x] **Verlauf:** läuft auf dem neuen Snapshot-Schlüssel

### Phase 2 – Detailschliff

Kleine, abgeschlossene Verbesserungen an dem, was nach Phase 1 steht.

- [ ] Detailseite: Spezialisierung anzeigen (`specializations`)
- [ ] Charakterliste: Spalte für Spezialisierung
- [ ] Ausrüstung: Aussehen aus `appearance`
- [ ] **Upgrade-Vergleich im Tooltip:** Werte eines Gegenstands gegen das angelegte Item, Differenz je Wert. Braucht keine Statgewichte und nur `/data/wow/item/{id}`.
- [ ] Fehlerbild vereinheitlichen – auf dem 404-Umgang aus Phase 0 aufbauend

### Phase 3 – Was es nur in Forever gibt

- [ ] Vor- und Nachname als Charakteridentität durchgängig, auch im Verlauf
- [ ] Ruleset des Charakters in der Charakterliste (die Account-Liste führt es nicht – braucht den Profilabruf)
- [ ] Prüfen, welche Forever-eigenen Inhalte die API führt (neue Zonen, Dungeons, 10er- und 20er-Raids, accountweite Vorteile) – und nur das Belegte einplanen

### Phase 4 – Auswertung und Verlauf

Baut auf der Snapshot-Historie auf und ist der Teil, den es so nirgends fertig gibt.

- [ ] **Verlaufsseite:** Gegenstandsstufe, Erfolge, Sammlungen über Zeit
- [ ] **Wochenrückblick:** was sich seit letzter Woche geändert hat, über alle Charaktere
- [ ] **Reset-Tracker:** wöchentliche Quests und Belohnungen, sobald belegt ist, was `quests` dafür liefert

---

## 6. Reihenfolge-Empfehlung

Die verbindliche Reihenfolge steht in [Reihenfolge](./reihenfolge.md). Die Empfehlung aus Sicht dieser Roadmap:

1. ~~**Prüfung mit echten Daten**~~ – Grundfunktion erledigt 2026-11-11
2. ~~**Phase 1**~~ (Bestand prüfen) – bis auf Auktionshaus und Wochenübersicht erledigt 2026-11-11
3. **Phase 2** (Detailschliff) – schnelle Erfolge
4. **Phase 3** (Forever-Eigenes) – erst wenn klar ist, was die API dazu führt
5. **Phase 4** (Verlauf) – braucht gesammelte Forever-Snapshots, wird mit der Zeit besser

**Der Verlauf ist das Argument, Phase 0 bald einzuspielen:** Forever-Snapshots entstehen erst, wenn die App Forever-Charaktere abruft. Jede Woche davor fehlt später im Verlauf.

---

## 7. Entscheide

### Entschieden (2026-11-11)

- [x] **Alte Snapshots** von Retail- und Classic-Charakteren werden gelöscht – Migration `0007_wow_forever`, mit Backup davor.
- [x] **Region:** Standard EU, im Setup bzw. in den Einstellungen auf US, KR oder TW umstellbar.
- [x] **Hintergrund-Auffrischer:** verworfen – der Companion läuft beim Spielen. Siehe 4.3.

### Offen

- [ ] **Mehrere Nutzer**: Bisher sieht jeder nur seine Charaktere. Sollen du und dein Kollege Gilden- oder Vergleichsansichten teilen können?
- [ ] **Fremd-Viewer für das 3D-Modell** – bewusst dagegen entschieden oder als abschaltbarer Zusatz?

---

## 8. Quellen

- WoW Forever – Community-Stand der API (Namespaces, Endpunkte, 404-Fälle, Auktionshaus) – https://us.forums.blizzard.com/en/blizzard/t/wow-forever-api-what-works-so-far-plus-a-ts-client/60334
- WoW Forever – Namespace-Thread vor dem Start (Account-Liste mit `surname`, `character.href`) – https://us.forums.blizzard.com/en/blizzard/t/world-of-warcraft-forever-api-namespace/59774
- WoW Forever – EU-Charakterendpunkte mit 404 (2026-11-06) – https://us.forums.blizzard.com/en/blizzard/t/wow-forever-eu-all-character-profile-endpoints-return-404/60355
- WoW Forever – Gegenprobe mit 200 auf EU (2026-11-06) – https://github.com/Everloot/everloot/pull/867
- WoW Forever – Community-SDK mit Abdeckungsliste der Namespaces – https://github.com/SideQuest-Guild/wow-forever-sdk
- Blizzard API-Dokumentation (allgemein, ohne Forever) – https://develop.battle.net/documentation
