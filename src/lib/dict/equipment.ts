/**
 * Wörterbuch: Bereich `equipment`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  // ─── Qualitätsnamen (V1 aus i18n-abschluss.md) ───────────────────────────
  // lagen dreifach in EquipmentPanel, ItemTooltip, CandidateTooltip
  "equipment.quality.poor": "Poor",
  "equipment.quality.common": "Common",
  "equipment.quality.uncommon": "Uncommon",
  "equipment.quality.rare": "Rare",
  "equipment.quality.epic": "Epic",
  "equipment.quality.legendary": "Legendary",
  "equipment.quality.artifact": "Artifact",
  "equipment.quality.heirloom": "Heirloom",

  // ─── EquipmentPanel ───────────────────────────────────────────────────────
  "equipment.none.title": "No gear",
  "equipment.none.body":
    "The API returns no equipped items for this character.",
  "equipment.upgrades.title": "Upgrade options",
  "equipment.upgrades.none": "Nothing outstanding found.",
  "equipment.upgrades.openCount": "{count} open",
  "equipment.upgrades.allSlots": "All slots",
  "equipment.characterWindow": "Character window",
  "equipment.characterModelAlt": "Character model",
  "equipment.enlargeModel": "Enlarge model",
  "equipment.shrinkModel": "Shrink model",
  "equipment.empty": "Empty",
  "equipment.missingEnchant": "Enchant missing",
  "equipment.weakestSlot": "Weakest slot",
  "equipment.emptySocket": "Empty socket",
  // Wortlaut der Upgrade-Liste weicht bewusst vom Slot-Badge oben ab –
  // beide Formulierungen standen schon vorher so im Code.
  "equipment.emptySocketUpgrade": "Socket empty",
  "equipment.socketFilled": "Socket filled",
  "equipment.enchanted": "Enchanted",
  "equipment.sockets": "{filled} of {total}",
  "equipment.belowMedian": "Level {level} · {delta} below median",
  "equipment.itemLevel": "Item level",

  // ─── ItemTooltip ──────────────────────────────────────────────────────────
  "equipment.unknownItem": "Unknown item",
  "equipment.itemLevelValue": "Item level {level}",

  // ─── API-Route ────────────────────────────────────────────────────────────
  "equipment.loadFailed": "Equipment could not be loaded",
  "equipment.noData": "No equipment data",
  "equipment.loadFailedText": "The equipment could not be loaded, and no earlier state is on file.",
  "equipment.itemDataLoadFailed": "Item data could not be loaded",
  "equipment.slot.head": "Head",
  "equipment.slot.neck": "Neck",
  "equipment.slot.shoulder": "Shoulders",
  "equipment.slot.back": "Back",
  "equipment.slot.chest": "Chest",
  "equipment.slot.wrist": "Wrists",
  "equipment.slot.hands": "Hands",
  "equipment.slot.waist": "Waist",
  "equipment.slot.legs": "Legs",
  "equipment.slot.feet": "Feet",
  "equipment.slot.finger1": "Ring 1",
  "equipment.slot.finger2": "Ring 2",
  "equipment.slot.trinket1": "Trinket 1",
  "equipment.slot.trinket2": "Trinket 2",
  "equipment.slot.mainHand": "Main hand",
  "equipment.slot.offHand": "Off hand",
} as const

export const de: Record<keyof typeof en, string> = {
  "equipment.quality.poor": "Schlecht",
  "equipment.quality.common": "Gewöhnlich",
  "equipment.quality.uncommon": "Ungewöhnlich",
  "equipment.quality.rare": "Selten",
  "equipment.quality.epic": "Episch",
  "equipment.quality.legendary": "Legendär",
  "equipment.quality.artifact": "Artefakt",
  "equipment.quality.heirloom": "Erbstück",

  "equipment.none.title": "Keine Ausrüstung",
  "equipment.none.body":
    "Für diesen Charakter liefert die API keine angelegten Gegenstände.",
  "equipment.upgrades.title": "Upgrade-Möglichkeiten",
  "equipment.upgrades.none": "Keine offenen Punkte gefunden.",
  "equipment.upgrades.openCount": "{count} offen",
  "equipment.upgrades.allSlots": "Alle Slots",
  "equipment.characterWindow": "Charakterfenster",
  "equipment.characterModelAlt": "Charaktermodell",
  "equipment.enlargeModel": "Modell vergrössern",
  "equipment.shrinkModel": "Modell verkleinern",
  "equipment.empty": "Leer",
  "equipment.missingEnchant": "Verzauberung fehlt",
  "equipment.weakestSlot": "Schwächster Slot",
  "equipment.emptySocket": "Leere Fassung",
  "equipment.emptySocketUpgrade": "Fassung leer",
  "equipment.socketFilled": "Fassung belegt",
  "equipment.enchanted": "Verzaubert",
  "equipment.sockets": "{filled} von {total}",
  "equipment.belowMedian": "Stufe {level} · {delta} unter Median",
  "equipment.itemLevel": "Gegenstandsstufe",

  "equipment.unknownItem": "Unbekannter Gegenstand",
  "equipment.itemLevelValue": "Gegenstandsstufe {level}",


  "equipment.loadFailed": "Ausrüstung konnte nicht geladen werden",
  "equipment.noData": "Keine Ausrüstungsdaten",
  "equipment.loadFailedText": "Die Ausrüstung konnte nicht geladen werden, und es liegt kein früherer Stand vor.",
  "equipment.itemDataLoadFailed": "Gegenstandsdaten konnten nicht geladen werden",
  "equipment.slot.head": "Kopf",
  "equipment.slot.neck": "Hals",
  "equipment.slot.shoulder": "Schultern",
  "equipment.slot.back": "Umhang",
  "equipment.slot.chest": "Brust",
  "equipment.slot.wrist": "Handgelenke",
  "equipment.slot.hands": "Hände",
  "equipment.slot.waist": "Taille",
  "equipment.slot.legs": "Beine",
  "equipment.slot.feet": "Füße",
  "equipment.slot.finger1": "Ring 1",
  "equipment.slot.finger2": "Ring 2",
  "equipment.slot.trinket1": "Schmuckstück 1",
  "equipment.slot.trinket2": "Schmuckstück 2",
  "equipment.slot.mainHand": "Haupthand",
  "equipment.slot.offHand": "Nebenhand",
}
