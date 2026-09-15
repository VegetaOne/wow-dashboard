import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getOrCreateUser, toggleFavorite } from "@/lib/db"
import { GAME_MODES } from "@/lib/battlenet"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.battleTag) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  const body = await req.json()
  const { characterName, realmSlug } = body

  if (!characterName || !realmSlug) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
  }

  // gameMode ist optional – ältere Clients schicken ihn nicht mit
  const gameMode = GAME_MODES.find((m) => m.id === body.gameMode)?.id ?? "retail"

  const user = await getOrCreateUser(session.battleTag)
  const isFavorite = await toggleFavorite(
    user.id,
    characterName,
    realmSlug,
    gameMode
  )

  return NextResponse.json({ isFavorite, gameMode })
}
