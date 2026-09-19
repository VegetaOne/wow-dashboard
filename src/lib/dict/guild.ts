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

  // ─── API-Route (character-details) ───────────────────────────────────────
  "guild.detailsLoadFailed": "Details could not be loaded",

  // ─── Seite ────────────────────────────────────────────────────────────────
  "guild.intro":
    "Members, guild achievements and the latest events. The member list comes from a single request; item levels cost one profile request per member and are therefore fetched only on demand.",
  "guild.membershipUnknown": "Guild membership unknown",
  "guild.profileEndpointFailedText":
    "The character profile did not answer, and no earlier state is on file.",
  "guild.notInGuild": "This character is not in a guild.",
  "guild.listShows": "List shows {count}",
  "guild.achievementsCount": "{count} achievements",
  "guild.founded": "Founded",
  "guild.rosterUnavailable": "Member list not available",
  "guild.rosterEndpointFailedText":
    "The roster endpoint did not answer, and no earlier state is on file.",
  "guild.recentEvents": "Latest events",
  "guild.recentAchievements": "Recently earned guild achievements",
  "guild.achievementsEndpointFailed": "The guild achievements endpoint did not answer.",
  "guild.noAchievementsWithDate": "No guild achievements with a date available.",
  "guild.activityEndpointFailedText":
    "The activity endpoint did not answer. Classic modes do not carry it consistently.",
  "guild.noEvents": "No events available.",
  "guild.achievementKind": "Achievement",
  "guild.bossKillKind": "Boss kill",
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

  "guild.detailsLoadFailed": "Details konnten nicht geladen werden",

  "guild.intro":
    "Mitglieder, Gildenerfolge und die letzten Ereignisse. Die Mitgliederliste kommt aus einem Abruf; Gegenstandsstufen kosten einen Profilabruf je Mitglied und werden darum nur auf Knopfdruck geholt.",
  "guild.membershipUnknown": "Gildenzugehörigkeit unbekannt",
  "guild.profileEndpointFailedText":
    "Das Charakterprofil hat nicht geantwortet, und es liegt kein früherer Stand vor.",
  "guild.notInGuild": "Dieser Charakter ist in keiner Gilde.",
  "guild.listShows": "Liste führt {count}",
  "guild.achievementsCount": "{count} Erfolge",
  "guild.founded": "Gegründet",
  "guild.rosterUnavailable": "Mitgliederliste nicht abrufbar",
  "guild.rosterEndpointFailedText":
    "Der Roster-Endpunkt hat nicht geantwortet, und es liegt kein früherer Stand vor.",
  "guild.recentEvents": "Letzte Ereignisse",
  "guild.recentAchievements": "Zuletzt erreichte Gildenerfolge",
  "guild.achievementsEndpointFailed": "Der Endpunkt für Gildenerfolge hat nicht geantwortet.",
  "guild.noAchievementsWithDate": "Keine Gildenerfolge mit Datum vorhanden.",
  "guild.activityEndpointFailedText":
    "Der Aktivitäts-Endpunkt hat nicht geantwortet. In den Classic-Modi führt die API ihn nicht durchgängig.",
  "guild.noEvents": "Keine Ereignisse vorhanden.",
  "guild.achievementKind": "Erfolg",
  "guild.bossKillKind": "Bosskill",
}
