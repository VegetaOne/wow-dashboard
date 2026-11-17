// Tests für den Tooltip-Aufbau in src/lib/item-tooltip.ts.
//
// Die Beispiele haben die Form echter Forever-Antworten (Ausrüstung,
// 2026-11-16), mit erfundenen Namen.

import { test } from "node:test"
import assert from "node:assert/strict"
import { loadTs } from "./load-ts.mjs"

const { buildItemTooltip } = await loadTs("src/lib/item-tooltip.ts")

const texts = (model) => model.lines.map((l) => l.key ?? l.text)

const dagger = {
  name: "Fang of the Demo",
  quality: { type: "RARE" },
  level: { value: 24 },
  binding: { type: "ON_EQUIP", name: "Binds when equipped" },
  unique_equipped: "Unique-Equipped",
  inventory_type: { type: "WEAPON", name: "One-Hand" },
  item_subclass: { name: "Dagger", id: 15 },
  weapon: {
    damage: { display_string: "13 - 26 Damage" },
    attack_speed: { display_string: "Speed 1.60" },
    dps: { display_string: "(12.2 damage per second)" },
  },
  stats: [
    { type: { type: "AGILITY" }, value: 3, display: { display_string: "+3 Agility", color: { r: 255, g: 255, b: 255, a: 1 } } },
    { type: { type: "CRIT" }, value: 5, display: { display_string: "+5 Critical Strike", color: { r: 0, g: 255, b: 0, a: 1 } } },
  ],
  durability: { value: 50, display_string: "Durability 50 / 55" },
  requirements: { level: { value: 19, display_string: "Requires Level 19" } },
  spells: [{ spell: { name: "Poison", id: 1 }, description: "Chance on hit: Poisons target for 2 Nature damage every 1 sec for 10 sec." }],
  sell_price: { value: 12345, display_strings: { header: "Sell Price:", gold: "1", silver: "23", copper: "45" } },
}

test("Waffe: Kopf, Art, Schaden, Werte, Effekt in der Reihenfolge des Spiels", () => {
  assert.deepEqual(texts(buildItemTooltip(dagger)), [
    "equipment.itemLevelValue",
    "Binds when equipped",
    "Unique-Equipped",
    "One-Hand",
    "13 - 26 Damage",
    "(12.2 damage per second)",
    "+3 Agility",
    "+5 Critical Strike",
    "Durability 50 / 55",
    "Requires Level 19",
    "Chance on hit: Poisons target for 2 Nature damage every 1 sec for 10 sec.",
  ])
})

test("Rechtsbündig: Gegenstandsart und Waffengeschwindigkeit", () => {
  const lines = buildItemTooltip(dagger).lines
  assert.equal(lines.find((l) => l.text === "One-Hand").right, "Dagger")
  assert.equal(lines.find((l) => l.text === "13 - 26 Damage").right, "Speed 1.60")
})

test("Effekte sind grün, Farben der API haben Vorrang, Weiss fällt weg", () => {
  const lines = buildItemTooltip(dagger).lines
  assert.equal(lines.find((l) => l.text.startsWith("Chance on hit")).tone, "green")
  assert.equal(lines.find((l) => l.text === "+5 Critical Strike").color, "rgb(0, 255, 0)")
  assert.equal(lines.find((l) => l.text === "+3 Agility").color, undefined)
})

test("Verkaufspreis wird in Gold, Silber und Kupfer zerlegt", () => {
  assert.deepEqual(buildItemTooltip(dagger).price, { header: "Sell Price:", gold: 1, silver: 23, copper: 45 })
})

test("Versteckte Gegenstandsart erscheint nicht", () => {
  const cloth = {
    inventory_type: { name: "Shoulder" },
    item_subclass: { name: "Cloth" },
    is_subclass_hidden: true,
  }
  const line = buildItemTooltip(cloth).lines.find((l) => l.text === "Shoulder")
  assert.equal(line.right, undefined)
})

test("Leerer Sockel wird übersetzt, gefüllter nennt den Stein", () => {
  const lines = buildItemTooltip({
    sockets: [{ socket_type: { type: "RED" } }, { socket_type: { type: "BLUE" }, item: { name: "Demo Gem" }, display_string: "+4 Stamina" }],
  }).lines
  assert.equal(lines[0].key, "equipment.emptySocket")
  assert.equal(lines[0].socket, "empty")
  assert.equal(lines[1].text, "Demo Gem – +4 Stamina")
  assert.equal(lines[1].socket, "filled")
})

test("Set: Name, Teile nach angelegt, Boni nach aktiv", () => {
  const lines = buildItemTooltip({
    set: {
      display_string: "Demo Regalia (1/3)",
      items: [{ item: { name: "Demo Hood" }, is_equipped: true }, { item: { name: "Demo Robe" } }],
      effects: [{ display_string: "(2) Set: +10 Spell Power", required_count: 2 }],
    },
  }).lines
  assert.deepEqual(lines.map((l) => [l.text.trim(), l.tone]), [
    ["Demo Regalia (1/3)", "gold"],
    ["Demo Hood", "plain"],
    ["Demo Robe", "dim"],
    ["(2) Set: +10 Spell Power", "dim"],
  ])
})

test("Ein unwirksamer Wert wird grau statt in seiner Farbe gezeigt", () => {
  const line = buildItemTooltip({
    stats: [{ display: { display_string: "+7 Intellect", color: { r: 0, g: 255, b: 0 } }, is_negated: true }],
  }).lines[0]
  assert.equal(line.tone, "dim")
  assert.equal(line.color, undefined)
})

test("Leere oder kaputte Antworten ergeben keine Zeilen und keinen Preis", () => {
  for (const raw of [null, undefined, {}, { stats: "kaputt", spells: [null], sell_price: { value: 0 } }]) {
    const model = buildItemTooltip(raw)
    assert.deepEqual(model.lines, [])
    assert.equal(model.price, null)
  }
})

test("Neue Abschnitte bekommen Abstand, der erste nie", () => {
  const lines = buildItemTooltip(dagger).lines
  assert.equal(lines[0].gap, undefined)
  assert.equal(lines.find((l) => l.text.startsWith("Durability")).gap, true)
  assert.equal(lines.find((l) => l.text.startsWith("Chance on hit")).gap, true)
})
