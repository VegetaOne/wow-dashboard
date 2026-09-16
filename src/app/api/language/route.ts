import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { isOwner, loadConfig, saveConfig, toView } from "@/lib/config"
import type { Language } from "@/lib/config-cache"

/**
 * Nur die Sprache umstellen.
 *
 * Eigene Route neben `/api/settings`, aus zwei Gründen: der Umschalter soll
 * schon während der Einrichtung funktionieren – vor dem Login gibt es keine
 * Session, und `/api/settings` verlangt eine –, und er soll nicht die ganze
 * Konfiguration mitschicken müssen, um ein Feld zu ändern.
 *
 * Ist der Setup durch, darf nur noch der Besitzer umstellen: die Sprache
 * gilt für die ganze Instanz, ein Mitnutzer würde sie sonst allen umstellen.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const requested = String(body?.language ?? "")
  if (requested !== "de" && requested !== "en") {
    return NextResponse.json({ error: "Unknown language." }, { status: 400 })
  }

  const config = await loadConfig()

  if (config.setupComplete) {
    const session = await getServerSession(await getAuthOptions())
    if (!session?.battleTag) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 })
    }
    if (!isOwner(toView(config), session.battleTag)) {
      return NextResponse.json(
        { error: "Only the owner of this instance can change the language." },
        { status: 403 }
      )
    }
  }

  const updated = await saveConfig({ language: requested as Language })
  return NextResponse.json({ ok: true, language: updated.language })
}
