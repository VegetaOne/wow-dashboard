import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getOrCreateUser } from "@/lib/db"
import { isCharacterSlug } from "@/lib/battlenet"
import { region } from "@/lib/runtime"
import { setTarget } from "@/lib/talent-builds"

/**
 * Build als Ziel einer Talentverteilung aktivieren (`buildId`) oder das Ziel
 * aufheben (`buildId: null`). Dualspec: `group` 1 oder 2.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()
  if (!session?.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.toLowerCase() : ""
  const group = body?.group
  const buildId = body?.buildId === null ? null : typeof body?.buildId === "string" ? body.buildId : undefined
  if (!isCharacterSlug(slug) || (group !== 1 && group !== 2) || buildId === undefined) {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }

  const user = await getOrCreateUser(session.battleTag)
  const ok = await setTarget(user.id, region(), slug, group, buildId)
  if (!ok) return NextResponse.json({ error: t("planner.buildNotFound") }, { status: 404 })
  return NextResponse.json({ ok: true })
}
