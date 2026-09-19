/**
 * Wörterbuch: Bereich `progress`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  // Schlachtzug-Fortschritt (ProgressPanel)
  "progress.bossesShow": "Bosses",
  "progress.bossesHide": "Hide bosses",
  "progress.modeProgress": "{difficulty}: {percent}%",

  // Mythic+ (MythicPanel)
  "progress.mythicPlus": "Mythic+",
  "progress.rating": "Rating",
  "progress.noRunsThisWeek": "No runs this week yet.",
  "progress.bestRunsSeason": "Best runs of the season",
  "progress.noRatedRuns": "No rated runs yet.",
  "progress.inTime": "In time",
  "progress.overTime": "Over time",

  // ─── Seite ────────────────────────────────────────────────────────────────
  "progress.intro":
    'Boss kills by difficulty. Expanding an expansion shows the instances, "Bosses" the individual kills with date.',
  "progress.raids": "Raids",
  "progress.dungeons": "Dungeons",
  "progress.raidEndpointFailed": "The raid endpoint did not answer.",
  "progress.noRaidProgress": "No raid progress for this character.",
  "progress.dungeonEndpointFailed": "The dungeon endpoint did not answer.",
  "progress.noDungeonProgress": "No dungeon progress for this character.",
} as const

export const de: Record<keyof typeof en, string> = {
  "progress.bossesShow": "Bosse",
  "progress.bossesHide": "Bosse ausblenden",
  "progress.modeProgress": "{difficulty}: {percent}%",

  "progress.mythicPlus": "Mythic+",
  "progress.rating": "Rating",
  "progress.noRunsThisWeek": "Noch keine Läufe in dieser Woche.",
  "progress.bestRunsSeason": "Beste Läufe der Saison",
  "progress.noRatedRuns": "Noch keine gewerteten Läufe.",
  "progress.inTime": "In der Zeit",
  "progress.overTime": "Über der Zeit",

  "progress.intro":
    "Bosskills je Schwierigkeit. Eine Erweiterung aufklappen zeigt die Instanzen, „Bosse\" die einzelnen Kills mit Datum.",
  "progress.raids": "Schlachtzüge",
  "progress.dungeons": "Dungeons",
  "progress.raidEndpointFailed": "Der Schlachtzug-Endpunkt hat nicht geantwortet.",
  "progress.noRaidProgress": "Keine Schlachtzug-Fortschritte für diesen Charakter.",
  "progress.dungeonEndpointFailed": "Der Dungeon-Endpunkt hat nicht geantwortet.",
  "progress.noDungeonProgress": "Keine Dungeon-Fortschritte für diesen Charakter.",
}
