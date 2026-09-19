import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { ALL_GAME_MODES, loadConfig, saveConfig } from "@/lib/config"
import type { GameMode } from "@/lib/battlenet"
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

  const modes = Array.isArray(body?.gameModes)
    ? (body.gameModes as string[]).filter((m): m is GameMode =>
        ALL_GAME_MODES.includes(m as GameMode)
      )
    : []

  if (modes.length === 0) {
    return NextResponse.json(
      { error: t("settings.atLeastOneMode") },
      { status: 400 }
    )
  }

  const defaultMode = ALL_GAME_MODES.includes(body?.defaultMode as GameMode)
    ? (body.defaultMode as GameMode)
    : modes[0]

  await saveConfig({
    gameModes: modes,
    // Die Startansicht muss zu den gewählten Modi passen, sonst startet die
    // Kaderliste auf einem Tab, den es nicht gibt.
    defaultMode: modes.includes(defaultMode) ? defaultMode : modes[0],
    pollSeconds: Number(body?.pollSeconds) || 60,
    warcraftLogsClientId: String(body?.warcraftLogsClientId ?? ""),
    warcraftLogsSecret: String(body?.warcraftLogsSecret ?? ""),
    ownerBattleTag: session.battleTag,
    markComplete: true,
  })

  return NextResponse.json({ ok: true })
}
