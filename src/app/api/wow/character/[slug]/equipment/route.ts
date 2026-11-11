import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getCharacterEquipment, isCharacterSlug, isNotFound } from "@/lib/battlenet"
import { getT } from "@/lib/t"

/**
 * Ausrüstung eines Forever-Charakters, adressiert über `{name}-{surname}`.
 *
 * Früher `[realm]/[name]` und mit dem statischen `authOptions` – der Pfad
 * war beim Umbau auf `getAuthOptions()` übersehen worden. Beides ist mit der
 * Umstellung auf WoW Forever erledigt.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())

  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const slug = decodeURIComponent(params.slug).toLowerCase()
  if (!isCharacterSlug(slug)) {
    return NextResponse.json({ error: t("core.characterSlugInvalid") }, { status: 400 })
  }

  try {
    const equipment = await getCharacterEquipment(slug, session.accessToken)
    return NextResponse.json(equipment)
  } catch (error) {
    // 404 heisst bei Forever „noch keine Daten" – das an den Client weitergeben
    if (isNotFound(error)) {
      return NextResponse.json({ error: t("core.noDataYet") }, { status: 404 })
    }
    console.error("Fehler beim Laden der Ausrüstung:", error)
    return NextResponse.json(
      { error: t("equipment.loadFailed") },
      { status: 500 }
    )
  }
}
