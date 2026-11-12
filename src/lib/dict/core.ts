/**
 * Wörterbuch: Schale, Navigation, Charakterliste und Wochenübersicht.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  "app.title": "WoW Dashboard",
  "app.description": "World of Warcraft account overview",
  "app.brand": "WARBAND LEDGER",
  "app.tagline": "Warband archive",

  "header.firstFetch": "First fetch running…",
  "header.updated": "Updated {seconds} sec ago",
  "header.pollEvery": "Fetch every {seconds} sec.",
  "header.charactersFound": "{count} characters found",
  "header.collections": "Collections",
  "header.settings": "Settings",
  "header.signOut": "Sign out",
  "header.weekly": "Week",
  "header.nav": "Navigation",

  "theme.label": "Colour scheme",
  "theme.light": "Parchment",
  "theme.dark": "Night",

  "language.label": "Language",

  "dashboard.loading": "Loading…",

  // ─── Anmeldung ───────────────────────────────────────────────────────────
  "time.now": "now",
  "time.daysHours": "{days}d {hours}h",
  "time.hoursMinutes": "{hours}h {minutes}m",
  "time.minutes": "{minutes}m",

  // ─── Pluralfall Tage (V3 aus i18n-abschluss.md, für TrendChart) ─────────
  "core.days.one": "{count} day",
  "core.days.other": "{count} days",

  // „Diese Woche" stand doppelt (PvpPanel, früher MythicPanel) unter progress.thisWeek –
  // jetzt ein Schlüssel für beide (V4 aus i18n-abschluss.md).
  "core.thisWeek": "This week",

  // Generischer Ladehinweis, der in mehreren Komponenten nur "Lade…"/"Lädt…"
  // stand (V4 aus i18n-abschluss.md). Bereichsspezifische Varianten wie
  // "Lade Rezeptliste…" behalten eigene Schlüssel.
  "core.loading": "Loading…",

  // ─── API-Routen: wiederkehrende Fehlermeldungen ─────────────────────────
  // Dieselbe Wächter-Prüfung stand mit "Nicht angemeldet" und "Nicht
  // eingeloggt" in verschiedenen Routen – ein Schlüssel für beide.
  "core.notLoggedIn": "Not logged in",
  "core.invalidRequestBody": "Invalid request body",
  "core.characterSlugInvalid": "Not a WoW Forever character (expected first name and surname)",
  "core.noDataYet": "No data yet",
  "core.noDataYetText": "Battle.net has nothing for this yet. WoW Forever characters only appear from level 10 and after their first logout; pictures follow a while later. This is not an error.",
  "core.sessionExpired": "Session expired – please sign in again",
  "core.charactersLoadFailed": "Characters could not be loaded",
  "core.missingParameters": "Missing parameters",

  // ─── Spielmodi ───────────────────────────────────────────────────────────

  // ─── Charakter-Tabs ──────────────────────────────────────────────────────
  "tab.equipment": "Gear",
  "tab.equipment.note": "Equipped items and upgrade hints",
  "tab.professions": "Professions",
  "tab.professions.note": "Skill levels and recipes",
  "tab.progress": "Progress",
  "tab.progress.note": "Raids and dungeons",
  "tab.collections": "Collections",
  "tab.collections.note": "Titles and toys",
  "tab.achievements": "Achievements",
  "tab.achievements.note": "Achievements by category",
  "tab.reputation": "Reputation",
  "tab.reputation.note": "Standing with factions",
  "tab.pvp": "PvP",
  "tab.pvp.note": "Ratings and battlegrounds",
  "tab.talents": "Talents",
  "tab.talents.note": "Talent trees of the class",
  "tab.guild": "Guild",
  "tab.guild.note": "Members, achievements, events",
  "tab.economy": "Economy",
  "tab.economy.note": "Crafting cost against sale price",
  "tab.logs": "Logs",
  "tab.logs.note": "Warcraft Logs",
  "tab.history": "History",
  "tab.history.note": "Development over time",

  // ─── Charakterzeile ──────────────────────────────────────────────────────
  "card.itemLevel": "ILVL",
  "card.level": "Level",
  "card.faction": "Faction",
  "card.alliance": "Alliance",
  "card.horde": "Horde",
  "card.favoriteAdd": "Add to warband",
  "card.favoriteRemove": "Remove from warband",
  "card.loading": "Loading",

  "weekly.link": "Weekly overview",

  // ─── Wochenübersicht ─────────────────────────────────────────────────────
  "weekly.account": "{mode} · account",
  "weekly.heading": "Weekly overview",
  "weekly.intro":
    "What has already been cleared in the current lockout period, derived from the timestamp of the last boss kill. The profile API only updates on logout — anyone still inside the instance is missing here.",
  "weekly.back": "← Back to the warband",
  "weekly.weeklyResetIn": "Weekly reset in",
  "weekly.dailyResetIn": "Daily reset in",
  "weekly.dailyResetInUncertain": "Daily reset in (time unverified)",
  "weekly.openInstances": "Open instances",
  "weekly.region": "Region {region}",
  "weekly.regionAssumed":
    "Reset times are not documented for this region; the European values are shown.",
  "weekly.regionKnown":
    "Reset times from a maintained table, calculated in UTC. Around the clock change this can be off by an hour.",
  "weekly.statusOpen": "open",
  "weekly.statusDone": "done",
  "weekly.statusStarted": "started",
  "weekly.lockoutAssumed": "lockout assumed",
  "weekly.lockoutNote.onyxia": "Five days as in the original. Later expansions made it a week – if your version already does that, a 7 belongs here.",
  "weekly.lockoutNote.aq20": "Three days, anchored to the weekly reset – so the last period of the week is shorter.",
  "weekly.allBossesKilled": "All bosses killed",
  "weekly.partiallyKilled": "Partially killed",
  "weekly.days": "{days}d",
  "weekly.shortened": " · shortened",
  "weekly.noCharacters": "No characters",
  "weekly.noCharactersHint": "The account has no WoW Forever characters yet. Characters appear from level 10, after their first logout.",
  "weekly.characterFailed": "Not available",
  "weekly.noRaids": "No raids",
  "weekly.openOfTotal": "{open} of {total} open",
  "weekly.lastKnown": "Last known state",
  "weekly.lastKnownFrom": "Last known state from {date}",
  "weekly.failedText":
    "The raid endpoint did not answer for this character, and no earlier state is on file.",
  "weekly.noRaidData":
    "No raid data — the API returns nothing for characters that have never entered a raid.",
  "weekly.colInstance": "Instance",
  "weekly.colCleared": "Cleared this period",
  "weekly.colStatus": "Status",
  "weekly.colResetIn": "Reset in",
  "character.levelClass": "Level {level}",
  "character.itemLevel": "Item level",
  "character.averageItemLevel": "Ø incl. bags",
  "character.staleNotice": "Battle.net is not reachable right now — showing the last known state",
  "akte.title": "Hero dossier",
  "akte.subtitle": "Section {current} of {total} · each section loads when you open it",
  "akte.prev": "Previous section",
  "akte.next": "Next section",
  "akte.sections": "Sections",
  "akte.menuOpen": "Open the list of sections",
  "akte.menuClose": "Close",
  "akte.source": "Source",
  "akte.sourceText": "Battle.net · WoW Forever · {region}",
  "akte.sourceNote": "Values update when the character logs out.",

  // ─── Charakterliste ──────────────────────────────────────────────────────
  "grid.apiError": "API error",
  "grid.filterAll": "All",
  "grid.searchPlaceholder": "Search character…",
  "grid.noCharacters": "No characters found.",
  "grid.characterOne": "character",
  "grid.characterMany": "characters",
  "grid.loadingValues": "Loading values…",
  "stage.title": "Your warband",
  "stage.subtitle": "{favorites} of {slots} places taken · {count} characters on this account",
  "stage.more": "{count} more marked with ★ in the list below",
  "stage.emptySlot": "Place free",
  "stage.emptyHint": "Pick with ★ below",
  "stage.scrollHint": "More characters below",
  "stage.noRender": "No image yet",
  "list.title": "Other characters",
  "list.count": "{shown} of {total} · {horde} Horde, {alliance} Alliance",
  "list.empty": "No further characters.",
  "list.footer": "Warband Ledger · local instance",
  "list.footerNote": "Data stays on this machine",

  // ─── Einrichtung, Stufe 1 ────────────────────────────────────────────────
} as const

export const de: Record<keyof typeof en, string> = {

  "app.title": "WoW Dashboard",
  "app.description": "World-of-Warcraft-Account-Übersicht",
  "app.brand": "WARBAND LEDGER",
  "app.tagline": "Kriegsschar-Archiv",

  "header.firstFetch": "Erster Abruf läuft…",
  "header.updated": "Aktualisiert vor {seconds} Sek.",
  "header.pollEvery": "Abruf alle {seconds} Sek.",
  "header.charactersFound": "{count} Charaktere erkannt",
  "header.collections": "Sammlungen",
  "header.settings": "Einstellungen",
  "header.signOut": "Abmelden",
  "header.weekly": "Woche",
  "header.nav": "Navigation",

  "theme.label": "Farbschema",
  "theme.light": "Pergament",
  "theme.dark": "Nacht",

  "language.label": "Sprache",

  "dashboard.loading": "Lade…",
  "time.now": "jetzt",
  "time.daysHours": "{days} T {hours} Std.",
  "time.hoursMinutes": "{hours} Std. {minutes} Min.",
  "time.minutes": "{minutes} Min.",

  // Dativform „Tagen" ist beabsichtigt – der Satz lautet „in 6 Tagen".
  "core.days.one": "{count} Tag",
  "core.days.other": "{count} Tagen",

  "core.thisWeek": "Diese Woche",

  "core.loading": "Lade…",

  "core.notLoggedIn": "Nicht angemeldet",
  "core.invalidRequestBody": "Ungültiger Request-Body",
  "core.characterSlugInvalid": "Kein Charakter aus WoW Forever (erwartet: Vor- und Nachname)",
  "core.noDataYet": "Noch keine Daten",
  "core.noDataYetText": "Battle.net führt hierzu noch nichts. Charaktere aus WoW Forever erscheinen erst ab Stufe 10 und nach dem ersten Ausloggen; Bilder folgen etwas später. Das ist kein Fehler.",
  "core.sessionExpired": "Session abgelaufen – bitte neu einloggen",
  "core.charactersLoadFailed": "Charaktere konnten nicht geladen werden",
  "core.missingParameters": "Fehlende Parameter",


  "tab.equipment": "Ausrüstung",
  "tab.equipment.note": "Angelegte Gegenstände und Upgrade-Hinweise",
  "tab.professions": "Berufe",
  "tab.professions.note": "Fertigkeitsstufen und Rezepte",
  "tab.progress": "Fortschritt",
  "tab.progress.note": "Raids und Dungeons",
  "tab.collections": "Sammlungen",
  "tab.collections.note": "Titel und Spielzeug",
  "tab.achievements": "Erfolge",
  "tab.achievements.note": "Erfolge nach Kategorie",
  "tab.reputation": "Ansehen",
  "tab.reputation.note": "Ruf bei Fraktionen",
  "tab.pvp": "PvP",
  "tab.pvp.note": "Wertungen und Schlachtfelder",
  "tab.talents": "Talente",
  "tab.talents.note": "Talentbäume der Klasse",
  "tab.guild": "Gilde",
  "tab.guild.note": "Mitglieder, Erfolge, Ereignisse",
  "tab.economy": "Wirtschaft",
  "tab.economy.note": "Herstellkosten gegen Verkaufspreis",
  "tab.logs": "Logs",
  "tab.logs.note": "Warcraft Logs",
  "tab.history": "Verlauf",
  "tab.history.note": "Entwicklung über Zeit",

  "card.itemLevel": "GS",
  "card.level": "Stufe",
  "card.faction": "Fraktion",
  "card.alliance": "Allianz",
  "card.horde": "Horde",
  "card.favoriteAdd": "In die Kriegsschar aufnehmen",
  "card.favoriteRemove": "Aus der Kriegsschar nehmen",
  "card.loading": "Wird geladen",

  "weekly.link": "Wochenübersicht",
  "weekly.account": "{mode} · Account",
  "weekly.heading": "Wochenübersicht",
  "weekly.intro":
    "Was im laufenden Lockout-Zeitraum schon gelegt ist, abgeleitet aus dem Zeitpunkt des letzten Bosskills. Die Profil-API aktualisiert erst beim Ausloggen – wer noch in der Instanz steht, fehlt hier also noch.",
  "weekly.back": "← Zurück zur Kriegsschar",
  "weekly.weeklyResetIn": "Wochenreset in",
  "weekly.dailyResetIn": "Tagesreset in",
  "weekly.dailyResetInUncertain": "Tagesreset in (Zeit unbelegt)",
  "weekly.openInstances": "Offene Instanzen",
  "weekly.region": "Region {region}",
  "weekly.regionAssumed":
    "Für diese Region sind die Resetzeiten nicht belegt; angezeigt werden die europäischen Werte.",
  "weekly.regionKnown":
    "Resetzeiten aus gepflegter Tabelle, gerechnet in UTC. Um die Zeitumstellung herum kann das eine Stunde abweichen.",
  "weekly.statusOpen": "offen",
  "weekly.statusDone": "erledigt",
  "weekly.statusStarted": "angefangen",
  "weekly.lockoutAssumed": "Lockout angenommen",
  "weekly.lockoutNote.onyxia": "Fünf Tage wie im Original. In späteren Erweiterungen wurde daraus eine Woche – sollte deine Version das schon so handhaben, gehört hier eine 7 hin.",
  "weekly.lockoutNote.aq20": "Drei Tage, verankert am Wochenreset – der letzte Abschnitt der Woche ist darum kürzer.",
  "weekly.allBossesKilled": "Alle Bosse gelegt",
  "weekly.partiallyKilled": "Teilweise gelegt",
  "weekly.days": "{days} T",
  "weekly.shortened": " · verkürzt",
  "weekly.noCharacters": "Keine Charaktere",
  "weekly.noCharactersHint": "Der Account hat noch keine Charaktere in WoW Forever. Charaktere erscheinen ab Stufe 10, nach dem ersten Ausloggen.",
  "weekly.characterFailed": "Nicht abrufbar",
  "weekly.noRaids": "Keine Schlachtzüge",
  "weekly.openOfTotal": "{open} offen von {total}",
  "weekly.lastKnown": "Letzter bekannter Stand",
  "weekly.lastKnownFrom": "Letzter bekannter Stand vom {date}",
  "weekly.failedText":
    "Der Schlachtzug-Endpunkt hat für diesen Charakter nicht geantwortet, und es liegt kein früherer Stand vor.",
  "weekly.noRaidData":
    "Keine Schlachtzug-Daten – für Charaktere, die nie einen Raid betreten haben, liefert die API nichts.",
  "weekly.colInstance": "Instanz",
  "weekly.colCleared": "Diesen Zeitraum gelegt",
  "weekly.colStatus": "Status",
  "weekly.colResetIn": "Reset in",
  "character.levelClass": "Stufe {level}",
  "character.itemLevel": "Gegenstandsstufe",
  "character.averageItemLevel": "Ø inkl. Tasche",
  "character.staleNotice": "Battle.net ist gerade nicht erreichbar — angezeigt wird der letzte bekannte Stand",
  "akte.title": "Heldenakte",
  "akte.subtitle": "Bereich {current} von {total} · jeder Bereich lädt, wenn du ihn öffnest",
  "akte.prev": "Vorheriger Bereich",
  "akte.next": "Nächster Bereich",
  "akte.sections": "Bereiche",
  "akte.menuOpen": "Liste der Bereiche öffnen",
  "akte.menuClose": "Schliessen",
  "akte.source": "Quelle",
  "akte.sourceText": "Battle.net · WoW Forever · {region}",
  "akte.sourceNote": "Die Werte ziehen nach, wenn der Charakter sich ausloggt.",
  "grid.apiError": "API-Fehler",
  "grid.filterAll": "Alle",
  "grid.searchPlaceholder": "Charakter suchen…",
  "grid.noCharacters": "Keine Charaktere gefunden.",
  "grid.characterOne": "Charakter",
  "grid.characterMany": "Charaktere",
  "grid.loadingValues": "Lade Werte…",
  "stage.title": "Deine Kriegsschar",
  "stage.subtitle": "{favorites} von {slots} Plätzen besetzt · {count} Charaktere auf diesem Account",
  "stage.more": "{count} weitere mit ★ in der Liste unten",
  "stage.emptySlot": "Platz frei",
  "stage.emptyHint": "Unten mit ★ wählen",
  "stage.scrollHint": "Weitere Charaktere unten",
  "stage.noRender": "Noch kein Bild",
  "list.title": "Übrige Charaktere",
  "list.count": "{shown} von {total} · {horde} Horde, {alliance} Allianz",
  "list.empty": "Keine weiteren Charaktere.",
  "list.footer": "Warband Ledger · lokale Instanz",
  "list.footerNote": "Daten bleiben auf diesem Rechner",
}
