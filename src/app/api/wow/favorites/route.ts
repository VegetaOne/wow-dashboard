import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getOrCreateUser, toggleFavorite } from "@/lib/db"
import { isCharacterSlug } from "@/lib/battlenet"
import { region } from "@/lib/runtime"

export async function POST(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()
  if (!session?.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.toLowerCase() : ""

  if (!isCharacterSlug(slug)) {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }

  // Slugs sind nur je Region eindeutig – der Favorit gilt für die eingestellte
  const user = await getOrCreateUser(session.battleTag)
  const isFavorite = await toggleFavorite(user.id, region(), slug)

  return NextResponse.json({ isFavorite })
}
