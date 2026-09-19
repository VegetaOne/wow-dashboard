# Auftrag: Sprachumschalter fertigstellen

> Angelegt: 2026-09-19 · Für Claude Code im Repo `wow-dashboard`
> Vorwissen: [i18n](../i18n.md) (Aufbau und Regeln), [CLAUDE.md](../../CLAUDE.md)

## Ziel

Die Oberfläche ist vollständig zweisprachig. Nach dem Umschalten auf Englisch steht
nirgends mehr ein deutscher Text — auch nicht in Tooltips, `alt`-Texten, Platzhaltern,
Fehlermeldungen oder zusammengesetzten Sätzen.

**Abnahme insgesamt:**

1. `npx tsc --noEmit` und `npm run build` laufen durch.
2. In `src/components/` und `src/app/` findet dieser Aufruf keinen Treffer mehr, der ein
   Oberflächentext ist:
   ```bash
   grep -rnE '"[^"]*(ä|ö|ü|ß|Ä|Ö|Ü)[^"]*"' src/components src/app
   grep -rnE '>[^<>{}\n]*(ä|ö|ü|ß|Ä|Ö|Ü)[^<>{}\n]*<' src/components src/app
   ```
   Treffer in Kommentaren sind in Ordnung und bleiben deutsch.
3. Jede Datei in `src/lib/dict/` hat in `en` mindestens einen Schlüssel — keine leere Hülle.
4. Kein Schlüssel kommt in zwei Bereichsdateien vor. Gegenprobe:
   ```bash
   grep -rhoE '^\s+"[a-zA-Z0-9._]+":' src/lib/dict/*.ts | tr -d ' ":' | sort | uniq -d
   ```
   Muss leer sein.
5. Von Hand: mit dem Umschalter zwischen `en` und `de` wechseln und jede Ansicht einmal
   aufrufen. Was dabei nicht ohne echte Battle.net-Daten zu sehen ist, wird als ungeprüft
   benannt, nicht als fertig.

## Nicht Ziel

- **Keine Textänderungen.** Bestehende deutsche Formulierungen werden übersetzt, nicht
  verbessert, gekürzt oder umgeschrieben. Fällt dir eine schlechte Formulierung auf:
  notieren, nicht ändern.
- **Keine neuen Funktionen**, keine Umbauten an der Logik, kein Aufräumen nebenbei.
- **Kein `src/lib/adapters/`** anfassen — das ist ein eigener Auftrag.
- **Keine Sprache pro Nutzer.** Die Sprache gilt instanzweit und steht in `AppConfig`.

## Ausgangslage

Steht schon: `src/lib/i18n.ts` (Mechanik), `src/lib/t.ts` (`getT()` für Server-Komponenten),
`src/components/I18nProvider.tsx` (`useT()`, `useLanguage()`), der Umschalter, die Route
`src/app/api/language/`, und die Wörterbücher `core` (238 Schlüssel), `setup` (162),
`achievements` (36), `collections` (36), `progress` (22), `reputation` (22).

Leere Hüllen: `equipment` · `professions` · `pvp` · `guild` · `economy` · `history` · `loot`

Komponenten ohne einen `t()`-Aufruf: `EquipmentPanel` · `ItemTooltip` ·
`CandidateTooltip` · `SlotCandidates` · `LootIndexPanel` · `ProfessionsPanel` ·
`PvpPanel` · `GuildRoster` · `EconomyPanel` · `TrendChart` · `MythicPanel`

---

## Teil 0 — Vier Vorentscheide

Diese vier Punkte betreffen alle Bereiche. Sie gehören **vor** den ersten Bereich
erledigt, sonst werden sie sieben Mal unterschiedlich gelöst.

### V1 — Qualitätsnamen liegen dreifach im Code

`EquipmentPanel.tsx`, `ItemTooltip.tsx` und `CandidateTooltip.tsx` haben jeweils ihre
eigene Tabelle:

```ts
POOR: "Schlecht", COMMON: "Gewöhnlich", UNCOMMON: "Ungewöhnlich", RARE: "Selten", …
```

Das ist schon ohne Übersetzung eine Dublette und wäre danach eine dreifache.

**Zu tun:** Schlüssel `equipment.quality.poor` … `equipment.quality.heirloom` im Bereich
`equipment`, dazu in `src/lib/battlenet.ts` neben `QUALITY_COLORS` eine Funktion
`qualityLabelKey(quality: string | null): TranslationKey`, die den API-Typ auf den
Schlüssel abbildet. Die drei Komponenten rufen nur noch `t(qualityLabelKey(q))`.
Ein unbekannter Qualitätstyp gibt `—` zurück, nicht den Rohwert.

| Schlüssel | en | de |
| --- | --- | --- |
| `equipment.quality.poor` | Poor | Schlecht |
| `equipment.quality.common` | Common | Gewöhnlich |
| `equipment.quality.uncommon` | Uncommon | Ungewöhnlich |
| `equipment.quality.rare` | Rare | Selten |
| `equipment.quality.epic` | Epic | Episch |
| `equipment.quality.legendary` | Legendary | Legendär |
| `equipment.quality.artifact` | Artifact | Artefakt |
| `equipment.quality.heirloom` | Heirloom | Erbstück |

Die bestehenden Tabellen in den drei Dateien geben die tatsächlichen deutschen Namen vor —
von dort übernehmen, nicht neu erfinden.

### V2 — `translate` kennt keinen Plural

`ProfessionsPanel.tsx` hat dafür einen lokalen Helfer mit fest verdrahteten deutschen
Formen:

```ts
function plural(count: number, one: string, many: string): string
```

**Entscheid:** zwei Schlüssel je Fall, Endungen `.one` und `.other`, plus ein Helfer in
`src/lib/i18n.ts`:

```ts
export function translatePlural(
  language: Language,
  base: string,            // z. B. "professions.recipeCount"
  count: number,
  vars?: TranslateVars
): string
```
Er wählt `${base}.one` bei `count === 1`, sonst `${base}.other`, und gibt `count` als
Variable `{count}` mit. Dazu `tPlural` auf der gebundenen Funktion, damit Komponenten
`tPlural("professions.recipeCount", n)` schreiben können.

**Kein `Intl.PluralRules`.** Das ist genau die ICU-Abhängigkeit, wegen der `format.ts`
existiert — bei fehlenden Daten fällt es still auf englische Regeln zurück. Englisch und
Deutsch haben beide zwei Formen; eine dritte Sprache ist nicht geplant, und wenn sie
kommt, ist der Helfer die einzige Stelle, die sich ändert.

Der lokale Helfer in `ProfessionsPanel.tsx` fällt weg.

### V3 — `format.ts` und `money.ts` sind sprachblind, aber deutsch geformt

Der grösste Einzelposten. Fest verdrahtet ist derzeit:

| Stelle | Fest verdrahtet | Englisch muss sein |
| --- | --- | --- |
| `formatNumber` | Tausendertrennzeichen `’` (U+2019) | `,` |
| `formatDate` | `TT.MM.JJJJ` | `DD/MM/YYYY` (en-GB, passend zu `dateLocale`) |
| `formatDays` | `"1 Tag"` / `"6 Tagen"` | `1 day` / `6 days` |
| `formatMoney`, `formatGold` | Suffixe `g` / `s` / `k` (Kupfer) | `g` / `s` / `c` (copper) |

`formatDuration` (m:ss) ist sprachunabhängig und bleibt, wie er ist.

**Umfang:** 45 `formatNumber`-Aufrufe in 6 Dateien, 5 `formatDate`, 1 `formatDays`,
dazu die Geldfunktionen in `EconomyPanel`.

**Entschieden: gebundene Formatierer** — dasselbe Muster, das für die Texte mit
`useT()` / `getT()` schon steht. Eine Komponente bekommt zwei Dinge herein, `t` und `f`,
statt eine Sprache durch jeden einzelnen Aufruf zu schleifen.

```ts
// src/lib/format.ts
export interface Format {
  /** 12345 → 12’345 (de) / 12,345 (en) */
  number(value: number | null | undefined): string
  /** TT.MM.JJJJ (de) / DD/MM/YYYY (en) */
  date(timestamp: number | null | undefined): string
  /** m:ss – sprachunabhängig */
  duration(ms: number | null | undefined): string
  /** 1’234g 56s 78k (de) / 1,234g 56s 78c (en) */
  money(totalCopper: number | null | undefined): string
  /** nur die Goldstelle */
  gold(totalCopper: number | null | undefined): string
}

export function createFormat(language: Language): Format
```

Anbindung:

- **Client-Komponenten:** `I18nProvider` stellt neben `t` auch `f` bereit; neuer Haken
  `useFormat()` daneben, `f` im selben `useMemo` wie `t` gebaut.
- **Server-Komponenten:** `getFormat()` in `src/lib/t.ts` neben `getT()`, aus derselben
  `loadConfig()`-Antwort.
- `createFormat` gehört nach `src/lib/format.ts`, die Geldteile bleiben in
  `src/lib/money.ts` und werden von dort hereingenommen. Beide Dateien dürfen weiterhin
  **nichts serverseitiges** importieren — nur den Typ `Language` aus `config-cache`.

**Die alten freien Exporte werden entfernt** (`formatNumber`, `formatDate`, `formatMoney`,
`formatGold`, `formatDays`), damit `npx tsc --noEmit` jede der rund fünfzig Aufrufstellen
auflistet. Genau das ist der Zweck: kein stiller Rückfall, keine vergessene Stelle.
`formatDuration` bleibt zusätzlich als freie Funktion, weil sie keine Sprache braucht.

**Ausdrücklich verboten:** ein optionaler Sprachparameter mit Standardwert `"en"`, und
ein Lesen aus `configSnapshot()` innerhalb von `format.ts`. Im Browser-Bündel ist dieser
Zwischenspeicher leer — die Zahl wäre dann auf Deutsch englisch formatiert, und zwar
ohne jede Fehlermeldung. Das ist dieselbe Klasse von Fehler, gegen die `format.ts`
überhaupt geschrieben wurde.

**Die Münzsuffixe** (`g`/`s`/`k` gegen `g`/`s`/`c`) bleiben als Tabelle je Sprache in
`money.ts` und werden **kein** Wörterbucheintrag: sie sind Teil der Zahlenformatierung,
nicht Prosa, und so bleibt `money.ts` ohne Abhängigkeit zum Wörterbuch. Die Aufteilung in
getrennte Einheiten bleibt, wie sie ist — keine Dezimalzahl, führende Nulleinheiten
fallen weg, nachfolgende bleiben zweistellig. Und ein negativer Betrag bleibt negativ;
`0k` wäre eine andere Aussage.

**`formatDays` wird kein Formatierer**, sondern ein Pluralfall nach V2:
`core.days.one` = `{count} day` / `1 Tag`, `core.days.other` = `{count} days` /
`{count} Tagen`. Die Dativform „Tagen" ist beabsichtigt — der Satz lautet „in 6 Tagen".
`TrendChart` setzt damit `history.delta` zusammen.

### V4 — Schlüssel, die in zwei Bereiche fallen

- **„Diese Woche"** steht in `PvpPanel.tsx` und in `MythicPanel.tsx`. Im Wörterbuch
  `progress` gibt es bereits `progress.thisWeek`. Der Text gehört nicht zweimal
  hin: neuer Schlüssel `core.thisWeek`, `progress.thisWeek` entfällt, beide Komponenten
  ziehen aus `core`.
- **„Rezept" / „Rezepte"** kommt in `ProfessionsPanel` und `EconomyPanel` vor. Schlüssel
  nach `professions.` (dort ist der Begriff zu Hause), `economy` verwendet sie mit.
- **„Stufe"** ist zweierlei: Fertigkeitsstufe eines Berufs (`professions.tier`) und
  Gegenstandsstufe (`equipment.itemLevel`). Nicht zusammenlegen — im Englischen heisst
  das eine `tier`, das andere `item level`.
- **„Lade…" / „Lädt…"** gibt es in vier Komponenten in drei Schreibweisen. Ein Schlüssel
  `core.loading` für alle; die bereichsspezifischen Varianten („Lade Rezeptliste…",
  „Lade Gegenstandsdaten…") behalten eigene Schlüssel in ihrem Bereich.

---

## Teil 1 bis 7 — Die Bereiche

Ein Bereich je Durchgang, je ein Commit. Nach jedem Bereich `npx tsc --noEmit`.

**Für jeden Bereich gilt dasselbe Vorgehen:**

1. Die genannten Komponenten **vollständig lesen** und jeden sichtbaren Text sammeln —
   auch `title`, `alt`, `placeholder`, `aria-label`, Fehlermeldungen und Texte in
   Template-Strings. Die Tabellen unten sind eine per Suche erstellte Bestandsaufnahme
   und **nicht garantiert vollständig**; die Datei entscheidet, nicht die Tabelle.
2. Schlüssel in `src/lib/dict/<bereich>.ts` anlegen, `en` zuerst, thematisch gruppiert
   und mit kurzen Kommentaren, welche Komponente sie benutzt.
3. `de` vollständig — den bestehenden deutschen Wortlaut übernehmen.
4. Komponenten umstellen: `const t = await getT()` in Server-, `const t = useT()` in
   Client-Komponenten.
5. Die beiden `grep`-Aufrufe aus der Abnahme über die geänderten Dateien laufen lassen.

Schlüsselnamen: `bereich.kurzerName` in camelCase, sprechend statt durchnummeriert.
Zusammengesetzte Sätze werden **ein** Schlüssel mit Platzhaltern, nie zwei halbe.

### Teil 1 — `equipment`

Komponenten: `EquipmentPanel.tsx`, `ItemTooltip.tsx`, `CandidateTooltip.tsx`

Zuerst V1 erledigen, davon hängen alle drei ab.

| Schlüssel | en | de |
| --- | --- | --- |
| `equipment.none.title` | No gear | Keine Ausrüstung |
| `equipment.none.body` | The API returns no equipped items for this character. | Für diesen Charakter liefert die API keine angelegten Gegenstände. |
| `equipment.upgrades.title` | Upgrade options | Upgrade-Möglichkeiten |
| `equipment.upgrades.none` | Nothing outstanding found. | Keine offenen Punkte gefunden. |
| `equipment.upgrades.allSlots` | All slots | Alle Slots |
| `equipment.missingEnchant` | Enchant missing | Verzauberung fehlt |
| `equipment.weakestSlot` | Weakest slot | Schwächster Slot |
| `equipment.sockets` | {filled} of {total} | {filled} von {total} |
| `equipment.belowMedian` | Level {level} · {delta} below median | Stufe {level} · {delta} unter Median |
| `equipment.enlargeModel` | Enlarge model | Modell vergrössern |
| `equipment.itemLevel` | Item level | Gegenstandsstufe |
| `equipment.loadingItem` | Loading item data… | Lade Gegenstandsdaten… |
| `equipment.candidateLevel` | Level {level} | Stufe {level} |

Achtung bei `equipment.sockets`: im Code steht `${empty} von ${item.sockets?.length}` —
die Variablennamen in der Vorlage müssen zu dem passen, was übergeben wird, und bei
unbekannter Gesamtzahl gilt `—`, nicht `0`.

### Teil 2 — `loot`

Komponenten: `SlotCandidates.tsx`, `CandidateTooltip.tsx` (Rest), `LootIndexPanel.tsx`

| Schlüssel | en | de |
| --- | --- | --- |
| `loot.candidatesTitle` | Loot candidates per slot | Loot-Kandidaten je Slot |
| `loot.higher` | higher | höher |
| `loot.higherBy` | {delta} higher | {delta} höher |
| `loot.index.running` | Running | Läuft |
| `loot.index.runningEllipsis` | Running… | Läuft… |
| `loot.index.noInstances` | The Journal API returns no instances for this game mode. | Die Journal-API liefert für diesen Spielmodus keine Instanzen. |
| `loot.index.itemCount` | {count} items | {count} Gegenstände |

**„Best in Slot" in `SlotCandidates.tsx` prüfen, nicht übersetzen.** Laut Projektregel
gibt die App keine BiS-Aussage. Steht das Wort in einem sichtbaren Text, ist es ein
Verstoss gegen die Regel und gehört gemeldet, nicht hübsch übersetzt. Ist es ein
Variablen- oder Typname, bleibt es.

### Teil 3 — `professions`

Komponente: `ProfessionsPanel.tsx` — hier zuerst V2 erledigen.

| Schlüssel | en | de |
| --- | --- | --- |
| `professions.none` | The API returns no professions for this character. | Für diesen Charakter liefert die API keine Berufe. |
| `professions.noSkillData` | No skill data from the API. | Keine Fertigkeitsangaben von der API. |
| `professions.loadingRecipes` | Loading recipe list… | Lade Rezeptliste… |
| `professions.tier` | Tier | Stufe |
| `professions.tierCount.one` | {count} tier | {count} Stufe |
| `professions.tierCount.other` | {count} tiers | {count} Stufen |
| `professions.recipeCount.one` | {count} recipe | {count} Rezept |
| `professions.recipeCount.other` | {count} recipes | {count} Rezepte |
| `professions.recipesKnown` | {recipes} known | {recipes} bekannt |
| `professions.recipe` | Recipe | Rezept |

`professions.recipesKnown` bekommt das Ergebnis von `tPlural("professions.recipeCount", n)`
als Variable — so bleibt der Satz in beiden Sprachen richtig zusammengesetzt.

### Teil 4 — `pvp`

Komponente: `PvpPanel.tsx`

| Schlüssel | en | de |
| --- | --- | --- |
| `pvp.noHonorData` | The API returns no honor values for this character. | Die API liefert für diesen Charakter keine Ehre-Werte. |
| `pvp.honorableKills` | Honorable kills | Ehrenhafte Siege |
| `pvp.noData` | no data | keine Angabe |
| `pvp.neverEntered` | never entered | noch nicht betreten |
| `pvp.record` | {won} wins · {lost} losses | {won} Siege · {lost} Niederlagen |

„Diese Woche" hier nicht neu anlegen — `core.thisWeek` nach V4.

Die Regel „404 heisst nie gespielt" gilt weiter: Klassen ohne Wertung erscheinen gar
nicht. Wenn `pvp.neverEntered` an einer Stelle steht, wo nach dieser Regel nichts stehen
sollte, melden statt übersetzen.

### Teil 5 — `guild`

Komponente: `GuildRoster.tsx`

| Schlüssel | en | de |
| --- | --- | --- |
| `guild.noRoster` | The API returns no roster for this guild. | Die API liefert für diese Gilde keine Mitgliederliste. |
| `guild.itemLevelsFailed` | Item levels could not be loaded. | Gegenstandsstufen konnten nicht geladen werden. |
| `guild.itemLevelsNote` | The roster carries no item levels — those come from one profile request each | Die Mitgliederliste führt keine Gegenstandsstufen – die kommen aus je einem Profilabruf |
| `guild.searchPlaceholder` | Name, class, race or rank… | Name, Klasse, Volk oder Rang… |
| `guild.loading` | Loading… | Lädt… |
| `guild.notLoaded` | Not loaded yet | Noch nicht geladen |
| `guild.profileUnavailable` | Profile not available | Profil nicht abrufbar |
| `guild.entryCount` | {count} entries · by rank | {count} Einträge · nach Rang |
| `guild.shownOfTotal` | {shown} of {total} | {shown} von {total} |

### Teil 6 — `economy`

Komponente: `EconomyPanel.tsx` — der grösste Bereich, rund zwei Dutzend Texte.

| Schlüssel | en | de |
| --- | --- | --- |
| `economy.houseUnreachable.title` | Auction house not reachable | Auktionshaus nicht erreichbar |
| `economy.houseUnreachable.body` | The auction houses of this realm are not available. | Die Auktionshäuser dieses Realms sind nicht abrufbar. |
| `economy.loadingHouses` | Loading auction houses… | Auktionshäuser werden geladen… |
| `economy.noDataForMode` | No auction data for this mode | Keine Auktionsdaten für diesen Modus |
| `economy.pricesNotRead` | Prices not read. | Preise nicht eingelesen. |
| `economy.pricesNotReadError` | Prices not read: {message} | Preise nicht eingelesen: {message} |
| `economy.readHint` | Loads every listing of this house and condenses it into prices. This is the app's largest request. | Lädt alle Angebote dieses Hauses und verdichtet sie zu Preisen. Das ist die grösste Anfrage der App. |
| `economy.itemsWithPrice` | Items with a price | Gegenstände mit Preis |
| `economy.listingsRead` | Listings read | Angebote gelesen |
| `economy.noPrice` | yield no price | ergeben keinen Preis |
| `economy.soNoCostSum` | — so no cost total. | — darum keine Kostensumme. |
| `economy.craftedNotListed` | The result is not currently listed — no proceeds known. | Das Ergebnis wird gerade nicht angeboten — kein Erlös bekannt. |
| `economy.craftedNotListedNamed` | „{item}" is not currently listed — no proceeds known. | „{item}" wird gerade nicht angeboten — kein Erlös bekannt. |
| `economy.profession` | Profession | Beruf |
| `economy.cost` | Cost | Kosten |
| `economy.proceeds` | Proceeds | Erlös |
| `economy.profit` | Profit | Gewinn |
| `economy.allRecipesOfTier` | All recipes of this tier calculated. | Alle Rezepte dieser Stufe gerechnet. |
| `economy.recipesCalculated` | {computed} of {total} recipes calculated | {computed} von {total} Rezepten gerechnet |
| `economy.recipesWithoutDetails` | {count} recipes without details in the API — not calculated. | {count} Rezepte ohne Details in der API — nicht gerechnet. |
| `economy.noOfferFor` | No offer for: {items} | Kein Angebot für: {items} |
| `economy.andMore` | and {count} more | und {count} weitere |

Zwei Dinge dabei nicht verlieren:

- Die Aufzählung in `economy.noOfferFor` entsteht aus `slice(0, 3).join(", ")`. Das
  Trennzeichen `", "` ist in beiden Sprachen gleich und bleibt im Code; übersetzt wird
  nur der Rahmen.
- **Ein fehlender Reagenzpreis macht die Kostensumme unbekannt, nicht kleiner.** Die
  Texte `economy.noPrice` und `economy.soNoCostSum` tragen genau diese Aussage — ihr Sinn
  darf beim Übersetzen nicht verwässert werden („incomplete" statt „no cost total" wäre
  schon eine andere Aussage).

### Teil 7 — `history`

Komponente: `TrendChart.tsx`

| Schlüssel | en | de |
| --- | --- | --- |
| `history.noData` | No data recorded yet. | Noch keine Daten aufgezeichnet. |
| `history.value` | Value | Wert |
| `history.change` | Change | Änderung |
| `history.span` | {count} snapshots · {from} to {to} | {count} Stände · {from} bis {to} |
| `history.delta` | {change} in {days} | {change} in {days} |

`history.span` und `history.delta` brauchen die Formatierer aus V3 — Datum und Zahl
kommen dort schon formatiert hinein.

### Teil 8 — `MythicPanel` verdrahten

Kein neues Wörterbuch: die Schlüssel `progress.mythicPlus`, `progress.rating`,
`progress.noRunsThisWeek`, `progress.bestRunsSeason`, `progress.noRatedRuns`,
`progress.inTime`, `progress.overTime` liegen bereits in `src/lib/dict/progress.ts`.
`MythicPanel.tsx` benutzt sie nur nicht. Umstellen, „Diese Woche" auf `core.thisWeek`
(V4), und prüfen, ob `progress.thisWeek` danach noch irgendwo gebraucht wird — wenn
nicht, entfernen.

---

## Reihenfolge und Commits

```
1. Teil 0 – Vorentscheide         (V1, V2, V3, V4 – alle entschieden)
2. Teil 8 – MythicPanel           (klein, prüft die Mechanik)
3. Teil 1 – equipment
4. Teil 2 – loot
5. Teil 3 – professions
6. Teil 4 – pvp
7. Teil 5 – guild
8. Teil 7 – history
9. Teil 6 – economy               (grösster Bereich, zuletzt)
```

Teil 8 vor den grossen Bereichen, weil dort nur verdrahtet wird: geht das durch, stimmt
die Mechanik, und alles Weitere ist Fleissarbeit.

**V3 gehört komplett in den ersten Commit.** Er berührt rund fünfzig Aufrufstellen in
sechs Dateien und lässt den Bau bis zum Schluss rot — halb erledigt wäre er der
unangenehmste Zustand im ganzen Auftrag. Teil 6 und Teil 7 setzen ihn voraus, weil dort
Zahlen, Daten und Geld stecken; die übrigen Bereiche sind davon unabhängig.

Commit-Nachrichten deutsch, eine Zeile Titel, im Körper die Zahl der Schlüssel und die
geänderten Komponenten. Beispiel:

```
i18n: Bereich equipment übersetzt

13 Schlüssel in dict/equipment.ts. Qualitätsnamen aus EquipmentPanel,
ItemTooltip und CandidateTooltip zu einer Tabelle zusammengezogen
(qualityLabelKey in battlenet.ts) – lagen dreifach im Code.
```

## Wenn etwas nicht aufgeht

- **Ein Text lässt sich nicht als ein Schlüssel fassen**, weil er im Code aus Teilen
  gebaut wird: den Bau in der Komponente umstellen, sodass ein Satz ein Schlüssel ist.
  Das ist erlaubt und der Zweck der Übung.
- **Ein Text ist keine Oberfläche, sondern ein API-Wert** (Boss-, Gegenstands-,
  Fraktionsname): der kommt schon in der eingestellten Sprache von der API und bekommt
  keinen Schlüssel.
- **Ein Text verstösst beim Übersetzen gegen eine Projektregel** (BiS-Aussage, `0` statt
  `—`, Quote ohne Nenner): melden und liegen lassen, nicht mitübersetzen und nicht
  nebenbei reparieren.
- **Unklar, ob ein String sichtbar ist:** dann ist er sichtbar. Ein übersetzter
  Nicht-Text kostet nichts, ein vergessener deutscher Text kostet einen zweiten Durchgang.
