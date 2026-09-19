/**
 * Wörterbuch: Bereich `guild`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  "guild.noRoster": "The API returns no roster for this guild.",
  "guild.members": "Members",
  "guild.entryCount": "{count} entries · by rank",
  "guild.searchPlaceholder": "Name, class, race or rank…",
  "guild.itemLevelsNote":
    "The roster carries no item levels — those come from one profile request each",
  "guild.loadItemLevels": "Load item levels ({count})",
  "guild.itemLevelsFailed": "Item levels could not be loaded.",
  "guild.shownOfTotal": "{shown} of {total}",
  "guild.matchCount": "{count} matches",
  "guild.noMatch": "No match.",
  "guild.notLoaded": "Not loaded yet",
  "guild.profileUnavailable": "Profile not available",
  "guild.itemLevelEquipped": "Item level equipped",
  "guild.showMore": "Show {count} more",
} as const

export const de: Record<keyof typeof en, string> = {
  "guild.noRoster": "Die API liefert für diese Gilde keine Mitgliederliste.",
  "guild.members": "Mitglieder",
  "guild.entryCount": "{count} Einträge · nach Rang",
  "guild.searchPlaceholder": "Name, Klasse, Volk oder Rang…",
  "guild.itemLevelsNote":
    "Die Mitgliederliste führt keine Gegenstandsstufen – die kommen aus je einem Profilabruf",
  "guild.loadItemLevels": "Gegenstandsstufen laden ({count})",
  "guild.itemLevelsFailed": "Gegenstandsstufen konnten nicht geladen werden.",
  "guild.shownOfTotal": "{shown} von {total}",
  "guild.matchCount": "{count} Treffer",
  "guild.noMatch": "Kein Treffer.",
  "guild.notLoaded": "Noch nicht geladen",
  "guild.profileUnavailable": "Profil nicht abrufbar",
  "guild.itemLevelEquipped": "Gegenstandsstufe angelegt",
  "guild.showMore": "Weitere {count} anzeigen",
}
