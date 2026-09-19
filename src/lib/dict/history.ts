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
}
