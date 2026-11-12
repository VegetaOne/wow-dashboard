import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getOrCreateUser } from "@/lib/db"
import { region } from "@/lib/runtime"
import { createBuild } from "@/lib/talent-builds"
import { cleanBuildName, cleanRanks } from "@/lib/talent-tree"

/** Neuer Talentbuild – aus dem Planer, aus dem Spiel übernommen oder importiert. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()
  if (!session?.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const classId = body?.classId
  const name = cleanBuildName(body?.name)
  const ranks = cleanRanks(body?.ranks)
  if (typeof classId !== "number" || !Number.isInteger(classId) || classId <= 0 || !name || !ranks) {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }

  const user = await getOrCreateUser(session.battleTag)
  const build = await createBuild(user.id, region(), classId, name, ranks)
  if (build === "tooMany") {
    return NextResponse.json({ error: t("planner.tooManyBuilds") }, { status: 409 })
  }
  return NextResponse.json({ build })
}
