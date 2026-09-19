/**
 * Wörterbuch: Bereich `loot`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  // ─── SlotCandidates ───────────────────────────────────────────────────────
  "loot.candidatesEyebrow": "Loot candidates",
  "loot.noIndexYet":
    "No loot index for this game mode yet. Build it in the panel above, then the items per slot with their source appear here.",
  "loot.noMatchingItems":
    "The index contains no items that fit this character's slots.",
  "loot.candidatesTitle": "Loot candidates per slot",
  "loot.candidatesHint":
    "What drops for the slot at all, highest item level first.",
  "loot.classicLevelCaveat":
    "In Classic, level is a weak signal — a lot of strong gear there has a low level with the right stats.",
  "loot.noDpsRating": "No DPS rating: that needs stat weights.",
  "loot.noItemEquipped": "No item equipped",
  "loot.knownCount": "{count} known",
  "loot.higher": "higher",
  "loot.higherBy": "{delta} higher",

  // ─── CandidateTooltip (Rest, Quality/Stufe liegen unter equipment) ───────
  "loot.source": "Source",
  "loot.currentlyEquipped": "Currently equipped",

  // ─── LootIndexPanel ───────────────────────────────────────────────────────
  "loot.index.title": "Loot index",
  "loot.index.hint":
    "The loot tables come from the Journal API. A run fetches all instances, bosses and item data and stores them locally — that costs a few minutes, after that the queries are instant.",
  "loot.index.pending": "Not indexed",
  "loot.index.running": "Running",
  "loot.index.runningEllipsis": "Running…",
  "loot.index.done": "Done",
  "loot.index.failed": "Failed",
  "loot.index.empty": "No data",
  "loot.index.noInstances": "The Journal API returns no instances for this game mode.",
  "loot.index.itemCount": "{count} items",
  "loot.index.instancesProgress": "{indexed} of {total} instances",
  "loot.index.resume": "Resume ({count} open)",
  "loot.index.rebuild": "Rebuild",
  "loot.index.build": "Build index",
  "loot.index.cancel": "Cancel",
} as const

export const de: Record<keyof typeof en, string> = {
  "loot.candidatesEyebrow": "Loot-Kandidaten",
  "loot.noIndexYet":
    "Noch kein Loot-Index für diesen Spielmodus. Im Panel darüber aufbauen, dann erscheinen hier die Gegenstände je Slot mit ihrer Quelle.",
  "loot.noMatchingItems":
    "Der Index enthält keine Gegenstände, die auf die Slots dieses Charakters passen.",
  "loot.candidatesTitle": "Loot-Kandidaten je Slot",
  "loot.candidatesHint":
    "Was für den Slot überhaupt droppt, höchste Gegenstandsstufe zuerst.",
  "loot.classicLevelCaveat":
    "In Classic ist die Stufe ein schwaches Signal — viel starkes Gear hat dort niedrige Stufe mit den passenden Werten.",
  "loot.noDpsRating": "Keine DPS-Bewertung: dafür fehlen Statgewichte.",
  "loot.noItemEquipped": "Kein Gegenstand angelegt",
  "loot.knownCount": "{count} bekannt",
  "loot.higher": "höher",
  "loot.higherBy": "{delta} höher",

  "loot.source": "Quelle",
  "loot.currentlyEquipped": "Aktuell angelegt",

  "loot.index.title": "Loot-Index",
  "loot.index.hint":
    "Die Loot-Tabellen kommen aus der Journal-API. Ein Durchlauf holt alle Instanzen, Bosse und Gegenstandsdaten und legt sie lokal ab — das kostet einige Minuten, danach sind die Abfragen sofort da.",
  "loot.index.pending": "Nicht indexiert",
  "loot.index.running": "Läuft",
  "loot.index.runningEllipsis": "Läuft…",
  "loot.index.done": "Fertig",
  "loot.index.failed": "Fehlgeschlagen",
  "loot.index.empty": "Keine Daten",
  "loot.index.noInstances": "Die Journal-API liefert für diesen Spielmodus keine Instanzen.",
  "loot.index.itemCount": "{count} Gegenstände",
  "loot.index.instancesProgress": "{indexed} von {total} Instanzen",
  "loot.index.resume": "Fortsetzen ({count} offen)",
  "loot.index.rebuild": "Neu aufbauen",
  "loot.index.build": "Index aufbauen",
  "loot.index.cancel": "Abbrechen",
}
