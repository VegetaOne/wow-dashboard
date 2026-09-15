/**
 * Berufs-Wirtschaft: Herstellkosten gegen Verkaufspreis.
 *
 * Die Rechnung ist einfach, die Ehrlichkeit dabei ist der Punkt:
 *
 * - **Kosten** sind die Summe der Reagenzien zum günstigsten Angebot.
 *   Fehlt *ein* Reagenz im Auktionshaus, sind die Kosten **nicht bekannt**.
 *   Ein fehlender Preis ist nicht null – sonst sähe ein Rezept, dessen
 *   teuerstes Reagenz gerade niemand anbietet, am günstigsten aus.
 * - **Erlös** ist der günstigste Angebotspreis des hergestellten Gegenstands
 *   mal der Herstellmenge. Das ist der Preis, zu dem man sich unterbieten
 *   müsste – nicht der, den man sicher bekommt.
 * - **Gewinn** erscheint nur, wenn beide Seiten bekannt sind.
 *
 * Was hier bewusst *nicht* gerechnet wird: Auktionsgebühren, Verkaufsdauer,
 * Marktsättigung, Prozeduren mit Zufallsergebnis, Berufsboni. All das würde
 * eine Genauigkeit vorspiegeln, die die Datenlage nicht trägt. Die Zahl hier
 * beantwortet nur: „lohnt es sich, das überhaupt anzuschauen?"
 */

import { GAME_MODES, type GameMode } from "./battlenet"
import type { PriceEntry } from "./auction"

const REGION = process.env.BNET_REGION || "eu"
const API_BASE = `https://${REGION}.api.blizzard.com`
const LOCALE = "de_DE"
/** Rezeptdaten sind statisch – eine Woche zwischenspeichern. */
const STATIC_REVALIDATE = 60 * 60 * 24 * 7

// ─── Sichten ──────────────────────────────────────────────────────────────────

export interface Reagent {
  itemId: number
  name: string
  quantity: number
}

export interface RecipeDetail {
  recipeId: number
  name: string
  craftedItemId: number | null
  craftedItemName: string | null
  /** Wie viele Stück ein Durchgang ergibt. Fehlt die Angabe: 1. */
  craftedQuantity: number
  reagents: Reagent[]
}

export interface ReagentCost {
  reagent: Reagent
  /** Preis je Einheit in Kupfer, null wenn nicht angeboten */
  unitPrice: number | null
  /** unitPrice × Menge, null wenn kein Preis */
  total: number | null
}

export interface MarginRow {
  recipeId: number
  recipeName: string
  craftedItemId: number | null
  craftedItemName: string | null
  craftedQuantity: number
  costs: ReagentCost[]
  /** Summe der Reagenzien – null, sobald ein Preis fehlt */
  totalCost: number | null
  /** Preis je Einheit des Ergebnisses */
  saleUnitPrice: number | null
  /** saleUnitPrice × craftedQuantity */
  revenue: number | null
  /** revenue − totalCost, nur wenn beides bekannt */
  margin: number | null
  /** Namen der Reagenzien ohne Angebot – erklärt fehlende Kosten */
  missingReagents: string[]
  /** true, wenn das Ergebnis selbst nicht angeboten wird */
  saleUnknown: boolean
}

// ─── Rohform ──────────────────────────────────────────────────────────────────

export interface RawRecipe {
  id?: number
  name?: string
  crafted_item?: { id?: number; name?: string }
  /** Retail führt fraktionsabhängige Ergebnisse */
  alliance_crafted_item?: { id?: number; name?: string }
  horde_crafted_item?: { id?: number; name?: string }
  crafted_quantity?: { value?: number; minimum?: number; maximum?: number }
  reagents?: {
    reagent?: { id?: number; name?: string }
    quantity?: number
  }[]
}

// ─── Auswertung ───────────────────────────────────────────────────────────────

/**
 * Herstellmenge. Die API nennt entweder einen festen Wert oder einen Bereich;
 * bei einem Bereich wird der **untere** genommen – nach oben zu rechnen würde
 * den Gewinn schönen.
 */
export function craftedQuantity(raw: RawRecipe): number {
  const q = raw.crafted_quantity
  if (typeof q?.value === "number" && q.value > 0) return q.value
  if (typeof q?.minimum === "number" && q.minimum > 0) return q.minimum
  return 1
}

export function parseRecipe(raw: RawRecipe | null): RecipeDetail | null {
  if (!raw || typeof raw.id !== "number") return null

  const crafted =
    raw.crafted_item ?? raw.alliance_crafted_item ?? raw.horde_crafted_item ?? null

  const reagents = (raw.reagents ?? [])
    .map((r): Reagent | null => {
      const itemId = r.reagent?.id
      if (typeof itemId !== "number") return null
      return {
        itemId,
        name: r.reagent?.name ?? `Gegenstand ${itemId}`,
        quantity: typeof r.quantity === "number" && r.quantity > 0 ? r.quantity : 1,
      }
    })
    .filter((r): r is Reagent => r !== null)

  return {
    recipeId: raw.id,
    name: raw.name ?? `Rezept ${raw.id}`,
    craftedItemId: typeof crafted?.id === "number" ? crafted.id : null,
    craftedItemName: crafted?.name ?? null,
    craftedQuantity: craftedQuantity(raw),
    reagents,
  }
}

export function computeMargin(
  recipe: RecipeDetail,
  prices: Map<number, PriceEntry>
): MarginRow {
  const costs = recipe.reagents.map((reagent): ReagentCost => {
    const price = prices.get(reagent.itemId)?.minUnitPrice ?? null
    return {
      reagent,
      unitPrice: price,
      total: price === null ? null : price * reagent.quantity,
    }
  })

  const missingReagents = costs
    .filter((c) => c.total === null)
    .map((c) => c.reagent.name)

  // Ohne vollständige Reagenzienliste gibt es keine Kostensumme.
  // Reagenzlose Rezepte (Sammelprozeduren) hätten Kosten 0 – das wäre
  // eine Aussage über den Markt, die hier nicht gemeint ist.
  const totalCost =
    recipe.reagents.length === 0 || missingReagents.length > 0
      ? null
      : costs.reduce((sum, c) => sum + (c.total ?? 0), 0)

  const saleUnitPrice =
    recipe.craftedItemId !== null
      ? prices.get(recipe.craftedItemId)?.minUnitPrice ?? null
      : null

  const revenue =
    saleUnitPrice === null ? null : saleUnitPrice * recipe.craftedQuantity

  return {
    recipeId: recipe.recipeId,
    recipeName: recipe.name,
    craftedItemId: recipe.craftedItemId,
    craftedItemName: recipe.craftedItemName,
    craftedQuantity: recipe.craftedQuantity,
    costs,
    totalCost,
    saleUnitPrice,
    revenue,
    margin:
      totalCost === null || revenue === null ? null : revenue - totalCost,
    missingReagents,
    saleUnknown: saleUnitPrice === null,
  }
}

/**
 * Reihenfolge: bester Gewinn zuerst, danach alles Unvollständige.
 * Ein unbekannter Gewinn ist nicht „null Gewinn" und darf sich nicht
 * zwischen die berechenbaren Zeilen mischen.
 */
export function sortByMargin(rows: MarginRow[]): MarginRow[] {
  return [...rows].sort((a, b) => {
    if (a.margin !== null && b.margin !== null) return b.margin - a.margin
    if (a.margin !== null) return -1
    if (b.margin !== null) return 1
    return a.recipeName.localeCompare(b.recipeName)
  })
}

/** Alle Gegenstands-IDs, für die es Preise braucht. */
export function requiredItemIds(recipes: RecipeDetail[]): number[] {
  const ids = new Set<number>()
  for (const recipe of recipes) {
    if (recipe.craftedItemId !== null) ids.add(recipe.craftedItemId)
    for (const reagent of recipe.reagents) ids.add(reagent.itemId)
  }
  return [...ids]
}

// ─── Abrufe ───────────────────────────────────────────────────────────────────

export async function fetchRecipe(
  recipeId: number,
  token: string,
  mode: GameMode
): Promise<RecipeDetail | null> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(`${API_BASE}/data/wow/recipe/${recipeId}`)
  url.searchParams.set("namespace", config.staticNamespace)
  url.searchParams.set("locale", LOCALE)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: STATIC_REVALIDATE },
  })

  // Ein unbekanntes Rezept ist kein Grund, die ganze Tabelle scheitern
  // zu lassen – die Zeile fällt weg.
  if (!res.ok) return null

  return parseRecipe((await res.json()) as RawRecipe)
}
