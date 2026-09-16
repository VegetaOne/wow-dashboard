import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { getTierCatalog } from "@/lib/professions"

/**
 * Alle Rezepte einer Fertigkeitsstufe – Grundlage für die Fehlliste.
 * Wird erst geholt, wenn eine Stufe aufgeklappt wird.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const professionId = Number.parseInt(params.get("professionId") ?? "", 10)
  const tierId = Number.parseInt(params.get("tierId") ?? "", 10)
  const mode = (GAME_MODES.find((m) => m.id === params.get("mode"))?.id ??
    "retail") as GameMode

  if (!Number.isFinite(professionId) || !Number.isFinite(tierId)) {
    return NextResponse.json(
      { error: "professionId und tierId nötig" },
      { status: 400 }
    )
  }

  const catalog = await getTierCatalog(
    professionId,
    tierId,
    session.accessToken,
    mode
  )

  // Kein Katalog ist kein Fehler: die Classic-Namespaces führen
  // Rezept-Stammdaten nicht durchgängig.
  return NextResponse.json({ catalog })
}
