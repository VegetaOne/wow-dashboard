/**
 * Wörterbuch: Bereich `history`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  "history.noData": "No data recorded yet.",
  "history.onlyOnePoint":
    "Only one data point so far ({date}). A history starts from the second day.",
  "history.day": "Day",
  "history.value": "Value",
  "history.change": "Change",
  // Datum und Zahl kommen schon formatiert herein, aus f.date()/f.number()
  // bzw. tPlural("core.days", …) – siehe V3 in i18n-abschluss.md.
  "history.span": "{count} snapshots · {from} to {to}",
  "history.delta": "{change} in {days}",
  "history.hideTable": "Hide table",
  "history.showTable": "As table",
  "history.series.ilvl": "Item level equipped",
  "history.series.ilvlAvg": "Item level Ø incl. bags",
  "history.series.achPoints": "Achievement points",
  "history.series.achCount": "Achievements",
  "history.series.recipes": "Known recipes",
  "history.series.raidKills": "Boss kills in total",
  "history.unit.points": "Points",
  "history.unit.achievements": "Achievements",
  "history.unit.recipes": "Recipes",
  "history.range": "{label}: {min} to {max}",
  "history.heading": "History",
  "history.intro": "Development over time, from the snapshots stored each day. One chart per measure — two scales in one picture would be misleading.",
  "history.noHistory": "No history yet",
  "history.noHistoryText": "The history starts with the first fetch. Open the other tabs of this character — gear, professions, progress, achievements — and one snapshot per day is kept; from the second day on, lines appear here.",
  "history.onePointEach": "Only one snapshot per measure so far",
  "history.onePointEachText": "Recording is running. From the second day on, history lines appear here.",
  "history.noTrendYet": "No history yet",
  "history.onlyOneSnapshot": "{labels} — only one snapshot so far.",
} as const

export const de: Record<keyof typeof en, string> = {
  "history.noData": "Noch keine Daten aufgezeichnet.",
  "history.onlyOnePoint":
    "Bisher nur ein Stand ({date}). Ein Verlauf entsteht ab dem zweiten Tag.",
  "history.day": "Tag",
  "history.value": "Wert",
  "history.change": "Änderung",
  "history.span": "{count} Stände · {from} bis {to}",
  "history.delta": "{change} in {days}",
  "history.hideTable": "Tabelle ausblenden",
  "history.showTable": "Als Tabelle",
  "history.series.ilvl": "Gegenstandsstufe angelegt",
  "history.series.ilvlAvg": "Gegenstandsstufe Ø inkl. Tasche",
  "history.series.achPoints": "Erfolgspunkte",
  "history.series.achCount": "Erfolge",
  "history.series.recipes": "Bekannte Rezepte",
  "history.series.raidKills": "Bosskills insgesamt",
  "history.unit.points": "Punkte",
  "history.unit.achievements": "Erfolge",
  "history.unit.recipes": "Rezepte",
  "history.range": "{label}: {min} bis {max}",
  "history.heading": "Verlauf",
  "history.intro": "Entwicklung über Zeit, aus den täglich gespeicherten Ständen. Ein Diagramm je Messgrösse — zwei Maßstäbe in einem Bild wären irreführend.",
  "history.noHistory": "Noch keine Historie",
  "history.noHistoryText": "Der Verlauf beginnt mit dem ersten Abruf. Öffne die anderen Reiter dieses Charakters — Ausrüstung, Berufe, Fortschritt, Erfolge — dann wird je Tag ein Stand festgehalten, und ab dem zweiten Tag entstehen hier Linien.",
  "history.onePointEach": "Erst ein Stand je Messgrösse",
  "history.onePointEachText": "Die Aufzeichnung läuft. Ab dem zweiten Tag erscheinen hier Verlaufslinien.",
  "history.noTrendYet": "Noch ohne Verlauf",
  "history.onlyOneSnapshot": "{labels} — bisher nur ein Stand.",
}
