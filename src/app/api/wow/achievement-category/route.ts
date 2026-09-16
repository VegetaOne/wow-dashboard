import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { getCategoryCatalog } from "@/lib/achievements"

/**
 * Alle Erfolge einer Kategorie – Grundlage für die Fehlliste.
 * Wird erst geholt, wenn eine Kategorie aufgeklappt wird.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const categoryId = Number.parseInt(params.get("categoryId") ?? "", 10)
  const mode = (GAME_MODES.find((m) => m.id === params.get("mode"))?.id ??
    "retail") as GameMode

  if (!Number.isFinite(categoryId)) {
    return NextResponse.json({ error: "categoryId nötig" }, { status: 400 })
  }

  const catalog = await getCategoryCatalog(categoryId, session.accessToken, mode)

  // Kein Katalog ist kein Fehler – dann ist nur keine Fehlliste möglich
  return NextResponse.json({ catalog })
}
