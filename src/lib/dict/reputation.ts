/**
 * Wörterbuch: Bereich `reputation`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 *
 * Fraktions- und Rangnamen liefert die Blizzard-API in der eingestellten
 * Sprache und stehen deshalb nicht hier.
 */

export const en = {
  "reputation.none": "The API provides no reputation for this character.",
  "reputation.factions": "Factions",
  "reputation.factionCount": "{count} factions",
  "reputation.factionCountParagon": "{count} factions · {paragon} with Paragon",
  "reputation.searchPlaceholder": "Search faction or standing…",
  "reputation.entryCount": "{count} entries",
  "reputation.countOfTotal": "{count} of {total}",
  "reputation.noMatch": "No match.",
  "reputation.showMore": "Show {count} more",
  "reputation.valueOfMax": "{value} / {max}",
  "reputation.paragon": "Paragon",
} as const

export const de: Record<keyof typeof en, string> = {
  "reputation.none": "Für diesen Charakter liefert die API kein Ansehen.",
  "reputation.factions": "Fraktionen",
  "reputation.factionCount": "{count} Fraktionen",
  "reputation.factionCountParagon": "{count} Fraktionen · {paragon} mit Paragon",
  "reputation.searchPlaceholder": "Fraktion oder Stufe suchen…",
  "reputation.entryCount": "{count} Einträge",
  "reputation.countOfTotal": "{count} von {total}",
  "reputation.noMatch": "Kein Treffer.",
  "reputation.showMore": "Weitere {count} anzeigen",
  "reputation.valueOfMax": "{value} / {max}",
  "reputation.paragon": "Paragon",
}
