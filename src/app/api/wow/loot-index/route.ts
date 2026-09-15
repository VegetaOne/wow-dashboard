import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { getIndexStatus, startIndex, indexNextInstance } from "@/lib/loot"

function resolveMode(req: NextRequest): GameMode {
  const requested = req.nextUrl.searchParams.get("mode")
  return (GAME_MODES.find((m) => m.id === requested)?.id ?? "retail") as GameMode
}

/** Aktueller Stand des Loot-Index. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  const status = await getIndexStatus(resolveMode(req))
  return NextResponse.json({ status })
}

/**
 * action "start" setzt den Lauf neu auf, "step" arbeitet eine Instanz ab.
 * Gestückelt, damit keine Anfrage in einen Timeout läuft.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  const mode = resolveMode(req)

  let action = "step"
  try {
    const body = await req.json()
    if (typeof body?.action === "string") action = body.action
  } catch {
    // Kein Body: als "step" behandeln
  }

  try {
    const status =
      action === "start"
        ? await startIndex(session.accessToken, mode)
        : await indexNextInstance(session.accessToken, mode)

    return NextResponse.json({ status })
  } catch (error) {
    console.error("Loot-Index fehlgeschlagen:", error)
    return NextResponse.json(
      { error: "Der Index-Lauf ist fehlgeschlagen" },
      { status: 500 }
    )
  }
}
