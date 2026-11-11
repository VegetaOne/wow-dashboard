import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getItemDetails, getItemIcons } from "@/lib/battlenet"

/** Obergrenze, damit ein Client nicht den halben Index durchfragt. */
const MAX_IDS = 12

/**
 * Stammdaten und Icons zu Gegenständen – für Tooltips und Kandidatenlisten.
 * Statische Spieldaten, serverseitig eine Woche gecacht.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(await getAuthOptions())
  const t = await getT()
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const ids = (params.get("ids") ?? "")
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, MAX_IDS)

  if (ids.length === 0) {
    return NextResponse.json({ items: {}, icons: {} })
  }

  try {
    const [items, icons] = await Promise.all([
      getItemDetails(ids, session.accessToken),
      getItemIcons(ids, session.accessToken),
    ])
    return NextResponse.json({ items, icons })
  } catch (error) {
    console.error("Item-Stammdaten fehlgeschlagen:", error)
    return NextResponse.json(
      { error: t("equipment.itemDataLoadFailed") },
      { status: 500 }
    )
  }
}
