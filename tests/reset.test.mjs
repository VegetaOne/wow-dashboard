// Tests für die Reset-Arithmetik in src/lib/reset.ts.
//
// reset.ts ist TypeScript ohne Importe – geladen über load-ts.mjs.

import { test } from "node:test"
import assert from "node:assert/strict"
import { loadTs } from "./load-ts.mjs"

const { resetConfig, lastDailyReset, nextDailyReset, lastWeeklyReset, nextWeeklyReset } =
  await loadTs("src/lib/reset.ts")

// Overrides aus der Umgebung würden die Erwartungen verschieben
delete process.env.WOW_RESET_WEEKDAY
delete process.env.WOW_RESET_HOUR_UTC
delete process.env.WOW_DAILY_RESET_HOUR_UTC

const eu = resetConfig("eu")
const us = resetConfig("us")
const iso = (d) => d.toISOString()

// 2026-11-11 ist ein Mittwoch. EU: Wochenreset Mittwoch 04:00 UTC, Tagesreset 04:00.
// US: Wochenreset Dienstag 15:00 UTC, Tagesreset 15:00.

test("EU Tagesreset: vor 04:00 gilt noch der gestrige", () => {
  const now = new Date("2026-11-11T02:00:00Z")
  assert.equal(iso(lastDailyReset(now, eu)), "2026-11-10T04:00:00.000Z")
  assert.equal(iso(nextDailyReset(now, eu)), "2026-11-11T04:00:00.000Z")
})

test("EU Tagesreset: tagsüber", () => {
  const now = new Date("2026-11-11T12:34:00Z")
  assert.equal(iso(lastDailyReset(now, eu)), "2026-11-11T04:00:00.000Z")
  assert.equal(iso(nextDailyReset(now, eu)), "2026-11-12T04:00:00.000Z")
})

test("EU Tagesreset: über den Monatswechsel", () => {
  const now = new Date("2026-11-30T23:00:00Z")
  assert.equal(iso(nextDailyReset(now, eu)), "2026-12-01T04:00:00.000Z")
})

test("US Tagesreset: 15 Uhr UTC", () => {
  const now = new Date("2026-11-11T10:00:00Z")
  assert.equal(iso(lastDailyReset(now, us)), "2026-11-10T15:00:00.000Z")
  assert.equal(iso(nextDailyReset(now, us)), "2026-11-11T15:00:00.000Z")
})

test("EU Wochenreset: am Resettag vor 04:00 gilt noch die alte Woche", () => {
  const now = new Date("2026-11-11T02:00:00Z")
  assert.equal(iso(lastWeeklyReset(now, eu)), "2026-11-04T04:00:00.000Z")
  assert.equal(iso(nextWeeklyReset(now, eu)), "2026-11-11T04:00:00.000Z")
})

test("EU Wochenreset: nach 04:00 beginnt die neue Woche", () => {
  const now = new Date("2026-11-11T05:00:00Z")
  assert.equal(iso(lastWeeklyReset(now, eu)), "2026-11-11T04:00:00.000Z")
  assert.equal(iso(nextWeeklyReset(now, eu)), "2026-11-18T04:00:00.000Z")
})

test("US Wochenreset: Dienstag 15 Uhr UTC", () => {
  const now = new Date("2026-11-11T10:00:00Z")
  assert.equal(iso(lastWeeklyReset(now, us)), "2026-11-10T15:00:00.000Z")
  assert.equal(iso(nextWeeklyReset(now, us)), "2026-11-17T15:00:00.000Z")
})
