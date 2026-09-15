import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getCharacterDetails, GAME_MODES, type GameMode } from "@/lib/battlenet"

/** Obergrenze pro Anfrage, damit ein Client nicht den ganzen Account auf einmal zieht. */
const MAX_PER_REQUEST = 40

/**
 * Gegenstandsstufe und Avatar für eine Auswahl an Charakteren.
 * Der Client fragt nur die Realm-Abschnitte an, die er tatsächlich zeigt.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 })
  }

  const { mode: requestedMode, characters } = (body ?? {}) as {
    mode?: string
    characters?: { realm?: string; name?: string }[]
  }

  if (!Array.isArray(characters) || characters.length === 0) {
    return NextResponse.json({ details: {} })
  }

  const mode = (GAME_MODES.find((m) => m.id === requestedMode)?.id ??
    "retail") as GameMode

  const refs = characters
    .filter(
      (c): c is { realm: string; name: string } =>
        typeof c?.realm === "string" && typeof c?.name === "string"
    )
    .slice(0, MAX_PER_REQUEST)

  try {
    const details = await getCharacterDetails(refs, session.accessToken, mode)
    return NextResponse.json({ details })
  } catch (error) {
    console.error("Fehler beim Laden der Charakter-Details:", error)
    return NextResponse.json(
      { error: "Details konnten nicht geladen werden" },
      { status: 500 }
    )
  }
}
