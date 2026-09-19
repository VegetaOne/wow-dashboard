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
  "economy.houseUnreachable.body":
    "The auction houses of this realm are not available.",
  "economy.loadingHouses": "Loading auction houses…",
  "economy.noDataForMode": "No auction data for this mode",
  "economy.noHouseForRealm": "The API has no auction house for this realm.",
  "economy.classicEraNote":
    "In Classic Era, the auction endpoints have answered 404 since late 2024, according to Blizzard's own forum. Once they respond again, the houses appear here without any change to the app.",

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
  "economy.realmMissing": "Realm missing",
  "economy.housesUnavailable": "Houses not available",
  "economy.connectedRealmUnresolved": "Connected realm could not be determined",
  "economy.connectedRealmAndHouseRequired":
    "connectedRealmId and houseId are required",
  "economy.houseFallbackName": "House {id}",
  "economy.fetchFailed": "Fetch failed",
  "economy.calculationFailedApi": "Calculation failed",
} as const

export const de: Record<keyof typeof en, string> = {
  "economy.houseUnreachable.title": "Auktionshaus nicht erreichbar",
  "economy.houseUnreachable.body":
    "Die Auktionshäuser dieses Realms sind nicht abrufbar.",
  "economy.loadingHouses": "Auktionshäuser werden geladen…",
  "economy.noDataForMode": "Keine Auktionsdaten für diesen Modus",
  "economy.noHouseForRealm": "Die API führt für diesen Realm kein Auktionshaus.",
  "economy.classicEraNote":
    "In Classic Era antworten die Auktionsendpunkte laut Blizzards eigenem Forum seit Ende 2024 mit 404. Sobald sie wieder liefern, erscheinen die Häuser hier ohne Änderung an der App.",

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

  "economy.realmMissing": "Realm fehlt",
  "economy.housesUnavailable": "Häuser nicht abrufbar",
  "economy.connectedRealmUnresolved": "Verbundener Realm nicht ermittelbar",
  "economy.connectedRealmAndHouseRequired":
    "connectedRealmId und houseId sind Pflicht",
  "economy.houseFallbackName": "Haus {id}",
  "economy.fetchFailed": "Abruf fehlgeschlagen",
  "economy.calculationFailedApi": "Berechnung fehlgeschlagen",
}
