/**
 * Talentbäume abrufen. Die Formen und das Einlesen stehen in
 * `talent-tree.ts` (rein, auch im Browser nutzbar).
 *
 * Die Bäume sind Spieldaten, keine Charakterdaten – darum kein Snapshot,
 * sondern der Zwischenspeicher von `bnetGet` für einen Tag. Was ein
 * Charakter gesetzt hat, läuft über `specializations()` in character.ts.
 */

import { bnetGet, mapLimit } from "./battlenet"
import {
  parseSpecTree,
  parseTreeIndex,
  type ClassTalents,
  type RawSpecTree,
  type TalentTree,
} from "./talent-tree"

const TREE_REVALIDATE = 60 * 60 * 24
/** Bilder ändern sich praktisch nie – eine Woche */
const MEDIA_REVALIDATE = 60 * 60 * 24 * 7

type RawMedia = { assets?: { key?: string; value?: string }[] }

/**
 * Bild aus einer Medien-Antwort. Bevorzugt der genannte Schlüssel, sonst das
 * erste Bild – die Schlüssel der Baum-Medien sind für Forever nicht belegt.
 */
function assetOf(media: RawMedia | null, preferred: string): string | null {
  const assets = media?.assets ?? []
  const hit = assets.find((a) => a.key === preferred) ?? assets[0]
  return typeof hit?.value === "string" ? hit.value : null
}

/** Pfad aus einem `href` der API, ohne Host und Query. */
function pathFromHref(href: unknown): string | null {
  if (typeof href !== "string") return null
  try {
    return new URL(href).pathname
  } catch {
    return null
  }
}

/**
 * Icons der Talente und Hintergründe der Bäume nachtragen. Fehlt ein Bild,
 * bleibt `null` – die Anzeige zeigt dann den Namen. Ein Bild ist nie ein
 * Grund, die Bäume scheitern zu lassen.
 */
async function attachMedia(trees: TalentTree[], raws: (RawSpecTree | null)[], token: string) {
  const spellIds = Array.from(
    new Set(trees.flatMap((t) => t.nodes.map((n) => n.spellId)).filter((id): id is number => id !== null))
  )
  const icons = new Map<number, string | null>()
  const fetched = await mapLimit(spellIds, 8, (id) =>
    bnetGet<RawMedia>(`/data/wow/media/spell/${id}`, token, "static", MEDIA_REVALIDATE).catch(() => null)
  )
  spellIds.forEach((id, i) => icons.set(id, assetOf(fetched[i], "icon")))

  const backgrounds = await mapLimit(raws, 3, (raw) => {
    const path = pathFromHref(raw?.media?.key?.href)
    return path
      ? bnetGet<RawMedia>(path, token, "static", MEDIA_REVALIDATE).catch(() => null)
      : Promise.resolve(null)
  })

  trees.forEach((tree, i) => {
    tree.background = assetOf(backgrounds[i], "background")
    for (const node of tree.nodes) {
      node.icon = node.spellId !== null ? icons.get(node.spellId) ?? null : null
    }
  })
}

function fetchTree(treeId: number, specId: number, token: string): Promise<RawSpecTree> {
  return bnetGet<RawSpecTree>(
    `/data/wow/talent-tree/${treeId}/playable-specialization/${specId}`,
    token,
    "static",
    TREE_REVALIDATE
  )
}

type IndexEntry = { treeId: number; specId: number; name: string }

/** Index der Bäume, nach `treeId` gruppiert – eine Gruppe ist eine Klasse. */
async function treeGroups(token: string): Promise<Map<number, IndexEntry[]>> {
  const index = parseTreeIndex(
    await bnetGet("/data/wow/talent-tree/index", token, "static", TREE_REVALIDATE)
  )
  const groups = new Map<number, IndexEntry[]>()
  for (const entry of index) {
    const list = groups.get(entry.treeId) ?? []
    list.push(entry)
    groups.set(entry.treeId, list)
  }
  return groups
}

export interface TalentClass {
  classId: number
  className: string
}

/**
 * Alle Klassen mit Talentbäumen, für den Planer. Der Index nennt keine
 * Klasse; je Gruppe wird darum ein Baum gelesen (`playable_class`) – einmal
 * am Tag, danach aus dem Zwischenspeicher. Sortiert nach Klassen-ID, wie
 * das Spiel sie zählt.
 */
export async function listTalentClasses(token: string): Promise<TalentClass[]> {
  const groups = Array.from((await treeGroups(token)).entries())
  const raws = await mapLimit(groups, 4, ([treeId, entries]) =>
    fetchTree(treeId, entries[0].specId, token).catch(() => null)
  )
  const classes = new Map<number, TalentClass>()
  for (const raw of raws) {
    const id = raw?.playable_class?.id
    if (typeof id === "number" && !classes.has(id)) {
      classes.set(id, { classId: id, className: raw?.playable_class?.name ?? `#${id}` })
    }
  }
  return Array.from(classes.values()).sort((a, b) => a.classId - b.classId)
}

/**
 * Die drei Bäume der Klasse eines Charakters.
 *
 * Welche Bäume dazugehören, verrät der Index nicht direkt: er führt nur
 * `treeId` und `specId`. Gesucht wird zuerst über die Spezialisierungen,
 * in denen der Charakter Punkte hat; hat er keine, über die Klasse im Baum
 * selbst (`playable_class`) – dafür je Klasse ein Abruf, zwischengespeichert.
 */
export async function getClassTalents(
  token: string,
  hint: { classId?: number | null; specIds?: number[] }
): Promise<ClassTalents | null> {
  const groups = await treeGroups(token)

  let treeId: number | null = null
  const specIds = new Set(hint.specIds ?? [])
  for (const [id, entries] of groups) {
    if (entries.some((e) => specIds.has(e.specId))) {
      treeId = id
      break
    }
  }

  if (treeId === null && typeof hint.classId === "number") {
    for (const [id, entries] of groups) {
      const raw = await fetchTree(id, entries[0].specId, token).catch(() => null)
      if (raw?.playable_class?.id === hint.classId) {
        treeId = id
        break
      }
    }
  }

  if (treeId === null) return null

  const entries = groups.get(treeId) ?? []
  const raws = await mapLimit(entries, 3, (e) => fetchTree(treeId!, e.specId, token).catch(() => null))
  const parsed = entries.map((e, i) => ({ tree: parseSpecTree(raws[i], treeId!, e.specId), raw: raws[i] }))
  const kept = parsed.filter((p): p is { tree: TalentTree; raw: RawSpecTree | null } => p.tree !== null)
  const trees = kept.map((p) => p.tree)
  await attachMedia(trees, kept.map((p) => p.raw), token)

  const first = raws.find((r) => r?.playable_class)
  return {
    classId: first?.playable_class?.id ?? hint.classId ?? null,
    className: first?.playable_class?.name ?? null,
    trees,
  }
}
