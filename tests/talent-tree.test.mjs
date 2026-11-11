// Tests für das Einlesen der Talentbäume (src/lib/talent-tree.ts).
// Die Rohdaten sind gekürzte Ausschnitte echter Forever-Antworten (2026-11-11).

import { test } from "node:test"
import assert from "node:assert/strict"
import { loadTs } from "./load-ts.mjs"

const { parseTreeIndex, parseSpecTree, allocationFromCharacter, pointsInTree } =
  await loadTs("src/lib/talent-tree.ts")

const rank = (talentId, name, n, description) => ({
  rank: n,
  tooltip: {
    talent: { id: talentId, name },
    spell_tooltip: { spell: { id: talentId + 1, name }, description },
  },
})

// Gleichgewicht, Ausschnitt: zwei Knoten mit gegenseitigem locked_by
const balance = {
  id: 1089,
  playable_class: { id: 11, name: "Druid" },
  playable_specialization: { id: 574, name: "Balance" },
  spec_talent_nodes: [
    { id: 104923, display_row: 1, display_col: 2, ranks: [rank(134384, "Improved Wrath", 2, "b"), rank(134384, "Improved Wrath", 1, "a")] },
    { id: 104927, display_row: 2, display_col: 3, locked_by: [104928], unlocks: [104928], ranks: [rank(500, "Oben", 1, "x"), rank(500, "Oben", 2, "y")] },
    { id: 104928, display_row: 3, display_col: 3, locked_by: [104927], unlocks: [104927], ranks: [rank(501, "Unten", 1, "z")] },
    { id: 999, ranks: [] }, // ohne Position – fällt weg
  ],
}

test("Index: treeId und specId aus dem href", () => {
  const index = parseTreeIndex({
    spec_talent_trees: [
      { key: { href: "https://eu.api.blizzard.com/data/wow/talent-tree/1089/playable-specialization/574?namespace=x" }, name: "Balance" },
      { key: { href: "kaputt" }, name: "?" },
    ],
  })
  assert.deepEqual(index, [{ treeId: 1089, specId: 574, name: "Balance" }])
})

test("Baum: Raster, Ränge sortiert, Knoten ohne Position verworfen", () => {
  const tree = parseSpecTree(balance, 1089, 574)
  assert.equal(tree.name, "Balance")
  assert.equal(tree.nodes.length, 3)
  assert.equal(tree.rows, 3)
  assert.equal(tree.cols, 3)
  const wrath = tree.nodes.find((n) => n.id === 104923)
  assert.equal(wrath.maxRank, 2)
  assert.deepEqual(wrath.ranks.map((r) => r.description), ["a", "b"])
  assert.equal(wrath.talentId, 134384)
})

test("Voraussetzung nur nach oben – gegenseitiges locked_by wird aufgelöst", () => {
  const tree = parseSpecTree(balance, 1089, 574)
  assert.deepEqual(tree.nodes.find((n) => n.id === 104927).requires, [])
  assert.deepEqual(tree.nodes.find((n) => n.id === 104928).requires, [104927])
})

test("Gesetzte Talente: über die Talent-ID, gekappt auf den Höchstrang", () => {
  const tree = parseSpecTree(balance, 1089, 574)
  const { allocation, unmatched, spentByTree } = allocationFromCharacter(
    {
      specialization_groups: [
        { is_active: false, specializations: [{ talents: [{ talent: { id: 134384 }, talent_rank: 1 }] }] },
        {
          is_active: true,
          specializations: [
            {
              specialization: { id: 574 },
              spent_points: 7,
              talents: [
                { talent: { id: 134384 }, talent_rank: 9 },
                { talent: { id: 500 }, talent_rank: 2 },
                { talent: { id: 4242 }, talent_rank: 1 },
              ],
            },
          ],
        },
      ],
    },
    [tree]
  )
  assert.deepEqual(allocation, { 104923: 2, 104927: 2 })
  assert.equal(unmatched, 1)
  assert.deepEqual(spentByTree, { 574: 7 })
  assert.equal(pointsInTree(tree, allocation), 4)
})

test("Ohne Daten: leere Zuteilung statt Fehler", () => {
  const { allocation, unmatched } = allocationFromCharacter(null, [])
  assert.deepEqual(allocation, {})
  assert.equal(unmatched, 0)
})
