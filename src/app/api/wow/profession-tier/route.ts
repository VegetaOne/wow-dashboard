import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getTierCatalog } from "@/lib/professions"
import { getT } from "@/lib/t"

/**
 * Alle Rezepte einer Fertigkeitsstufe – Grundlage für die Fehlliste.
 * Wird erst geholt, wenn eine Stufe aufgeklappt wird.
 */
export async function GET(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const professionId = Number.parseInt(params.get("professionId") ?? "", 10)
  const tierId = Number.parseInt(params.get("tierId") ?? "", 10)

  if (!Number.isFinite(professionId) || !Number.isFinite(tierId)) {
    return NextResponse.json(
      { error: t("professions.professionAndTierRequired") },
      { status: 400 }
    )
  }

  const catalog = await getTierCatalog(
    professionId,
    tierId,
    session.accessToken
  )

  // Kein Katalog ist kein Fehler: ob Forever Rezept-Stammdaten führt, ist
  // nicht belegt (siehe docs/roadmap.md, „Gestrichen bis bestätigt").
  return NextResponse.json({ catalog })
}
