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
}
