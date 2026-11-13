import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { loadConfig, saveConfig } from "@/lib/config"
import { getT } from "@/lib/t"

/**
 * Stufe 2 des Setups: alles, was einen angemeldeten Account voraussetzt.
 *
 * Hier wird zugleich der Besitzer der Instanz festgehalten – der Account,
 * der den Setup abschliesst. Danach ist der Setup gesperrt.
 */
export async function POST(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const config = await loadConfig()
  if (config.setupComplete) {
    return NextResponse.json(
      { error: t("setup.alreadyComplete") },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)

  // Seit WoW Forever gibt es keine Spielmodus-Auswahl mehr
  await saveConfig({
    pollSeconds: Number(body?.pollSeconds) || 60,
    warcraftLogsClientId: String(body?.warcraftLogsClientId ?? ""),
    warcraftLogsSecret: String(body?.warcraftLogsSecret ?? ""),
    ownerBattleTag: session.battleTag,
    markComplete: true,
  })

  return NextResponse.json({ ok: true })
}
