import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { isOwner, loadConfig, toView } from "@/lib/config"
import { BnetError, bnetGet, characterPath, isCharacterSlug } from "@/lib/battlenet"
import { getT } from "@/lib/t"

/**
 * Diagnose: liefert die Forever-API Talentbäume?
 *
 * Grundlage für den Entscheid über die Talentbuilds (`docs/reihenfolge.md`,
 * „Talentbuilds"). Ein Community-SDK nennt die Endpunkte, getestet hat sie
 * niemand. Diese Route fragt sie ab und zeigt Status, Felder und einen
 * gekürzten Ausschnitt – keine Auswertung, nur was zurückkommt.
 *
 * Nur für den Besitzer. Wird entfernt, sobald der Entscheid steht.
 *
 * Aufruf: /api/wow/probe/talents?character={name}-{surname}
 */

const SAMPLE_CHARS = 1500

interface ProbeResult {
  name: string
  path: string
  status: number | "error"
  keys?: string[]
  sample?: string
  error?: string
}

async function probe(name: string, path: string, run: () => Promise<unknown>): Promise<ProbeResult> {
  try {
    const data = await run()
    const json = JSON.stringify(data)
    return {
      name,
      path,
      status: 200,
      keys: data && typeof data === "object" ? Object.keys(data as object) : [],
      sample: json.length > SAMPLE_CHARS ? `${json.slice(0, SAMPLE_CHARS)}…` : json,
    }
  } catch (error) {
    if (error instanceof BnetError) return { name, path, status: error.status }
    return {
      name,
      path,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/** Pfad aus einem `href` der API, ohne Host und Query – bnetGet setzt den Namespace selbst. */
function pathFromHref(href: unknown): string | null {
  if (typeof href !== "string") return null
  try {
    return new URL(href).pathname
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken || !session.battleTag) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }
  const config = await loadConfig()
  if (!isOwner(toView(config), session.battleTag)) {
    return NextResponse.json({ error: t("settings.ownerOnly") }, { status: 403 })
  }

  const token = session.accessToken
  const results: ProbeResult[] = []

  // 1. Index der Talentbäume – und, wenn er etwas führt, der erste Baum selbst
  let treeIndex: unknown = null
  results.push(
    await probe("talent-tree index", "/data/wow/talent-tree/index", async () => {
      treeIndex = await bnetGet("/data/wow/talent-tree/index", token, "static", 0)
      return treeIndex
    })
  )

  const index = treeIndex as {
    spec_talent_trees?: { key?: { href?: string } }[]
    class_talent_trees?: { key?: { href?: string } }[]
  } | null
  const firstTree = pathFromHref(
    index?.spec_talent_trees?.[0]?.key?.href ?? index?.class_talent_trees?.[0]?.key?.href
  )
  if (firstTree) {
    results.push(
      await probe("first talent tree", firstTree, () => bnetGet(firstTree, token, "static", 0))
    )
  }

  // 2. Einzelne Talente und Spezialisierungen
  for (const [name, path] of [
    ["talent index", "/data/wow/talent/index"],
    ["playable-specialization index", "/data/wow/playable-specialization/index"],
  ] as const) {
    results.push(await probe(name, path, () => bnetGet(path, token, "static", 0)))
  }

  // 3. Was ein Charakter gesetzt hat
  const character = req.nextUrl.searchParams.get("character")?.toLowerCase() ?? null
  if (character && isCharacterSlug(character)) {
    const path = characterPath(character, "specializations")
    results.push(
      await probe("character specializations", path, () => bnetGet(path, token, "profile", 0))
    )
  }

  return NextResponse.json({ results })
}
