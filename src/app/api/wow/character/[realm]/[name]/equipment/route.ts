import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { getCharacterEquipment, GAME_MODES, type GameMode } from "@/lib/battlenet"

export async function GET(
  req: NextRequest,
  { params }: { params: { realm: string; name: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 })
  }

  const requested = req.nextUrl.searchParams.get("mode")
  const mode = (GAME_MODES.find((m) => m.id === requested)?.id ??
    "retail") as GameMode

  try {
    const equipment = await getCharacterEquipment(
      params.realm,
      params.name,
      session.accessToken,
      mode
    )
    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Fehler beim Laden der Ausrüstung:", error)
    return NextResponse.json(
      { error: "Ausrüstung konnte nicht geladen werden" },
      { status: 500 }
    )
  }
}
