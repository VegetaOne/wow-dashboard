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
}
