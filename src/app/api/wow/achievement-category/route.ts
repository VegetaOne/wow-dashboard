import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getCategoryCatalog } from "@/lib/achievements"
import { getT } from "@/lib/t"

/**
 * Alle Erfolge einer Kategorie – Grundlage für die Fehlliste.
 * Wird erst geholt, wenn eine Kategorie aufgeklappt wird.
 */
export async function GET(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const categoryId = Number.parseInt(params.get("categoryId") ?? "", 10)

  if (!Number.isFinite(categoryId)) {
    return NextResponse.json(
      { error: t("achievements.categoryIdRequired") },
      { status: 400 }
    )
  }

  const catalog = await getCategoryCatalog(categoryId, session.accessToken)

  // Kein Katalog ist kein Fehler – dann ist nur keine Fehlliste möglich
  return NextResponse.json({ catalog })
}
