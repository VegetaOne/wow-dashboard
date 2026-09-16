import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getItemDetails, getItemIcons, GAME_MODES, type GameMode } from "@/lib/battlenet"

/** Obergrenze, damit ein Client nicht den halben Index durchfragt. */
const MAX_IDS = 12

/**
 * Stammdaten und Icons zu Gegenständen – für Tooltips und Kandidatenlisten.
 * Statische Spieldaten, serverseitig eine Woche gecacht.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const mode = (GAME_MODES.find((m) => m.id === params.get("mode"))?.id ??
    "retail") as GameMode

  const ids = (params.get("ids") ?? "")
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, MAX_IDS)

  if (ids.length === 0) {
    return NextResponse.json({ items: {}, icons: {} })
  }

  try {
    const [items, icons] = await Promise.all([
      getItemDetails(ids, session.accessToken, mode),
      getItemIcons(ids, session.accessToken, mode),
    ])
    return NextResponse.json({ items, icons })
  } catch (error) {
    console.error("Item-Stammdaten fehlgeschlagen:", error)
    return NextResponse.json(
      { error: "Gegenstandsdaten konnten nicht geladen werden" },
      { status: 500 }
    )
  }
}
