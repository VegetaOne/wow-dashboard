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

function fetchTree(treeId: number, specId: number, token: string): Promise<RawSpecTree> {
  return bnetGet<RawSpecTree>(
    `/data/wow/talent-tree/${treeId}/playable-specialization/${specId}`,
    token,
    "static",
    TREE_REVALIDATE
  )
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
  const index = parseTreeIndex(
    await bnetGet("/data/wow/talent-tree/index", token, "static", TREE_REVALIDATE)
  )

  const groups = new Map<number, { treeId: number; specId: number; name: string }[]>()
  for (const entry of index) {
    const list = groups.get(entry.treeId) ?? []
    list.push(entry)
    groups.set(entry.treeId, list)
  }

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
  const trees = entries
    .map((e, i) => parseSpecTree(raws[i], treeId!, e.specId))
    .filter((t): t is TalentTree => t !== null)

  const first = raws.find((r) => r?.playable_class)
  return {
    classId: first?.playable_class?.id ?? hint.classId ?? null,
    className: first?.playable_class?.name ?? null,
    trees,
  }
}
