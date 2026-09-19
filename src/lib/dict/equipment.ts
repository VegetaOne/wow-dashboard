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

  // ─── CandidateTooltip (equipment-Teil, Rest folgt unter loot) ────────────
  "equipment.loadingItem": "Loading item data…",
  "equipment.candidateLevel": "Level {level}",

  // ─── API-Route ────────────────────────────────────────────────────────────
  "equipment.loadFailed": "Equipment could not be loaded",
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

  "equipment.loadingItem": "Lade Gegenstandsdaten…",
  "equipment.candidateLevel": "Stufe {level}",

  "equipment.loadFailed": "Ausrüstung konnte nicht geladen werden",
}
