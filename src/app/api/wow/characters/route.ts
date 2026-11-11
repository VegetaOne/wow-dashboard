import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getCharacters, isNotFound } from "@/lib/battlenet"
import { getOrCreateUser, getFavorites } from "@/lib/db"
import { region } from "@/lib/runtime"
import { loadConfig } from "@/lib/config"
import { accountKey, storeSnapshot } from "@/lib/snapshot"

/** Alle Forever-Charaktere des Accounts. */
export async function GET() {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()

  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json(
      { error: t("core.sessionExpired") },
      { status: 401 }
    )
  }

  try {
    const user = await getOrCreateUser(session.battleTag ?? "unknown")
    const favorites = await getFavorites(user.id, region())
    const favoriteSlugs = new Set(favorites.map((f) => f.charSlug))

    const characters = await getCharacters(session.accessToken, favoriteSlugs)

    // Die Liste des Besitzers merken: der Hintergrund-Auffrischer hat kein
    // Nutzertoken und kann sie selbst nicht holen. Nur der Besitzer – andere
    // Accounts, die sich an dieser Instanz anmelden, frischt niemand auf.
    const config = await loadConfig()
    if (config.ownerBattleTag && config.ownerBattleTag === session.battleTag) {
      await storeSnapshot(
        accountKey("owner-characters"),
        characters.map((c) => c.slug)
      ).catch((error) => console.warn("[auffrischer] Liste nicht gespeichert:", error))
    }

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
