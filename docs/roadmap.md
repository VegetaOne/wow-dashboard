# WoW Dashboard – Roadmap

> Stand: 2026-09-15
> Ziel: ein Begleiter für die eigene WoW-Zeit – Charaktere, Ausrüstung, Fortschritt,
> Berufe, Sammlungen und Raid-Leistung an einem Ort, self-hosted, erweiterbar auf WoW Forever.
> Verbindliche Reihenfolge steht in [Reihenfolge und Entscheide](./reihenfolge.md).

---

## 1. Leitprinzipien

Diese vier Regeln haben sich beim Bau der ersten Version bewährt und gelten weiter:

**Ehrlich beschriften.** Was die Daten nicht hergeben, wird nicht behauptet. „Loot-Kandidaten" statt „Best in Slot", „aus 12 von 30 geladen" statt eines stillschweigend wandernden Schnitts. Eine Zahl ohne Grundlage ist schlimmer als keine Zahl.

**Nur laden, was gebraucht wird.** Ein Companion hat viele Ansichten. Würde jede beim Aufruf alles holen, wäre die App unbenutzbar. Jede neue Ansicht lädt ihre Daten selbst und erst wenn sie sichtbar ist.

**Offizielle APIs zuerst.** Fremdquellen ohne dokumentierte API (Wowhead, Raidbots, Sixty Upgrades) kommen nicht in den Kern. Wo sie unvermeidlich sind, werden sie als abschaltbarer Zusatz gebaut, von dem die App nicht abhängt.

**Adapter-Grenze halten.** Alles Spielmodus-Abhängige läuft über `GAME_MODES` und die Adapter-Schnittstelle. WoW Forever soll später ein Eintrag sein, kein Umbau.

---

## 2. Datenquellen – was geht, was nicht

### Blizzard Profil-API (OAuth mit Nutzer-Token)

Bestätigt vorhanden, alle unter `/profile/wow/character/{realm}/{name}/…`:

| Endpunkt | Liefert | Für Feature |
|---|---|---|
| `professions` | Berufe, Rezepte, Fertigkeitsstufen | Berufe |
| `collections/mounts` | Reittiere des Charakters | Sammlungen |
| `collections/pets` | Begleiter | Sammlungen |
| `collections/toys` | Spielzeug | Sammlungen |
| `achievements` | Erfolge mit Zeitstempel | Erfolge |
| `achievements/statistics` | Statistikwerte | Erfolge, Auswertungen |
| `titles` | Freigeschaltete Titel | Sammlungen |
| `reputations` | Ansehen bei Fraktionen | Reputationen |
| `statistics` | Charakterstatistiken | Auswertungen |
| `quests` / `quests/completed` | Offene und erledigte Quests | Wochenübersicht |
| `encounters/raids` | Bosskills je Schwierigkeit | Raid-Fortschritt |
| `encounters/dungeons` | Dungeon-Abschlüsse | Fortschritt |
| `mythic-keystone-profile` | M+-Läufe, Great Vault | Mythisch+ (Retail) |
| `pvp-summary`, `pvp-bracket/{b}` | Arena- und BG-Werte | PvP |
| `hunter-pets` | Jägertiere | Sammlungen |
| `appearance` | Aussehen, Transmog | Darstellung |
| `specializations` | Talente, aktive Spezialisierung | Ausrüstung, Auswertungen |

Account-weit (`/profile/user/wow/…`): `collections/mounts`, `collections/pets`.
**Wichtig:** Reittiere und Begleiter sind account-, nicht charaktergebunden – die gehören auf eine Account-Seite, nicht in die Charakteransicht.

### Blizzard Spieldaten-API (statischer Namespace)

| Endpunkt | Liefert | Für Feature |
|---|---|---|
| `/data/wow/item/{id}` | Werte, Slot, Stufe, Qualität | Tooltips, Loot-Vergleich |
| `/data/wow/media/item/{id}` | Icon-URL | Icons überall |
| `/data/wow/journal-instance/*`, `journal-encounter/*` | Loot-Tabellen | Loot-Kandidaten (gebaut) |
| `/data/wow/mount/*`, `/data/wow/pet/*` | Stammdaten der Sammelobjekte | Sammlungen: Fehlliste |
| `/data/wow/achievement/*` | Erfolgs-Stammdaten, Kategorien | Erfolge: Fehlliste |
| `/data/wow/profession/*`, `recipe/*` | Berufs- und Rezept-Stammdaten | Berufe: Fehlliste |
| `/data/wow/connected-realm/{id}/auctions` | Auktionshaus | Berufs-Wirtschaft |
| `/data/wow/guild/{realm}/{name}` + `roster` | Gilde | Gilde |

### Warcraft Logs – API v2 (eigene OAuth-Registrierung)

Bestätigt vorhanden:

- GraphQL, öffentlich: `https://www.warcraftlogs.com/api/v2/client`
- GraphQL, nutzerbezogen: `https://www.warcraftlogs.com/api/v2/user`
- Token: `https://www.warcraftlogs.com/oauth/token`
- Client-Credentials-Flow reicht für öffentliche Reports – das ist unser Fall
- Scopes für private Reports: `view-user-profile`, `view-private-reports`

Erfordert eine **zweite App-Registrierung**, unabhängig von Battle.net.

### Raider.IO

Öffentliche, dokumentierte API für M+-Scores und Rankings. Kein Token nötig.
Nur für Retail relevant.

### Nicht verfügbar – unabhängig vom Aufwand

| Wunsch | Warum nicht |
|---|---|
| Gold, Währungen, Taschen- und Bankinhalt | Die API führt das nicht. Nur über einen Export aus einem AddOn. |
| DPS-Bewertung, Best-in-Slot | Braucht Statgewichte. Blizzard liefert keine, Raidbots hat keine offene API. Nur über eigene SimulationCraft-Instanz. |
| Drehbares 3D-Charaktermodell | Die API liefert ein gerendertes PNG aus festem Winkel. Nur über Fremd-Viewer. |
| Live-Daten während des Spielens | Die Profil-API aktualisiert erst beim Ausloggen des Charakters. |

**Die Verzögerung der Profil-API ist wichtig für die Erwartung:** Charakterdaten spiegeln den Stand beim letzten Ausloggen, nicht den Moment. Ein Polling-Intervall unter mehreren Minuten bringt darum nichts.

---

## 3. Phase 0 – Detailschliff (nächster Schritt)

Kleine, abgeschlossene Verbesserungen an dem, was schon steht.

### Icons und Tooltips für Loot-Kandidaten

Die Kandidatenliste zeigt derzeit nur Namen und Stufe. Angeglichen an die ausgerüsteten Items:

- **Icons:** Nicht in den Index schreiben. Der Index ruft schon einen Endpunkt pro Item auf; Icons dort mitzuziehen würde ihn verdoppeln. Stattdessen `getItemIcons` für die aufgeklappten Kandidaten eines Slots nachladen – höchstens acht, und serverseitig eine Woche gecacht.
- **Tooltip:** Beim Überfahren `/data/wow/item/{id}` holen und im Client zwischenspeichern. Der bestehende `ItemTooltip` wird so umgebaut, dass er sowohl ein Ausrüstungsteil als auch ein Stammdaten-Item annimmt.
- **Vergleich im Tooltip:** Werte des Kandidaten gegen das angelegte Item, Differenz je Wert. Das ist die eigentlich nützliche Information und braucht keine Statgewichte.

### Weitere Kleinigkeiten

- Detailseite: Spezialisierung und Talente anzeigen (`specializations`)
- Charakterliste: Spalte für Spezialisierung
- Ausrüstung: Transmog-Anzeige aus `appearance`
- Fehlerbild vereinheitlichen – momentan gibt es drei verschiedene Darstellungen

---

## 4. Architektur-Entscheidungen, die vor Phase 1 fallen müssen

Diese drei Punkte entscheiden, ob die Erweiterung trägt oder in Umbauten endet.

### 4.1 Caching: Snapshots statt Durchreichen

Bisher: jede Ansicht fragt bei Bedarf die API und verlässt sich auf den Fetch-Cache von Next (5 Minuten, nur im Prozess).

Das reicht nicht mehr, sobald mehrere Ansichten pro Charakter dazukommen. Der Vorschlag ist eine **Snapshot-Tabelle** wie beim Loot-Index:

```prisma
model CharacterSnapshot {
  id         String   @id @default(cuid())
  gameMode   String
  realmSlug  String
  charName   String
  /// "professions" | "collections" | "achievements" | "raids" | …
  dataset    String
  /// Rohantwort als JSON
  payload    String
  fetchedAt  DateTime @default(now())

  @@unique([gameMode, realmSlug, charName, dataset])
  @@index([gameMode, dataset])
}
```

Vorteile, die über Geschwindigkeit hinausgehen:

- **Verlauf.** Behält man alte Snapshots, entsteht die eigentliche Companion-Funktion: „Deine Gegenstandsstufe ist diese Woche von 604 auf 619 gestiegen", „drei neue Reittiere seit Montag", „Erfolg X am 12.9. abgeschlossen". Das kann keine Live-Abfrage.
- **Offline benutzbar.** Ist Battle.net gerade nicht erreichbar, zeigt die App den letzten Stand mit Zeitstempel statt eines Fehlers.
- **Weniger Anfragen.** Ein Datensatz wird nur geholt, wenn der Snapshot älter als eine gesetzte Frist ist.

**Entscheid nötig:** nur den jeweils neuesten Snapshot behalten, oder eine Historie? Historie kostet Platz (bei 30 Charakteren × 8 Datensätzen × täglich ≈ 7.000 Zeilen im Jahr, unkritisch für SQLite) und ist die Grundlage für alles Verlaufsbezogene. Empfehlung: Historie, aber ausdünnen – täglich einen Stand behalten, nicht jeden Abruf.

### 4.2 Navigation: Unterseiten je Charakter

Die Charakterseite wird sonst zu lang. Vorschlag:

```
/dashboard                          Charakterliste (gebaut)
/dashboard/account                  Sammlungen, accountweite Statistik
/dashboard/{realm}/{name}           Übersicht: Kopfzeile, Ausrüstung (gebaut)
/dashboard/{realm}/{name}/berufe
/dashboard/{realm}/{name}/erfolge
/dashboard/{realm}/{name}/fortschritt   Raids, Dungeons, M+
/dashboard/{realm}/{name}/logs          Warcraft Logs
/dashboard/{realm}/{name}/pvp
/dashboard/{realm}/{name}/verlauf       Aus den Snapshots
```

Tab-Leiste unter dem Charakterkopf, im Stil der bestehenden `GameModeTabs`.

### 4.3 Auffrischen im Hintergrund

Momentan zieht der Browser. Für einen Companion wäre ein serverseitiger Auffrischer besser: einmal täglich alle Charaktere durchgehen, Snapshots schreiben, damit die Verlaufsdaten auch entstehen, wenn niemand die Seite offen hat.

Zwei Wege: ein zweiter Container mit einem Cron-Prozess, oder eine Route, die von einem `cron`-Eintrag auf dem Host angestossen wird. Der zweite ist einfacher und reicht im Heimnetz.

**Wichtig:** Das braucht einen gültigen Refresh-Token ohne Nutzer im Browser. Battle.net-Refresh-Tokens sind langlebig, müssen aber verschlüsselt persistiert werden – bisher liegen sie nur in der Session. Das ist der eigentliche Aufwand an diesem Punkt.

---

## 5. Phasen

### Phase 1 – Fortschritt und Berufe

Die Datensätze mit dem besten Verhältnis von Nutzen zu Aufwand, weil sie ohne neue Fremdquelle auskommen.

- [ ] Snapshot-Tabelle und Auffrisch-Logik (4.1)
- [ ] Tab-Navigation je Charakter (4.2)
- [ ] **Berufe:** Berufe mit Fertigkeitsstufe, bekannte Rezepte, Fortschrittsbalken. Abgleich mit den Stammdaten (`/data/wow/profession/*`) ergibt die Fehlliste – „diese Rezepte kennst du noch nicht".
- [ ] **Raid- und Dungeon-Fortschritt:** Bosskills je Schwierigkeit, aus `encounters/raids`. Pro Tier gruppiert, mit Fortschrittsanzeige.
- [ ] **Spezialisierung und Talente** auf der Übersicht

### Phase 2 – Sammlungen und Erfolge

- [ ] **Account-Seite** für accountweite Daten
- [ ] **Reittiere:** Besessene gegen alle vorhandenen (`/data/wow/mount/index`) – Sammelfortschritt und Fehlliste mit Quelle
- [ ] **Begleiter und Spielzeug:** analog
- [ ] **Titel**
- [ ] **Erfolge:** nach Kategorie, Fortschritt je Kategorie, zuletzt erreichte mit Datum. Die Erfolgs-Stammdaten sind umfangreich – das braucht einen Index wie beim Loot.
- [ ] **Reputationen:** Ansehen je Fraktion, gruppiert nach Erweiterung

### Phase 3 – Raid-Leistung (Warcraft Logs)

- [ ] Eigene App bei Warcraft Logs registrieren, Client-Credentials in die `.env`
- [ ] GraphQL-Client gegen `api/v2/client`, Token-Verwaltung mit Ablauf
- [ ] **Berichte je Charakter:** letzte Kämpfe, Parse-Prozente, Rolle
- [ ] **Verlauf:** Entwicklung der Parses über die Zeit, aus den Snapshots
- [ ] **Gildenberichte**, falls die Gilde öffentlich loggt

**Vorbehalt:** Warcraft Logs deckt nur ab, was auch geloggt und hochgeladen wurde. Für Charaktere, deren Gilde nicht loggt, bleibt die Ansicht leer – das muss die Oberfläche sagen, statt wie ein Fehler auszusehen.

### Phase 4 – Wirtschaft und Gilde

- [ ] **Gilde:** Mitgliederliste mit Gegenstandsstufen, Gildenerfolge, Aktivität
- [ ] **Auktionshaus:** aktuelle Preise für die Materialien der eigenen Berufe. Der Auktionsendpunkt liefert grosse Antworten (mehrere MB) – braucht einen eigenen Index und ein sinnvolles Auffrisch-Intervall.
- [ ] **Berufs-Wirtschaft:** Herstellkosten gegen Verkaufspreis für bekannte Rezepte. Hier wird die App wirklich nützlich statt nur informativ.

### Phase 5 – Auswertung und Verlauf

Baut auf der Snapshot-Historie auf und ist der Teil, den es so nirgends fertig gibt.

- [ ] **Verlaufsseite:** Gegenstandsstufe, Erfolge, Sammlungen, Parses über Zeit
- [ ] **Wochenrückblick:** was sich seit letzter Woche geändert hat, über alle Charaktere
- [ ] **Charaktervergleich:** zwei Charaktere nebeneinander
- [ ] **Reset-Tracker:** Wochenreset, offene Wochenaufgaben, Great Vault

### Phase 6 – WoW Forever

- [ ] `GAME_MODES` um den Modus ergänzen, sobald die Namespaces bekannt sind
- [ ] `WoWForeverAdapter` befüllen
- [ ] Prüfen, welche Datensätze der neue Modus überhaupt führt – wahrscheinlich anfangs deutlich weniger
- [ ] Modus-spezifische Ansichten für alles, was es nur dort gibt

---

## 6. Reihenfolge-Empfehlung

> **Überholt.** Dieser Abschnitt und Abschnitt 7 sind durch [Reihenfolge und Entscheide](./reihenfolge.md) ersetzt, wo dort etwas anderes steht.

Die Architekturpunkte aus Abschnitt 4 **vor** Phase 1 – nicht danach. Snapshot-Schicht und Tab-Navigation nachträglich einzuziehen, wenn schon fünf Ansichten daran hängen, kostet ein Mehrfaches.

Danach nach dem, was am meisten für die eigene Spielzeit bringt:

1. **Architektur** (Snapshots, Navigation) – Grundlage
2. **Phase 0** (Detailschliff) – schnelle Erfolge, macht das Bestehende rund
3. **Berufe** – täglich genutzt, keine Fremdquelle nötig
4. **Fortschritt** – Raids und Dungeons
5. **Sammlungen** – die Fehllisten sind der eigentliche Mehrwert
6. **Warcraft Logs** – grösster Einzelaufwand, aber der Teil, der über andere Tools hinausgeht
7. **Verlauf** – braucht erst gesammelte Snapshots, wird mit der Zeit besser
8. **Wirtschaft** – Auktionsdaten sind umfangreich, lohnt sich nur bei aktivem Handel

**Der Verlauf ist das Argument, früh mit Snapshots anzufangen:** Er wird nur gut, wenn schon Monate an Daten liegen. Die Schicht jetzt zu bauen kostet wenig und ist die Voraussetzung dafür, dass Phase 5 später überhaupt etwas zeigen kann.

---

## 7. Offene Entscheide

- [ ] **Snapshot-Historie** behalten oder nur den neuesten Stand? (Empfehlung: Historie, täglich ausgedünnt)
- [ ] **Hintergrund-Auffrischer** jetzt oder später? Erfordert persistente, verschlüsselte Refresh-Tokens.
- [ ] **Warcraft Logs**: eigene App registrieren – willst du das? Ohne sie entfällt Phase 3.
- [ ] **Mehrere Nutzer**: Bisher sieht jeder nur seine Charaktere. Sollen du und dein Kollege Gilden- oder Vergleichsansichten teilen können?
- [ ] **Fremd-Viewer für das 3D-Modell** – bewusst dagegen entschieden oder als abschaltbarer Zusatz?
- [ ] **Sprache**: Alles ist auf `de_DE` verdrahtet. Umschaltbar machen?

---

## 8. Quellen

- Warcraft Logs API v2: GraphQL-Endpunkte und OAuth-Flows – https://github.com/aurokin/warcraft_cli/blob/main/docs/warcraftlogs/README.md
- Blizzard Profil-Endpunkte (Berufe, Sammlungen, Erfolge, Fortschritt) – https://pkg.go.dev/github.com/Thenecromance/Go_Blizzard_API/api/wow/ProfileService
- Blizzard Journal-API (Loot-Tabellen) – https://pkg.go.dev/github.com/Thenecromance/Go_Blizzard_API/api/wow/DataService/Journal
- Blizzard API-Dokumentation – https://develop.battle.net/documentation
