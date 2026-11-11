/**
 * Auktionshaus: Preisindex.
 *
 * Der Auktionsendpunkt ist der grösste der ganzen API. Ein volles Haus
 * liefert mehrere Megabyte, gelegentlich über zehn, und darin jedes
 * einzelne Angebot mit Gebot und Verkäufer-Stack. Das darf weder in einen
 * Snapshot noch durch den Browser – deshalb:
 *
 * 1. Der Abruf läuft serverseitig und wird sofort verdichtet: je Gegenstand
 *    bleiben günstigster Sofortkaufpreis je Einheit, angebotene Menge und die
 *    Zahl der Angebote. Aus Megabytes werden Zeilen in einer Tabelle.
 * 2. Angebote **ohne** Sofortkaufpreis ergeben keinen Preis. Sie werden nicht
 *    mit dem Gebot ersetzt, sondern gezählt und übersprungen – ein Gebot sagt,
 *    was jemand *bisher* geboten hat, nicht was der Gegenstand kostet.
 * 3. Aufgerufen wird der Index bewusst von Hand oder zeitgesteuert, nicht bei
 *    jedem Seitenaufruf.
 *
 * WoW Forever (laut Community-Tests, Stand 2026-11-11 – nicht dokumentiert):
 * - **Häuser je Ruleset statt je Realm:** `/data/wow/ruleset/index`, dann
 *   `/data/wow/ruleset/{id}/auctions/` (mit Schrägstrich am Ende – ohne ihn
 *   kommt 404), dann je Haus `/data/wow/ruleset/{id}/auctions/{houseId}`.
 *   Mit echten Daten bestätigt (2026-11-11): rund 110'000 Angebote je Haus.
 * - **Jedes Ruleset liefert dieselben 15 Häuser** mit denselben Angeboten.
 *   Gespeichert wird darum je Region und Haus, nicht je Ruleset – sonst
 *   stünde derselbe Preis mehrfach in der Tabelle.
 * - **Waren (Commodities) stehen nicht in `auctions`.** Leder, Stoff, Erz,
 *   Faden – alles Stapelbare – kommt über das Feld `commodities` der
 *   Hausantwort bzw. `/data/wow/ruleset/{id}/auctions/{houseId}/commodities`.
 *   Bis 2026-11-11 las die App nur `auctions`: 4'254 Gegenstände mit Preis,
 *   aber kein einziges Reagenz – jede Kostensumme war darum „unbekannt".
 *   Der alte regionsweite Commodities-Endpunkt liefert 404.
 * - Einige Häuser (112, 115, 118) hatten kein `auctions`-Feld: das ergibt
 *   null Angebote, keinen Fehler.
 */

import { prisma } from "./db"
import { bnetGet, isNotFound } from "./battlenet"
import { region as currentRegion } from "./runtime"

/** Wie viele Zeilen auf einmal in die Datenbank gehen. */
const INSERT_CHUNK = 500

// ─── Sichten ──────────────────────────────────────────────────────────────────

export interface AuctionHouse {
  id: number
  name: string
}

export interface PriceEntry {
  itemId: number
  /** Günstigster Sofortkaufpreis je Einheit, in Kupfer */
  minUnitPrice: number
  quantity: number
  listings: number
}

export interface CondensedAuctions {
  entries: PriceEntry[]
  /** Angebote in der Rohantwort */
  auctionCount: number
  /** Angebote ohne Sofortkaufpreis – kein Preis, also übersprungen */
  skippedCount: number
}

export interface HouseStatus {
  houseId: number
  houseName: string | null
  status: string
  auctionCount: number
  itemCount: number
  skippedCount: number
  error: string | null
  updatedAt: Date | null
}

// ─── Rohformen ────────────────────────────────────────────────────────────────

interface RawAuction {
  item?: { id?: number }
  /** Sofortkauf für den ganzen Stapel, in Kupfer */
  buyout?: number
  /** Warenangebote: Preis je Einheit */
  unit_price?: number
  bid?: number
  quantity?: number
}

export interface RawAuctions {
  auctions?: RawAuction[]
  /**
   * Warenangebote. Laut Community-Tests in der Hausantwort enthalten; ob als
   * Liste oder als Verweis, ist nicht belegt – darum `unknown` und tolerant
   * gelesen, siehe `loadCommodities`.
   */
  commodities?: unknown
}

interface RawAuctionHouseIndex {
  auctions?: { id?: number; name?: string }[]
}

// ─── Verdichten ───────────────────────────────────────────────────────────────

/**
 * Preis je Einheit eines Angebots. `null`, wenn es keinen Sofortkauf gibt.
 *
 * `unit_price` liefert die API nur für Warenangebote; sonst muss der
 * Stapelpreis auf die Stückzahl umgerechnet werden.
 */
export function unitPrice(auction: RawAuction): number | null {
  if (typeof auction.unit_price === "number" && auction.unit_price > 0) {
    return auction.unit_price
  }

  const buyout = auction.buyout
  if (typeof buyout !== "number" || buyout <= 0) return null

  const quantity =
    typeof auction.quantity === "number" && auction.quantity > 0
      ? auction.quantity
      : 1

  return Math.round(buyout / quantity)
}

export function condenseAuctions(raw: RawAuctions | null): CondensedAuctions {
  const auctions = raw?.auctions ?? []
  const best = new Map<number, PriceEntry>()
  let skipped = 0

  for (const auction of auctions) {
    const itemId = auction.item?.id
    if (typeof itemId !== "number") {
      skipped++
      continue
    }

    const price = unitPrice(auction)
    if (price === null) {
      skipped++
      continue
    }

    const quantity =
      typeof auction.quantity === "number" && auction.quantity > 0
        ? auction.quantity
        : 1

    const existing = best.get(itemId)
    if (!existing) {
      best.set(itemId, {
        itemId,
        minUnitPrice: price,
        quantity,
        listings: 1,
      })
    } else {
      existing.minUnitPrice = Math.min(existing.minUnitPrice, price)
      existing.quantity += quantity
      existing.listings += 1
    }
  }

  return {
    entries: [...best.values()],
    auctionCount: auctions.length,
    skippedCount: skipped,
  }
}

// ─── Abrufe ───────────────────────────────────────────────────────────────────

export interface Ruleset {
  id: number
  name: string
}

/** Die Rulesets der Region (PvP, Normal, Rollenspiel …). */
export async function listRulesets(token: string): Promise<Ruleset[]> {
  const data = await bnetGet<{
    rulesets?: { id?: number; name?: string; type?: { name?: string } }[]
  }>("/data/wow/ruleset/index", token, "dynamic", 60 * 60 * 24)

  return (data.rulesets ?? [])
    .map((r): Ruleset | null =>
      typeof r.id === "number"
        ? { id: r.id, name: r.name ?? r.type?.name ?? `#${r.id}` }
        : null
    )
    .filter((r): r is Ruleset => r !== null)
    .sort((a, b) => a.id - b.id)
}

/**
 * Häuser eines Rulesets. Da alle Rulesets dieselben Häuser liefern, reicht
 * eines; welches, ist gleich.
 */
export async function listAuctionHouses(
  rulesetId: number,
  token: string
): Promise<AuctionHouse[]> {
  // Der Schrägstrich am Ende ist Pflicht – ohne ihn antwortet die API mit 404
  const data = await bnetGet<RawAuctionHouseIndex>(
    `/data/wow/ruleset/${rulesetId}/auctions/`,
    token,
    "dynamic",
    60 * 60
  )

  return (data.auctions ?? [])
    .map((h): AuctionHouse | null =>
      typeof h.id === "number" ? { id: h.id, name: h.name ?? `#${h.id}` } : null
    )
    .filter((h): h is AuctionHouse => h !== null)
}

/** Die grosse Antwort. Ohne Zwischenspeicher – sie soll nicht zweimal kommen. */
export function fetchAuctions(
  rulesetId: number,
  houseId: number,
  token: string
): Promise<RawAuctions> {
  return bnetGet<RawAuctions>(
    `/data/wow/ruleset/${rulesetId}/auctions/${houseId}`,
    token,
    "dynamic",
    0
  )
}

/**
 * Die Warenangebote eines Hauses. Stehen sie als Liste in der Hausantwort,
 * werden sie genommen; sonst kommt der eigene Endpunkt dran. Beides
 * zusammen ginge nicht – dieselben Angebote stünden doppelt in der Menge.
 *
 * Ein 404 heisst „keine Waren in diesem Haus", wie bei den Häusern ohne
 * `auctions`-Feld. Jeder andere Fehler bricht den Lauf ab: ohne Waren fehlen
 * fast alle Reagenzpreise, und ein Index ohne sie sähe vollständig aus.
 */
async function loadCommodities(
  rulesetId: number,
  houseId: number,
  raw: RawAuctions,
  token: string
): Promise<RawAuction[]> {
  if (Array.isArray(raw.commodities)) return raw.commodities as RawAuction[]

  try {
    const data = await bnetGet<{ auctions?: RawAuction[] }>(
      `/data/wow/ruleset/${rulesetId}/auctions/${houseId}/commodities`,
      token,
      "dynamic",
      0
    )
    return Array.isArray(data.auctions) ? data.auctions : []
  } catch (error) {
    if (isNotFound(error)) {
      console.warn(`[auktionshaus] Haus ${houseId}: keine Waren (404)`)
      return []
    }
    throw error
  }
}

// ─── Speichern ────────────────────────────────────────────────────────────────

/**
 * Preise eines Hauses ersetzen. Bewusst löschen und neu schreiben:
 * ein Gegenstand, der nicht mehr angeboten wird, hat keinen Preis mehr –
 * ein stehengelassener alter Wert wäre eine falsche Auskunft.
 *
 * `skipDuplicates` gibt es auf SQLite nicht; das Löschen vorher macht es
 * ohnehin unnötig.
 */
export async function storePrices(
  houseId: number,
  entries: PriceEntry[]
): Promise<void> {
  const scope = { region: currentRegion(), houseId }
  const fetchedAt = new Date()

  await prisma.auctionPrice.deleteMany({ where: scope })

  for (let i = 0; i < entries.length; i += INSERT_CHUNK) {
    const chunk = entries.slice(i, i + INSERT_CHUNK)
    await prisma.auctionPrice.createMany({
      data: chunk.map((e) => ({ ...scope, ...e, fetchedAt })),
    })
  }
}

async function writeRun(
  houseId: number,
  data: Record<string, unknown>
): Promise<void> {
  const region = currentRegion()
  await prisma.auctionRun.upsert({
    where: { region_houseId: { region, houseId } },
    update: data,
    create: { region, houseId, ...data },
  })
}

/**
 * Ein Haus abrufen, verdichten, speichern. Gibt den Stand zurück.
 * Scheitert der Abruf, wird das am Lauf vermerkt – die alten Preise
 * bleiben stehen, sind aber über `updatedAt` als alt erkennbar.
 */
export async function refreshHouse(
  rulesetId: number,
  house: AuctionHouse,
  token: string
): Promise<HouseStatus> {
  try {
    const raw = await fetchAuctions(rulesetId, house.id, token)
    const commodities = await loadCommodities(rulesetId, house.id, raw, token)
    // Einzelstücke und Waren in einem Durchgang: Preis je Einheit liefern
    // beide (`buyout` / Menge bzw. `unit_price`), siehe unitPrice()
    const condensed = condenseAuctions({
      auctions: [...(raw.auctions ?? []), ...commodities],
    })

    await storePrices(house.id, condensed.entries)
    await writeRun(house.id, {
      rulesetId,
      houseName: house.name,
      status: "READY",
      auctionCount: condensed.auctionCount,
      itemCount: condensed.entries.length,
      skippedCount: condensed.skippedCount,
      error: null,
    })

    return {
      houseId: house.id,
      houseName: house.name,
      status: "READY",
      auctionCount: condensed.auctionCount,
      itemCount: condensed.entries.length,
      skippedCount: condensed.skippedCount,
      error: null,
      updatedAt: new Date(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler"
    await writeRun(house.id, {
      rulesetId,
      houseName: house.name,
      status: "FAILED",
      error: message,
    })
    throw error
  }
}

// ─── Lesen ────────────────────────────────────────────────────────────────────

export async function getHouseStatuses(): Promise<HouseStatus[]> {
  const rows = (await prisma.auctionRun.findMany({
    where: { region: currentRegion() },
    orderBy: { houseId: "asc" },
  })) as {
    houseId: number
    houseName: string | null
    status: string
    auctionCount: number
    itemCount: number
    skippedCount: number
    error: string | null
    updatedAt: Date
  }[]

  return rows.map((r) => ({
    houseId: r.houseId,
    houseName: r.houseName,
    status: r.status,
    auctionCount: r.auctionCount,
    itemCount: r.itemCount,
    skippedCount: r.skippedCount,
    error: r.error,
    updatedAt: r.updatedAt,
  }))
}

/**
 * Preise für eine Auswahl an Gegenständen. Was nicht angeboten wird, fehlt
 * in der Antwort – das ist kein Preis von 0, sondern kein Preis.
 */
export async function getPrices(
  houseId: number,
  itemIds: number[]
): Promise<Map<number, PriceEntry>> {
  if (itemIds.length === 0) return new Map()

  const rows = (await prisma.auctionPrice.findMany({
    where: {
      region: currentRegion(),
      houseId,
      itemId: { in: [...new Set(itemIds)] },
    },
  })) as PriceEntry[]

  return new Map(rows.map((r) => [r.itemId, r]))
}
