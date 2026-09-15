import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getCharacters, GAME_MODES, type GameMode } from "@/lib/battlenet"
import { getOrCreateUser, getFavorites } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json(
      { error: "Session abgelaufen – bitte neu einloggen" },
      { status: 401 }
    )
  }

  const requested = req.nextUrl.searchParams.get("mode")
  const mode = (GAME_MODES.find((m) => m.id === requested)?.id ??
    "retail") as GameMode

  try {
    const user = await getOrCreateUser(session.battleTag ?? "unknown")
    const favorites = await getFavorites(user.id)

    // Favoriten-Key: gameMode:realmSlug:characterName
    const favoriteKeys = new Set(
      favorites.map((f) => `${f.gameMode}:${f.realmSlug}:${f.characterName}`)
    )

    const characters = await getCharacters(session.accessToken, mode, favoriteKeys)

    return NextResponse.json({ characters, mode, userId: user.id })
  } catch (error) {
    console.error("Fehler beim Laden der Charaktere:", error)
    return NextResponse.json(
      { error: "Charaktere konnten nicht geladen werden" },
      { status: 500 }
    )
  }
}
