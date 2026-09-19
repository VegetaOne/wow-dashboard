import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import {
  resolveConnectedRealm,
  listAuctionHouses,
  getHouseStatuses,
  refreshHouse,
  type AuctionHouse,
} from "@/lib/auction"
import { getT } from "@/lib/t"

/**
 * Der Auktionsabruf ist die grösste Anfrage der ganzen App – bei vollen
 * Realms über zehn Megabyte. Er läuft darum nur auf Anforderung, nie
 * beim Seitenaufruf, und immer nur für ein Haus.
 */
export const maxDuration = 300

function resolveMode(value: unknown): GameMode {
  return (GAME_MODES.find((m) => m.id === value)?.id ?? "retail") as GameMode
}

/** Häuser eines Realms und der Stand ihres letzten Durchlaufs. */
export async function GET(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const realm = req.nextUrl.searchParams.get("realm")
  if (!realm) {
    return NextResponse.json({ error: t("economy.realmMissing") }, { status: 400 })
  }

  const mode = resolveMode(req.nextUrl.searchParams.get("mode"))

  try {
    const connectedRealmId = await resolveConnectedRealm(
      realm,
      session.accessToken,
      mode
    )

    // Die Häuserliste kann fehlen, obwohl der Realm existiert: in Classic Era
    // antworten die Auktionsendpunkte laut Blizzards Forum seit Ende 2024 mit
    // 404. Dann gibt es keine Häuser – und das ist die Auskunft, nicht ein Fehler.
    let houses: AuctionHouse[]
    let housesError: string | null = null
    try {
      houses = await listAuctionHouses(connectedRealmId, session.accessToken, mode)
    } catch (error) {
      houses = []
      housesError =
        error instanceof Error ? error.message : t("economy.housesUnavailable")
    }

    const statuses = await getHouseStatuses(mode, connectedRealmId)

    return NextResponse.json({
      connectedRealmId,
      houses,
      housesError,
      statuses,
    })
  } catch (error) {
    console.error("Fehler beim Auflösen des Auktionshauses:", error)
    return NextResponse.json(
      { error: t("economy.connectedRealmUnresolved") },
      { status: 502 }
    )
  }
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

  const {
    mode: requestedMode,
    connectedRealmId,
    houseId,
    houseName,
  } = (body ?? {}) as {
    mode?: string
    connectedRealmId?: number
    houseId?: number
    houseName?: string
  }

  if (typeof connectedRealmId !== "number" || typeof houseId !== "number") {
    return NextResponse.json(
      { error: t("economy.connectedRealmAndHouseRequired") },
      { status: 400 }
    )
  }

  const mode = resolveMode(requestedMode)

  try {
    const status = await refreshHouse(
      mode,
      connectedRealmId,
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
