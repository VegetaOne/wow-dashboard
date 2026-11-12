import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { isCharacterSlug } from "@/lib/battlenet"
import { attempt, specializations } from "@/lib/character"
import { groupsFromCharacter } from "@/lib/talent-tree"

/**
 * Die Talentverteilungen eines eigenen Charakters, als Ausgangspunkt für
 * einen neuen Build im Planer. Läuft über den Snapshot – ein Abruf je Tag.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const slug = (req.nextUrl.searchParams.get("slug") ?? "").toLowerCase()
  if (!isCharacterSlug(slug)) {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }

  const result = await attempt(() => specializations({ slug }, session.accessToken!))
  if (result.notFound) return NextResponse.json({ groups: [], notFound: true })
  return NextResponse.json({
    groups: groupsFromCharacter(result.value ?? null).map(({ index, active, ranks }) => ({ index, active, ranks })),
    stale: result.stale,
  })
}
