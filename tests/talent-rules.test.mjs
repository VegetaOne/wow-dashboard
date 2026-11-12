// Tests für die angenommenen Talentregeln, den Vergleich mit dem Spiel, die
// Talentverteilungen (Dualspec) und das JSON-Format (src/lib/talent-tree.ts).

import { test } from "node:test"
import assert from "node:assert/strict"
import { loadTs } from "./load-ts.mjs"

const {
  MAX_POINTS,
  addBlock,
  canRemove,
  ruleIssues,
  groupsFromCharacter,
  allocationFromCharacter,
  allocationFromRanks,
  ranksFromAllocation,
  nodeStatus,
  compareAllocations,
  exportBuild,
  parseBuildImport,
  cleanRanks,
  cleanBuildName,
} = await loadTs("src/lib/talent-tree.ts")

// Kleiner Baum: Zeile 1 zwei Knoten à 5 Ränge, Zeile 2 ein Knoten, der den
// ersten voraussetzt, Zeile 3 ein Knoten ohne Voraussetzung.
const node = (id, row, col, maxRank, requires = [], talentId = id * 10) => ({
  id,
  talentId,
  name: `N${id}`,
  spellId: null,
  icon: null,
  row,
  col,
  maxRank,
  ranks: [],
  requires,
})
const tree = {
  treeId: 1,
  specId: 100,
  name: "A",
  background: null,
  nodes: [node(1, 1, 1, 5), node(2, 1, 2, 5), node(3, 2, 1, 1, [1]), node(4, 3, 2, 3)],
  rows: 3,
  cols: 2,
}
const trees = [tree]
const byId = (id) => tree.nodes.find((n) => n.id === id)

test("Höchststufe 60: 51 Punkte", () => {
  assert.equal(MAX_POINTS, 51)
})

test("Zeile 1 ist frei, Zeile 2 braucht 5 Punkte darüber", () => {
  assert.equal(addBlock(trees, tree, {}, byId(1)), null)
  assert.equal(addBlock(trees, tree, { 2: 4 }, byId(4)), "rowLocked")
  assert.equal(addBlock(trees, tree, { 2: 5 }, byId(3)), "requires")
  assert.equal(addBlock(trees, tree, { 1: 5 }, byId(3)), null)
})

test("Zeile 3 zählt nur Punkte aus den Zeilen darüber", () => {
  // 9 in Zeile 1 + 1 in Zeile 2 = 10 → Zeile 3 offen
  assert.equal(addBlock(trees, tree, { 1: 5, 2: 4, 3: 1 }, byId(4)), null)
  // Punkte in Zeile 3 selbst zählen nicht für Zeile 3
  assert.equal(addBlock(trees, tree, { 1: 5, 2: 4 }, byId(4)), "rowLocked")
})

test("Höchstrang und Punktebudget", () => {
  assert.equal(addBlock(trees, tree, { 1: 5 }, byId(1)), "maxRank")
  // Budget über alle Bäume: ein zweiter Baum mit 51 Punkten
  const other = { ...tree, treeId: 2, specId: 200, nodes: [node(9, 1, 1, 60)] }
  assert.equal(addBlock([tree, other], tree, { 9: 51 }, byId(1)), "noPoints")
})

test("Entfernen: nichts darf in der Luft hängen", () => {
  const alloc = { 1: 5, 3: 1 }
  // Voraussetzung von 3 fiele unter voll
  assert.equal(canRemove(tree, alloc, byId(1)), false)
  assert.equal(canRemove(tree, alloc, byId(3)), true)
  // Zeile 3 verlöre ihre Freischaltung
  assert.equal(canRemove(tree, { 1: 5, 2: 5, 4: 1 }, byId(2)), false)
  assert.equal(canRemove(tree, { 1: 5, 2: 5, 4: 1 }, byId(4)), true)
  assert.equal(canRemove(tree, {}, byId(1)), false)
})

test("Entfernen in einem schon regelwidrigen Build bricht nichts Neues", () => {
  // Aus dem Spiel übernommen: Zeile 3 ohne genug Punkte darüber
  const alloc = { 2: 1, 4: 2 }
  assert.equal(canRemove(tree, alloc, byId(4)), true)
  assert.equal(canRemove(tree, alloc, byId(2)), true)
})

test("Regelbruch wird gemeldet, nicht korrigiert", () => {
  const issues = ruleIssues(trees, { 2: 1, 4: 2, 3: 1 })
  assert.deepEqual(issues.broken.sort(), [3, 4])
  assert.equal(issues.overBudget, 0)
})

test("Dualspec: zwei Verteilungen in der Reihenfolge der API, aktive markiert", () => {
  const raw = {
    specialization_groups: [
      { is_active: false, specializations: [{ specialization: { id: 100 }, spent_points: 5, talents: [{ talent: { id: 10 }, talent_rank: 5 }] }] },
      { is_active: true, specializations: [{ specialization: { id: 100 }, spent_points: 2, talents: [{ talent: { id: 20 }, talent_rank: 2 }, { talent: { id: 99 }, talent_rank: 0 }] }] },
    ],
  }
  const groups = groupsFromCharacter(raw)
  assert.deepEqual(groups.map((g) => [g.index, g.active]), [[1, false], [2, true]])
  assert.deepEqual(groups[0].ranks, { 10: 5 })
  assert.deepEqual(groups[1].ranks, { 20: 2 })
  // Ohne Angabe die aktive, sonst die genannte
  assert.deepEqual(allocationFromCharacter(raw, trees).allocation, { 2: 2 })
  assert.deepEqual(allocationFromCharacter(raw, trees, 1).allocation, { 1: 5 })
  assert.deepEqual(groupsFromCharacter(null), [])
})

test("Talent-IDs ↔ Knoten, Unbekanntes gezählt", () => {
  const { allocation, unmatched } = allocationFromRanks(trees, { 10: 3, 40: 9, 777: 1 })
  assert.deepEqual(allocation, { 1: 3, 4: 3 })
  assert.equal(unmatched, 1)
  assert.deepEqual(ranksFromAllocation(trees, { 1: 3, 2: 0, 4: 3 }), { 10: 3, 40: 3 })
})

test("Vergleich: fehlt, passt, zu viel", () => {
  assert.equal(nodeStatus(0, 3), "todo")
  assert.equal(nodeStatus(1, 3), "todo")
  assert.equal(nodeStatus(3, 3), "done")
  assert.equal(nodeStatus(2, 0), "extra")
  assert.equal(nodeStatus(4, 3), "extra")
  assert.equal(nodeStatus(0, 0), "none")
  assert.deepEqual(compareAllocations(trees, { 1: 2, 2: 3 }, { 1: 5, 3: 1 }), { missing: 4, extra: 3 })
})

test("JSON: Export und Import ergeben denselben Build", () => {
  const json = JSON.stringify(exportBuild({ classId: 11, className: "Druid", name: "  Eule   PvE ", ranks: { 40: 3, 10: 5 } }))
  const back = parseBuildImport(json)
  assert.equal(back.ok, true)
  assert.equal(back.classId, 11)
  assert.equal(back.name, "Eule PvE")
  assert.deepEqual(back.ranks, { 10: 5, 40: 3 })
})

test("JSON: Fremdes und Kaputtes wird abgelehnt", () => {
  assert.deepEqual(parseBuildImport("{"), { ok: false, error: "json" })
  assert.deepEqual(parseBuildImport('{"format":"wowhead"}'), { ok: false, error: "format" })
  assert.deepEqual(
    parseBuildImport('{"format":"wow-dashboard/talent-build","version":2}'),
    { ok: false, error: "version" }
  )
  assert.deepEqual(
    parseBuildImport('{"format":"wow-dashboard/talent-build","version":1,"classId":1,"name":"x","talents":[{"talentId":5,"rank":0}]}'),
    { ok: false, error: "content" }
  )
})

test("Form der Ränge und Namen", () => {
  assert.deepEqual(cleanRanks({ 5: 2 }), { 5: 2 })
  assert.equal(cleanRanks({ "-1": 2 }), null)
  assert.equal(cleanRanks({ 5: 2.5 }), null)
  assert.equal(cleanRanks([1]), null)
  assert.equal(cleanBuildName("   "), null)
  assert.equal(cleanBuildName("x".repeat(80)).length, 60)
})
