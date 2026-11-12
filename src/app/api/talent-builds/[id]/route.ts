import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getOrCreateUser } from "@/lib/db"
import { region } from "@/lib/runtime"
import { deleteBuild, updateBuild } from "@/lib/talent-builds"
import { cleanBuildName, cleanRanks } from "@/lib/talent-tree"

/** Name und/oder Ränge eines eigenen Builds ändern. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()
  if (!session?.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const name = body?.name !== undefined ? cleanBuildName(body.name) : undefined
  const ranks = body?.ranks !== undefined ? cleanRanks(body.ranks) : undefined
  if (name === null || ranks === null || (name === undefined && ranks === undefined)) {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }

  const user = await getOrCreateUser(session.battleTag)
  const build = await updateBuild(user.id, region(), params.id, { name, ranks })
  if (!build) return NextResponse.json({ error: t("planner.buildNotFound") }, { status: 404 })
  return NextResponse.json({ build })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()
  if (!session?.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }
  const user = await getOrCreateUser(session.battleTag)
  const deleted = await deleteBuild(user.id, region(), params.id)
  if (!deleted) return NextResponse.json({ error: t("planner.buildNotFound") }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
