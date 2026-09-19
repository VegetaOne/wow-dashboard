import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import {
  ALL_GAME_MODES,
  REGIONS,
  isOwner,
  loadConfig,
  saveConfig,
  toView,
  type Language,
} from "@/lib/config"
import type { GameMode } from "@/lib/battlenet"
import { getT } from "@/lib/t"

/**
 * Änderungen an der Konfiguration nach dem Setup.
 *
 * Nur der Besitzer der Instanz darf hier schreiben. Die App läuft je Nutzer
 * in einem eigenen Container – der Besitzer ist der Account, der den Setup
 * abgeschlossen hat.
 *
 * Ein leeres Secret-Feld bedeutet „unverändert", nicht „löschen": die
 * Oberfläche zeigt das Secret nie im Klartext und kann es deshalb auch
 * nicht zurücksenden.
 */
export async function POST(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const config = await loadConfig()
  if (!isOwner(toView(config), session.battleTag)) {
    return NextResponse.json(
      { error: t("settings.ownerOnly") },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: t("core.invalidRequestBody") }, { status: 400 })
  }

  const region = String(body.region ?? config.region).toLowerCase()
  if (!REGIONS.includes(region as (typeof REGIONS)[number])) {
    return NextResponse.json({ error: t("setup.unknownRegion") }, { status: 400 })
  }

  const modes = Array.isArray(body.gameModes)
    ? (body.gameModes as string[]).filter((m): m is GameMode =>
        ALL_GAME_MODES.includes(m as GameMode)
      )
    : config.gameModes

  if (modes.length === 0) {
    return NextResponse.json(
      { error: t("settings.atLeastOneMode") },
      { status: 400 }
    )
  }

  const requestedDefault = String(body.defaultMode ?? config.defaultMode) as GameMode

  const clientId = String(body.bnetClientId ?? "").trim()
  const clientSecret = String(body.bnetClientSecret ?? "").trim()

  // Eine leere Client ID würde den Login lahmlegen – lieber den alten Wert
  // behalten, als die Instanz aussperren.
  if (!clientId) {
    return NextResponse.json(
      { error: t("settings.clientIdRequired") },
      { status: 400 }
    )
  }

  const updated = await saveConfig({
    language: (String(body.language ?? config.language) as Language) === "de" ? "de" : "en",
    region,
    bnetClientId: clientId,
    bnetClientSecret: clientSecret,
    gameModes: modes,
    defaultMode: modes.includes(requestedDefault) ? requestedDefault : modes[0],
    pollSeconds: Number(body.pollSeconds) || config.pollSeconds,
    warcraftLogsClientId: String(body.warcraftLogsClientId ?? ""),
    warcraftLogsSecret: String(body.warcraftLogsSecret ?? ""),
  })

  return NextResponse.json({ ok: true, config: toView(updated) })
}
