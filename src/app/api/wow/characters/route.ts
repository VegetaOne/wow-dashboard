import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getCharacters, isNotFound } from "@/lib/battlenet"
import { getOrCreateUser, getFavorites } from "@/lib/db"
import { region } from "@/lib/runtime"

/** Alle Forever-Charaktere des Accounts. */
export async function GET() {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()

  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  try {
    const user = await getOrCreateUser(session.battleTag ?? "unknown")
    const favorites = await getFavorites(user.id, region())
    const favoriteSlugs = new Set(favorites.map((f) => f.charSlug))

    const characters = await getCharacters(session.accessToken, favoriteSlugs)

    return NextResponse.json({ characters, userId: user.id })
  } catch (error) {
    // Ein Account ohne Forever-Charakter antwortet mit 404 – das ist eine
    // leere Liste, kein Fehler.
    if (isNotFound(error)) {
      return NextResponse.json({ characters: [] })
    }
    console.error("Fehler beim Laden der Charaktere:", error)
    return NextResponse.json(
      { error: t("core.charactersLoadFailed") },
      { status: 500 }
    )
  }
}
