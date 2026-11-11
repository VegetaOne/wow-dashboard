/**
 * Wörterbuch: Bereich `economy`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 * "Rezept" ist hier zu Gast – zu Hause ist es professions.recipe (V4 aus
 * i18n-abschluss.md).
 */

export const en = {
  "economy.houseUnreachable.title": "Auction house not reachable",
  "economy.houseUnreachable.body": "The auction houses are not available right now.",
  "economy.loadingHouses": "Loading auction houses…",
  "economy.noHouses": "No auction houses",
  "economy.noHousesText": "The API lists no auction house for WoW Forever right now.",
  "economy.foreverNote": "The auction endpoints of WoW Forever are not documented by Blizzard. Houses are listed per ruleset, and every ruleset returns the same ones. If the API changes, this view says so instead of showing wrong prices.",
  "economy.heading": "Economy",
  "economy.intro": "Crafting cost against sale price for the known recipes of this character. Prices come from the selected auction house and are only read on request — the raw response is the largest in the whole API.",
  "economy.excludedTitle": "What the numbers leave out",
  "economy.excludedText": "Auction fees, sale duration, market saturation and profession bonuses. The profit here says whether a recipe is worth a look — not what ends up in your account. Proceeds are the price you would have to undercut, not a guaranteed sale price.",
  "economy.professionsUnavailable": "Professions not available",
  "economy.professionsUnavailableText": "Without the character's recipes there is nothing to calculate. The professions endpoint did not answer, and no earlier state is on file.",

  "economy.house": "House",
  "economy.readingIn": "Reading…",
  "economy.refreshPrices": "Refresh prices",
  "economy.readPrices": "Read prices",
  "economy.readHint":
    "Loads every listing of this house and condenses it into prices. This is the app's largest request.",
  "economy.priceStatus": "Price status",
  "economy.notReadYet": "not read yet",
  "economy.itemsWithPrice": "Items with a price",
  "economy.listingsRead": "Listings read",
  "economy.noBuyout": "No buyout",
  "economy.noPrice": "yield no price",
  "economy.soNoCostSum": "— so no cost total.",
  "economy.lastAttemptFailed": "Last attempt failed",
  "economy.pricesNotRead": "Prices not read.",
  "economy.pricesNotReadError": "Prices not read: {message}",

  "economy.noKnownRecipes":
    "No recipes are known for this character. Without recipes there is nothing to calculate.",
  "economy.noPricesYet":
    "No prices for this house yet. Without prices, cost and proceeds would be made up — read the prices first.",
  "economy.profession": "Profession",
  "economy.recipesCalculated": "{computed} of {total} recipes calculated",
  "economy.cost": "Cost",
  "economy.proceeds": "Proceeds",
  "economy.profit": "Profit",
  "economy.craftedNotListed":
    "The result is not currently listed — no proceeds known.",
  "economy.craftedNotListedNamed":
    '„{item}" is not currently listed — no proceeds known.',
  "economy.calculating": "Calculating…",
  "economy.calculateFirst": "Calculate first {count}",
  "economy.calculateMore": "Calculate {count} more",
  "economy.allRecipesOfTier": "All recipes of this tier calculated.",
  "economy.calculationFailed": "The calculation failed.",
  "economy.recipesWithoutDetails":
    "{count} recipes without details in the API — not calculated.",
  "economy.noOfferFor": "No offer for: {items}",
  "economy.andMore": "and {count} more",

  // ─── API-Routen (auction-index, economy) ─────────────────────────────────
  "economy.housesUnavailable": "Houses not available",
  "economy.rulesetAndHouseRequired": "rulesetId and houseId are required",
  "economy.houseRequired": "houseId is required",
  "economy.houseFallbackName": "House {id}",
  "economy.fetchFailed": "Fetch failed",
  "economy.calculationFailedApi": "Calculation failed",
} as const

export const de: Record<keyof typeof en, string> = {
  "economy.houseUnreachable.title": "Auktionshaus nicht erreichbar",
  "economy.houseUnreachable.body": "Die Auktionshäuser sind gerade nicht abrufbar.",
  "economy.loadingHouses": "Auktionshäuser werden geladen…",
  "economy.noHouses": "Keine Auktionshäuser",
  "economy.noHousesText": "Die API führt für WoW Forever gerade kein Auktionshaus.",
  "economy.foreverNote": "Die Auktionsendpunkte von WoW Forever sind von Blizzard nicht dokumentiert. Häuser werden je Ruleset geführt, und jedes Ruleset liefert dieselben. Ändert sich die API, sagt diese Ansicht das, statt falsche Preise zu zeigen.",
  "economy.heading": "Wirtschaft",
  "economy.intro": "Herstellkosten gegen Verkaufspreis für die bekannten Rezepte dieses Charakters. Preise kommen aus dem gewählten Auktionshaus und werden nur auf Anforderung eingelesen — die Rohantwort ist die grösste der ganzen API.",
  "economy.excludedTitle": "Was die Zahlen nicht enthalten",
  "economy.excludedText": "Auktionsgebühren, Verkaufsdauer, Marktsättigung und Berufsboni. Der Gewinn hier sagt, ob sich ein Rezept anzuschauen lohnt — nicht, was am Ende auf dem Konto landet. Erlös ist der Preis, zu dem man sich unterbieten müsste, nicht der sichere Verkaufspreis.",
  "economy.professionsUnavailable": "Berufe nicht abrufbar",
  "economy.professionsUnavailableText": "Ohne die Rezepte des Charakters gibt es nichts zu rechnen. Der Berufe-Endpunkt hat nicht geantwortet, und es liegt kein früherer Stand vor.",

  "economy.house": "Haus",
  "economy.readingIn": "Liest ein…",
  "economy.refreshPrices": "Preise erneuern",
  "economy.readPrices": "Preise einlesen",
  "economy.readHint":
    "Lädt alle Angebote dieses Hauses und verdichtet sie zu Preisen. Das ist die grösste Anfrage der App.",
  "economy.priceStatus": "Preisstand",
  "economy.notReadYet": "noch nicht eingelesen",
  "economy.itemsWithPrice": "Gegenstände mit Preis",
  "economy.listingsRead": "Angebote gelesen",
  "economy.noBuyout": "Ohne Sofortkauf",
  "economy.noPrice": "ergeben keinen Preis",
  "economy.soNoCostSum": "— darum keine Kostensumme.",
  "economy.lastAttemptFailed": "Letzter Versuch fehlgeschlagen",
  "economy.pricesNotRead": "Preise nicht eingelesen.",
  "economy.pricesNotReadError": "Preise nicht eingelesen: {message}",

  "economy.noKnownRecipes":
    "Für diesen Charakter sind keine Rezepte bekannt. Ohne Rezepte gibt es nichts zu rechnen.",
  "economy.noPricesYet":
    "Noch keine Preise für dieses Haus. Ohne Preise wären Kosten und Erlös erfunden — lies die Preise zuerst ein.",
  "economy.profession": "Beruf",
  "economy.recipesCalculated": "{computed} von {total} Rezepten gerechnet",
  "economy.cost": "Kosten",
  "economy.proceeds": "Erlös",
  "economy.profit": "Gewinn",
  "economy.craftedNotListed":
    "Das Ergebnis wird gerade nicht angeboten — kein Erlös bekannt.",
  "economy.craftedNotListedNamed":
    '„{item}" wird gerade nicht angeboten — kein Erlös bekannt.',
  "economy.calculating": "Rechnet…",
  "economy.calculateFirst": "Erste {count} rechnen",
  "economy.calculateMore": "Weitere {count} rechnen",
  "economy.allRecipesOfTier": "Alle Rezepte dieser Stufe gerechnet.",
  "economy.calculationFailed": "Die Berechnung ist fehlgeschlagen.",
  "economy.recipesWithoutDetails":
    "{count} Rezepte ohne Details in der API — nicht gerechnet.",
  "economy.noOfferFor": "Kein Angebot für: {items}",
  "economy.andMore": "und {count} weitere",

  "economy.housesUnavailable": "Häuser nicht abrufbar",
  "economy.rulesetAndHouseRequired": "rulesetId und houseId sind Pflicht",
  "economy.houseRequired": "houseId ist Pflicht",
  "economy.houseFallbackName": "Haus {id}",
  "economy.fetchFailed": "Abruf fehlgeschlagen",
  "economy.calculationFailedApi": "Berechnung fehlgeschlagen",
}
