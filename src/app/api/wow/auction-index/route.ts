import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import {
  listRulesets,
  listAuctionHouses,
  getHouseStatuses,
  refreshHouse,
  type AuctionHouse,
} from "@/lib/auction"
import { getT } from "@/lib/t"

/**
 * Der Auktionsabruf ist die grösste Anfrage der ganzen App – mehrere
 * Megabyte je Haus. Er läuft darum nur auf Anforderung, nie beim
 * Seitenaufruf, und immer nur für ein Haus.
 */
export const maxDuration = 300

/**
 * Häuser der Region und der Stand ihres letzten Durchlaufs.
 *
 * WoW Forever führt Häuser je Ruleset, aber jedes Ruleset liefert dieselben.
 * Gelesen wird darum über das erste Ruleset; welches, ist gleich.
 */
export async function GET() {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  // Fehlt die Häuserliste, ist das die Auskunft, nicht ein Fehler der Seite:
  // die Auktionsendpunkte von Forever sind nicht dokumentiert.
  let rulesetId: number | null = null
  let houses: AuctionHouse[] = []
  let housesError: string | null = null

  try {
    const rulesets = await listRulesets(session.accessToken)
    rulesetId = rulesets[0]?.id ?? null
    if (rulesetId !== null) {
      houses = await listAuctionHouses(rulesetId, session.accessToken)
    }
  } catch (error) {
    housesError =
      error instanceof Error ? error.message : t("economy.housesUnavailable")
  }

  const statuses = await getHouseStatuses()

  return NextResponse.json({ rulesetId, houses, housesError, statuses })
}

/** Ein Haus neu einlesen. */
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

  const { rulesetId, houseId, houseName } = (body ?? {}) as {
    rulesetId?: number
    houseId?: number
    houseName?: string
  }

  if (typeof rulesetId !== "number" || typeof houseId !== "number") {
    return NextResponse.json(
      { error: t("economy.rulesetAndHouseRequired") },
      { status: 400 }
    )
  }

  try {
    const status = await refreshHouse(
      rulesetId,
      { id: houseId, name: houseName ?? t("economy.houseFallbackName", { id: houseId }) },
      session.accessToken
    )
    return NextResponse.json({ status })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t("economy.fetchFailed")
    console.error("Fehler beim Auktionsabruf:", error)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
