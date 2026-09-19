# WoW Dashboard – Wochenübersicht

> Stand: 2026-09-16 · gebaut, noch nicht im laufenden Betrieb geprüft

## Was entschieden wurde

| Thema | Entscheid |
| --- | --- |
| **Ort** | Eigene Account-Seite unter `/dashboard/[mode]/woche`, kein Charakter-Tab. Die Frage „was steht noch an" stellt sich für den ganzen Kader. |
| **Statusquelle** | `last_kill_timestamp` aus dem Schlachtzug-Endpunkt, nicht Snapshot-Diffs. |
| **Lockout-Tabelle** | Vollständig für Classic Era angelegt, Handpflege im Repo. |
| **Modi** | Classic und Classic Era gemeinsam; Retail läuft über denselben Weg mit. |

## Der Fund, der die Umsetzung verändert hat

Ursprünglich war geplant, den Status aus dem Vergleich zweier Tages-Snapshots
abzuleiten. Das ist nicht nötig: der Endpunkt `encounters/raids` liefert je Boss
ein `last_kill_timestamp`, und `lib/progress.ts` wertet es bereits als
`lastKillAt` aus. Liegt der Zeitstempel im laufenden Lockout-Zeitraum, war der
Kill in diesem Zeitraum — exakt, und ohne die Unschärfe, die ein Tagesvergleich
bei mehreren Kills am selben Tag hätte.

Die verbleibende Einschränkung steht auf der Seite selbst: die Profil-API
aktualisiert erst beim Ausloggen. Wer noch in der Instanz steht, fehlt.

## Classic ist nicht wöchentlich

Ein Tracker, der stur „Mittwoch 04:00" rechnet, wäre für Classic Era falsch.
Die Lockout-Längen stehen in `src/lib/lockouts.ts`:

| Instanz | Länge |
| --- | --- |
| Geschmolzener Kern, Pechschwingenhort, Tempel von Ahn'Qiraj, Naxxramas | 7 Tage |
| Onyxias Hort | 5 Tage |
| Zul'Gurub, Ruinen von Ahn'Qiraj | 3 Tage |

Erkannt wird über den **Namen**, deutsch und englisch nebeneinander — die
Journal-IDs unterscheiden sich zwischen den Namespaces, und der spätere
Sprachumschalter kostet hier dann nichts mehr.

Kürzere Lockouts gehen nicht glatt in sieben Tage auf. Sie hängen am
Wochenreset und beginnen dort neu; der letzte Abschnitt einer Woche ist darum
kürzer als die Nennlänge. Die Rechnung bildet das ab und die Oberfläche
schreibt „verkürzt" daran, statt eine falsche Restzeit anzuzeigen.

Für Retail und das laufende Classic (derzeit Mists of Pandaria) sind sieben
Tage kein geratener Wert, sondern die Regel — dort gibt es keine Tabelle und
auch keinen Hinweis. Eine Instanz in Classic Era, die nicht in der Tabelle
steht, wird dagegen sichtbar als „Lockout angenommen" markiert.

## Offen

- **EU-Tagesreset:** zwei Quellen widersprechen sich (04:00 UTC gegen 07:00
  UTC). Eingetragen ist 04:00, im Code als unsicher markiert, und die Seite
  schreibt „Zeit unbelegt" dazu. Sobald es aus dem Spiel bestätigt ist, kann
  die Markierung raus.
- **Onyxia:** fünf Tage wie im Original. Falls deine Version schon auf eine
  Woche umgestellt hat, gehört in `lockouts.ts` eine 7 hin.
- **Sommerzeit:** gerechnet wird in UTC, das Spiel resettet nach Serverzeit.
  Um die Zeitumstellung herum kann das eine Stunde abweichen. Überschreibbar
  mit `WOW_RESET_WEEKDAY`, `WOW_RESET_HOUR_UTC`, `WOW_DAILY_RESET_HOUR_UTC`.
- **Wöchentliche Quests und Belohnungen** sind noch nicht dabei — die
  Übersicht deckt vorerst Schlachtzug-Lockouts ab.

## Dateien

| Datei | Zweck |
| --- | --- |
| `src/lib/reset.ts` | Resetzeiten je Region, Lockout-Zeitfenster, Restzeit-Formatierung |
| `src/lib/lockouts.ts` | Lockout-Längen je Instanz, Namensabgleich DE/EN |
| `src/lib/weekly.ts` | Baut die Übersicht: je Charakter Schlachtzüge holen, Kills im Zeitraum zählen |
| `src/components/WeeklyOverview.tsx` | Tabelle je Charakter |
| `src/components/ResetCountdown.tsx` | Laufende Restzeit (Client, Minutentakt) |
| `src/components/WeeklyLink.tsx` | Verweis von der Kaderliste, kennt den gewählten Modus |
| `src/app/dashboard/[mode]/woche/page.tsx` | Die Seite |
| `src/components/DashboardShell.tsx` | geändert: Knopf „Wochenübersicht" |

Welche Instanzen erscheinen: alles aus der gepflegten Tabelle, alles aus der
neuesten Erweiterung, und jede Instanz mit einem Kill im laufenden Zeitraum.
Den ganzen Fortschritt aller Erweiterungen zu zeigen wäre unlesbar.

## Geprüft

Die Reset-Arithmetik ist mit 26 Fällen gegengerechnet (Wochenreset an
Grenztagen, 3- und 5-Tage-Fenster samt verkürztem Restabschnitt, US-Region,
Tagesreset, Restzeit-Formatierung) — alle grün. Der Namensabgleich der
Lockout-Tabelle ebenfalls, inklusive typografischem Apostroph. `next build`
kompiliert und typprüft sauber durch; der Build bricht danach nur ab, weil in
der Testumgebung der Prisma-Client nicht erzeugt werden konnte.

**Nicht geprüft:** die Seite mit echten Daten. Das geht nur bei dir mit
gültigen Battle.net-Zugangsdaten.
