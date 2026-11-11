import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getCharacterDetails, isCharacterSlug } from "@/lib/battlenet"
import { getT } from "@/lib/t"

/** Obergrenze pro Anfrage, damit ein Client nicht den ganzen Account auf einmal zieht. */
const MAX_PER_REQUEST = 40

/**
 * Gegenstandsstufe und Avatar für eine Auswahl an Charakteren, je Slug.
 * Der Client fragt nur die Abschnitte an, die er tatsächlich zeigt.
 */
export async function POST(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())

  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: t("core.invalidRequestBody") }, { status: 400 })
  }

  const { slugs } = (body ?? {}) as { slugs?: unknown[] }

  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json({ details: {} })
  }

  const refs = slugs
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toLowerCase())
    .filter(isCharacterSlug)
    .slice(0, MAX_PER_REQUEST)

  try {
    const details = await getCharacterDetails(refs, session.accessToken)
    return NextResponse.json({ details })
  } catch (error) {
    console.error("Fehler beim Laden der Charakter-Details:", error)
    return NextResponse.json(
      { error: t("guild.detailsLoadFailed") },
      { status: 500 }
    )
  }
}
