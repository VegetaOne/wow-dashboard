import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { GAME_MODES, mapLimit, type GameMode } from "@/lib/battlenet"
import { getPrices } from "@/lib/auction"
import {
  fetchRecipe,
  computeMargin,
  sortByMargin,
  requiredItemIds,
  type RecipeDetail,
  type MarginRow,
} from "@/lib/economy"
import { getT } from "@/lib/t"

/** Rezepte pro Anfrage. Jedes kostet einen Aufruf der Spieldaten-API. */
const MAX_RECIPES = 30
const CONCURRENCY = 6

/**
 * Herstellkosten gegen Verkaufspreis für eine Auswahl an Rezepten.
 *
 * Der Client schickt die Rezept-IDs, die er tatsächlich zeigt – die
 * Rezeptdetails kosten je einen Aufruf, und ein Charakter kann hunderte
 * Rezepte kennen.
 */
export async function POST(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: t("core.invalidRequestBody") }, { status: 400 })
  }

  const {
    mode: requestedMode,
    connectedRealmId,
    houseId,
    recipeIds,
  } = (body ?? {}) as {
    mode?: string
    connectedRealmId?: number
    houseId?: number
    recipeIds?: unknown[]
  }

  if (typeof connectedRealmId !== "number" || typeof houseId !== "number") {
    return NextResponse.json(
      { error: t("economy.connectedRealmAndHouseRequired") },
      { status: 400 }
    )
  }

  const ids = (Array.isArray(recipeIds) ? recipeIds : [])
    .filter((id): id is number => typeof id === "number")
    .slice(0, MAX_RECIPES)

  if (ids.length === 0) {
    return NextResponse.json({ rows: [], unresolved: 0 })
  }

  const mode = (GAME_MODES.find((m) => m.id === requestedMode)?.id ??
    "retail") as GameMode

  try {
    const fetched = await mapLimit(ids, CONCURRENCY, (id) =>
      fetchRecipe(id, session.accessToken!, mode)
    )

    const recipes = fetched.filter((r): r is RecipeDetail => r !== null)
    const prices = await getPrices(
      mode,
      connectedRealmId,
      houseId,
      requiredItemIds(recipes)
    )

    const rows: MarginRow[] = sortByMargin(
      recipes.map((recipe) => computeMargin(recipe, prices))
    )

    return NextResponse.json({
      rows,
      // Rezepte, zu denen die Spieldaten-API keine Details führt.
      // Offen benennen statt stillschweigend weniger Zeilen zeigen.
      unresolved: ids.length - recipes.length,
    })
  } catch (error) {
    console.error("Fehler bei der Wirtschaftsberechnung:", error)
    return NextResponse.json(
      { error: t("economy.calculationFailedApi") },
      { status: 502 }
    )
  }
}
