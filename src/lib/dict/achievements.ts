/**
 * Wörterbuch: Bereich `achievements`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 *
 * Erfolgs- und Kategorienamen kommen aus der Blizzard-API und stehen
 * deshalb nicht hier.
 */

export const en = {
  "achievements.points": "Achievement points",
  "achievements.achievements": "Achievements",
  "achievements.categories": "Categories",
  "achievements.recent": "Recently earned",
  "achievements.byCategory": "By category",
  "achievements.noCategoryProgress":
    "The API provides no per-category progress for this character.",
  "achievements.categoryStats": "{quantity} earned · {points} points",
  "achievements.progressOf": "{done} / {total} ({pct}%)",
  "achievements.loadingList": "Loading achievement list…",
  "achievements.noCatalog":
    "The API provides no achievement list for this category — so there is no telling what is still missing.",
  "achievements.noOwnAchievements":
    "This category holds no achievements of its own.",
  "achievements.noOwnAchievementsSubcategories":
    "This category holds no achievements of its own, only subcategories.",
  "achievements.tabMissing": "Missing ({count})",
  "achievements.tabEarned": "Earned ({count})",
  "achievements.allEarned": "Every achievement in this category earned.",
  "achievements.noneEarned": "None earned yet.",
  "achievements.pointsShort": "{points}P",
  "achievements.moreHidden": "{count} more not shown",

  // ─── API-Route ────────────────────────────────────────────────────────────
  "achievements.categoryIdRequired": "categoryId required",

  // ─── Seite ────────────────────────────────────────────────────────────────
  "achievements.intro":
    "Points, recently earned achievements and progress by category. Expanding a category loads its full list — that's what makes visible what's still missing.",
  "achievements.unavailable": "Achievements not available",
  "achievements.unavailableText":
    "The endpoint did not answer, and no earlier state is on file.",
} as const

export const de: Record<keyof typeof en, string> = {
  "achievements.points": "Erfolgspunkte",
  "achievements.achievements": "Erfolge",
  "achievements.categories": "Kategorien",
  "achievements.recent": "Zuletzt erreicht",
  "achievements.byCategory": "Nach Kategorie",
  "achievements.noCategoryProgress":
    "Die API liefert keinen Fortschritt je Kategorie für diesen Charakter.",
  "achievements.categoryStats": "{quantity} erreicht · {points} Punkte",
  "achievements.progressOf": "{done} / {total} ({pct}%)",
  "achievements.loadingList": "Lade Erfolgsliste…",
  "achievements.noCatalog":
    "Für diese Kategorie liefert die API keine Erfolgsliste — es lässt sich also nicht sagen, was noch fehlt.",
  "achievements.noOwnAchievements":
    "Diese Kategorie enthält keine eigenen Erfolge.",
  "achievements.noOwnAchievementsSubcategories":
    "Diese Kategorie enthält keine eigenen Erfolge, nur Unterkategorien.",
  "achievements.tabMissing": "Fehlt ({count})",
  "achievements.tabEarned": "Erreicht ({count})",
  "achievements.allEarned": "Alle Erfolge dieser Kategorie erreicht.",
  "achievements.noneEarned": "Noch keiner erreicht.",
  "achievements.pointsShort": "{points}P",
  "achievements.moreHidden": "{count} weitere nicht angezeigt",

  "achievements.categoryIdRequired": "categoryId nötig",

  "achievements.intro":
    "Punkte, zuletzt erreichte Erfolge und Fortschritt je Kategorie. Eine Kategorie aufklappen lädt ihre vollständige Liste — damit wird sichtbar, was noch fehlt.",
  "achievements.unavailable": "Erfolge nicht abrufbar",
  "achievements.unavailableText":
    "Der Endpunkt hat nicht geantwortet, und es liegt kein früherer Stand vor.",
}
