/**
 * Auktionshaus: Preisindex.
 *
 * Der Auktionsendpunkt ist der grösste der ganzen API. Ein voller verbundener
 * Realm liefert mehrere Megabyte, gelegentlich über zehn, und darin jedes
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
 * Modusunterschiede, nachgeprüft und nicht geraten:
 * - **Retail:** ein Haus je verbundenem Realm, Pfad ohne Haus-ID.
 * - **Classic:** mehrere Häuser je Realm (Allianz, Horde, neutral), erst über
 *   `/auctions/index` auflisten, dann je Haus abrufen.
 * - **Classic Era:** dieselben Pfade wie Classic, antworten laut Blizzards
 *   eigenem Forum seit Dezember 2024 aber mit 404. Ob das wieder läuft, sagt
 *   nur der Versuch – die Oberfläche muss den Fall darum benennen können.
 */

import { prisma } from "./db"
import { GAME_MODES, type GameMode } from "./battlenet"
import { apiBase, locale } from "./runtime"


/** Retail hat genau ein Haus; die ID 0 steht für „das eine". */
export const RETAIL_HOUSE_ID = 0

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
  connectedRealmId: number
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
  /** Retail-Warenangebote: Preis je Einheit */
  unit_price?: number
  bid?: number
  quantity?: number
}

export interface RawAuctions {
  auctions?: RawAuction[]
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

async function dataFetch<T>(
  path: string,
  token: string,
  namespace: string,
  revalidate: number
): Promise<T> {
  const url = new URL(`${apiBase()}${path}`)
  url.searchParams.set("namespace", namespace)
  url.searchParams.set("locale", locale())

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`Auktionen ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

function modeConfig(mode: GameMode) {
  return GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
}

/**
 * Verbundener Realm eines Realms. Steht im Realm-Datensatz als Verweis –
 * die ID muss aus der URL gelesen werden, die API nennt sie nicht einzeln.
 */
export async function resolveConnectedRealm(
  realmSlug: string,
  token: string,
  mode: GameMode
): Promise<number> {
  const config = modeConfig(mode)
  const data = await dataFetch<{ connected_realm?: { href?: string } }>(
    `/data/wow/realm/${realmSlug}`,
    token,
    config.staticNamespace,
    60 * 60 * 24
  )

  const href = data.connected_realm?.href
  const match = href?.match(/connected-realm\/(\d+)/)
  if (!match) {
    throw new Error(`Kein verbundener Realm für "${realmSlug}" ermittelbar`)
  }

  return Number(match[1])
}

/**
 * Häuser eines verbundenen Realms. Retail hat genau eines und keinen
 * Index-Endpunkt – das wird hier abgebildet, nicht angefragt.
 */
export async function listAuctionHouses(
  connectedRealmId: number,
  token: string,
  mode: GameMode
): Promise<AuctionHouse[]> {
  if (mode === "retail") {
    return [{ id: RETAIL_HOUSE_ID, name: "Auktionshaus" }]
  }

  const config = modeConfig(mode)
  const data = await dataFetch<RawAuctionHouseIndex>(
    `/data/wow/connected-realm/${connectedRealmId}/auctions/index`,
    token,
    config.dynamicNamespace,
    60 * 60
  )

  return (data.auctions ?? [])
    .map((h): AuctionHouse | null =>
      typeof h.id === "number" ? { id: h.id, name: h.name ?? `Haus ${h.id}` } : null
    )
    .filter((h): h is AuctionHouse => h !== null)
}

/** Die grosse Antwort. Ohne Zwischenspeicher – sie soll nicht zweimal kommen. */
export async function fetchAuctions(
  connectedRealmId: number,
  houseId: number,
  token: string,
  mode: GameMode
): Promise<RawAuctions> {
  const config = modeConfig(mode)
  const path =
    mode === "retail"
      ? `/data/wow/connected-realm/${connectedRealmId}/auctions`
      : `/data/wow/connected-realm/${connectedRealmId}/auctions/${houseId}`

  return dataFetch<RawAuctions>(path, token, config.dynamicNamespace, 0)
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
  mode: GameMode,
  connectedRealmId: number,
  houseId: number,
  entries: PriceEntry[]
): Promise<void> {
  const scope = { gameMode: mode, connectedRealmId, houseId }
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
  mode: GameMode,
  connectedRealmId: number,
  houseId: number,
  data: Record<string, unknown>
): Promise<void> {
  const key = {
    gameMode_connectedRealmId_houseId: { gameMode: mode, connectedRealmId, houseId },
  }

  await prisma.auctionRun.upsert({
    where: key,
    update: data,
    create: { gameMode: mode, connectedRealmId, houseId, ...data },
  })
}

/**
 * Ein Haus abrufen, verdichten, speichern. Gibt den Stand zurück.
 * Scheitert der Abruf, wird das am Lauf vermerkt – die alten Preise
 * bleiben stehen, sind aber über `updatedAt` als alt erkennbar.
 */
export async function refreshHouse(
  mode: GameMode,
  connectedRealmId: number,
  house: AuctionHouse,
  token: string
): Promise<HouseStatus> {
  try {
    const raw = await fetchAuctions(connectedRealmId, house.id, token, mode)
    const condensed = condenseAuctions(raw)

    await storePrices(mode, connectedRealmId, house.id, condensed.entries)
    await writeRun(mode, connectedRealmId, house.id, {
      houseName: house.name,
      status: "READY",
      auctionCount: condensed.auctionCount,
      itemCount: condensed.entries.length,
      skippedCount: condensed.skippedCount,
      error: null,
    })

    return {
      connectedRealmId,
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
    await writeRun(mode, connectedRealmId, house.id, {
      houseName: house.name,
      status: "FAILED",
      error: message,
    })
    throw error
  }
}

// ─── Lesen ────────────────────────────────────────────────────────────────────

export async function getHouseStatuses(
  mode: GameMode,
  connectedRealmId: number
): Promise<HouseStatus[]> {
  const rows = (await prisma.auctionRun.findMany({
    where: { gameMode: mode, connectedRealmId },
    orderBy: { houseId: "asc" },
  })) as {
    connectedRealmId: number
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
    connectedRealmId: r.connectedRealmId,
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
  mode: GameMode,
  connectedRealmId: number,
  houseId: number,
  itemIds: number[]
): Promise<Map<number, PriceEntry>> {
  if (itemIds.length === 0) return new Map()

  const rows = (await prisma.auctionPrice.findMany({
    where: {
      gameMode: mode,
      connectedRealmId,
      houseId,
      itemId: { in: [...new Set(itemIds)] },
    },
  })) as PriceEntry[]

  return new Map(rows.map((r) => [r.itemId, r]))
}
