/**
 * Wörterbuch: Bereich `professions`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  "professions.eyebrow": "Professions",
  "professions.none": "The API returns no professions for this character.",
  "professions.noSkillData": "No skill data from the API.",
  "professions.loadingRecipes": "Loading recipe list…",

  // "Stufe" ist hier die Fertigkeitsstufe eines Berufs – bewusst getrennt
  // von equipment.itemLevel, das im Englischen "item level" heisst, nicht
  // "tier" (V4 aus i18n-abschluss.md).
  "professions.tier": "Tier",
  "professions.tierCount.one": "{count} tier",
  "professions.tierCount.other": "{count} tiers",
  "professions.recipeCount.one": "{count} recipe",
  "professions.recipeCount.other": "{count} recipes",
  "professions.recipesKnown": "{recipes} known",
  // Zu Hause hier, wird von economy mitverwendet (V4).
  "professions.recipe": "Recipe",
  "professions.noRecipes": "No recipes",

  // Kategorie-Überschriften (Haupt-/Nebenberuf), Pluralform je nach Anzahl
  "professions.primaryHeading.one": "Primary profession",
  "professions.primaryHeading.other": "Primary professions",
  "professions.secondaryHeading.one": "Secondary profession",
  "professions.secondaryHeading.other": "Secondary professions",

  "professions.noFullRecipeList":
    "The API does not return a complete recipe list for this tier — so there is no way to say what's still missing. Known recipes:",
  "professions.recipeProgress": "Recipe progress",
  "professions.known": "known",
  "professions.missing": "missing",
} as const

export const de: Record<keyof typeof en, string> = {
  "professions.eyebrow": "Berufe",
  "professions.none": "Für diesen Charakter liefert die API keine Berufe.",
  "professions.noSkillData": "Keine Fertigkeitsangaben von der API.",
  "professions.loadingRecipes": "Lade Rezeptliste…",

  "professions.tier": "Stufe",
  "professions.tierCount.one": "{count} Stufe",
  "professions.tierCount.other": "{count} Stufen",
  "professions.recipeCount.one": "{count} Rezept",
  "professions.recipeCount.other": "{count} Rezepte",
  "professions.recipesKnown": "{recipes} bekannt",
  "professions.recipe": "Rezept",
  "professions.noRecipes": "Keine Rezepte",

  "professions.primaryHeading.one": "Hauptberuf",
  "professions.primaryHeading.other": "Hauptberufe",
  "professions.secondaryHeading.one": "Nebenberuf",
  "professions.secondaryHeading.other": "Nebenberufe",

  "professions.noFullRecipeList":
    "Für diese Stufe liefert die API keine vollständige Rezeptliste — es lässt sich also nicht sagen, was noch fehlt. Bekannte Rezepte:",
  "professions.recipeProgress": "Rezeptfortschritt",
  "professions.known": "bekannt",
  "professions.missing": "fehlt",
}
