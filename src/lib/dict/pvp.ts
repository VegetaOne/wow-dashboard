/**
 * Wörterbuch: Bereich `pvp`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  // ─── Ehre ─────────────────────────────────────────────────────────────────
  "pvp.noHonorData": "The API returns no honor values for this character.",
  "pvp.honorLevel": "Honor level",
  "pvp.honorableKills": "Honorable kills",

  // ─── Wertungen ────────────────────────────────────────────────────────────
  "pvp.ratedClasses": "Rated classes",
  "pvp.noRatedClasses":
    'No rated class played. The API answers 404 for unplayed classes — that is not an error, it means "never entered".',
  "pvp.rating": "Rating",
  "pvp.season": "Season",
  // core.thisWeek wird hier mitverwendet statt eines eigenen Schlüssels (V4).
  "pvp.noData": "no data",
  "pvp.record": "{won} wins · {lost} losses",
  "pvp.gamesPlayed": "{count} games",
  "pvp.neverEntered": "never entered",

  // ─── Schlachtfelder ───────────────────────────────────────────────────────
  "pvp.battlegrounds": "Battlegrounds",
  "pvp.noMapStats": "No battleground statistics available.",
  "pvp.byBattleground": "By battleground",
  "pvp.mapCount": "{count} battlegrounds · most played first",
  "pvp.showMoreMaps": "Show {count} more",

  // ─── Seite ────────────────────────────────────────────────────────────────
  "pvp.intro":
    "Honor, rated classes and battleground statistics. Values only update once the character logs out.",
  "pvp.unavailable": "PvP not available",
  "pvp.unavailableText":
    "The PvP endpoints did not answer, and no earlier state is on file. Classic does not carry this data consistently.",
} as const

export const de: Record<keyof typeof en, string> = {
  "pvp.noHonorData": "Die API liefert für diesen Charakter keine Ehre-Werte.",
  "pvp.honorLevel": "Ehrestufe",
  "pvp.honorableKills": "Ehrenhafte Siege",

  "pvp.ratedClasses": "Gewertete Klassen",
  "pvp.noRatedClasses":
    "Keine gewertete Klasse gespielt. Die API antwortet für ungespielte Klassen mit 404 — das ist kein Fehler, sondern heisst „nie angetreten\".",
  "pvp.rating": "Wertung",
  "pvp.season": "Saison",
  "pvp.noData": "keine Angabe",
  "pvp.record": "{won} Siege · {lost} Niederlagen",
  "pvp.gamesPlayed": "{count} Spiele",
  "pvp.neverEntered": "noch nicht betreten",

  "pvp.battlegrounds": "Schlachtfelder",
  "pvp.noMapStats": "Keine Schlachtfeld-Statistik vorhanden.",
  "pvp.byBattleground": "Nach Schlachtfeld",
  "pvp.mapCount": "{count} Schlachtfelder · meistgespielte zuerst",
  "pvp.showMoreMaps": "Weitere {count} anzeigen",

  "pvp.intro":
    "Ehre, gewertete Klassen und die Statistik je Schlachtfeld. Die Werte aktualisieren sich erst, wenn der Charakter sich ausloggt.",
  "pvp.unavailable": "PvP nicht abrufbar",
  "pvp.unavailableText":
    "Die PvP-Endpunkte haben nicht geantwortet, und es liegt kein früherer Stand vor. In Classic führt die API diese Daten nicht durchgängig.",
}
