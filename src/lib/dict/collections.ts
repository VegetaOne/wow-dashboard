/**
 * Wörterbuch: Bereich `collections`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 *
 * Namen von Reittieren, Begleitern, Spielzeugen und Titeln stehen hier
 * bewusst nicht: die kommen aus der Blizzard-API und sind dort bereits in
 * der eingestellten Sprache.
 */

export const en = {
  "collections.collectedOf": "{collected} / {total} ({pct}%)",
  "collections.collectedCount": "{collected} collected",
  "collections.noTotals":
    "The reference data for this collection is not available — so there is no telling what is still missing.",
  "collections.tabCollected": "Collected ({count})",
  "collections.tabMissing": "Missing ({count})",
  "collections.searchPlaceholder": "Search…",
  "collections.entryCount": "{count} entries",
  "collections.countOfTotal": "{count} of {total}",
  "collections.noMatch": "No match.",
  "collections.empty": "Nothing here.",
  "collections.showMore": "Show {count} more",
  "collections.notUsable": "not usable",

  "collections.titles": "Titles",
  "collections.titlesUnlocked": "{count} unlocked",
  "collections.titleActive": "Currently worn",
  "collections.titlesEmpty": "No titles unlocked yet.",
  "collections.titleSearchPlaceholder": "Search titles…",
  "collections.titleCount": "{count} titles",
} as const

export const de: Record<keyof typeof en, string> = {
  "collections.collectedOf": "{collected} / {total} ({pct}%)",
  "collections.collectedCount": "{collected} gesammelt",
  "collections.noTotals":
    "Die Stammdaten für diese Sammlung sind nicht abrufbar — es lässt sich deshalb nicht sagen, was noch fehlt.",
  "collections.tabCollected": "Gesammelt ({count})",
  "collections.tabMissing": "Fehlt ({count})",
  "collections.searchPlaceholder": "Suchen…",
  "collections.entryCount": "{count} Einträge",
  "collections.countOfTotal": "{count} von {total}",
  "collections.noMatch": "Kein Treffer.",
  "collections.empty": "Nichts vorhanden.",
  "collections.showMore": "Weitere {count} anzeigen",
  "collections.notUsable": "nicht nutzbar",

  "collections.titles": "Titel",
  "collections.titlesUnlocked": "{count} freigeschaltet",
  "collections.titleActive": "Aktiv getragen",
  "collections.titlesEmpty": "Noch keine Titel freigeschaltet.",
  "collections.titleSearchPlaceholder": "Titel suchen…",
  "collections.titleCount": "{count} Titel",
}
