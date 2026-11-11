// Tests für die Reset-Arithmetik in src/lib/reset.ts.
//
// reset.ts ist TypeScript ohne Importe. Node 20 (das Image) kann TS nicht
// direkt laden; darum hier mit dem TypeScript-Compiler aus den
// devDependencies übersetzen und das Ergebnis als Modul laden. Keine
// zusätzliche Abhängigkeit.

import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

const source = readFileSync(new URL("../src/lib/reset.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
})
const dir = mkdtempSync(join(tmpdir(), "reset-test-"))
const file = join(dir, "reset.mjs")
writeFileSync(file, outputText)
const { resetConfig, nextRefreshAt, lastDailyReset, nextDailyReset } = await import(
  pathToFileURL(file).href
)

// Overrides aus der Umgebung würden die Erwartungen verschieben
delete process.env.WOW_RESET_WEEKDAY
delete process.env.WOW_RESET_HOUR_UTC
delete process.env.WOW_DAILY_RESET_HOUR_UTC

const eu = resetConfig("eu")
const us = resetConfig("us")
const iso = (d) => d.toISOString()

test("EU: vor dem Reset gilt der heutige Lauf", () => {
  const now = new Date("2026-11-11T02:00:00Z")
  assert.equal(iso(nextRefreshAt(now, eu)), "2026-11-11T04:15:00.000Z")
})

test("EU: zwischen Reset und Lauf gilt noch der heutige", () => {
  const now = new Date("2026-11-11T04:10:00Z")
  assert.equal(iso(nextRefreshAt(now, eu)), "2026-11-11T04:15:00.000Z")
})

test("EU: genau zur Laufzeit gilt der morgige – kein Doppellauf", () => {
  const now = new Date("2026-11-11T04:15:00Z")
  assert.equal(iso(nextRefreshAt(now, eu)), "2026-11-12T04:15:00.000Z")
})

test("EU: nach dem Lauf gilt der morgige", () => {
  const now = new Date("2026-11-11T18:00:00Z")
  assert.equal(iso(nextRefreshAt(now, eu)), "2026-11-12T04:15:00.000Z")
})

test("US: Tagesreset 15 Uhr UTC", () => {
  const now = new Date("2026-11-11T10:00:00Z")
  assert.equal(iso(nextRefreshAt(now, us)), "2026-11-11T15:15:00.000Z")
})

test("Monatswechsel", () => {
  const now = new Date("2026-11-30T23:00:00Z")
  assert.equal(iso(nextRefreshAt(now, eu)), "2026-12-01T04:15:00.000Z")
})

test("eigener Abstand", () => {
  const now = new Date("2026-11-11T02:00:00Z")
  assert.equal(iso(nextRefreshAt(now, eu, 0)), "2026-11-11T04:00:00.000Z")
})

test("Tagesreset: letzter und nächster liegen einen Tag auseinander", () => {
  const now = new Date("2026-11-11T12:34:00Z")
  assert.equal(iso(lastDailyReset(now, eu)), "2026-11-11T04:00:00.000Z")
  assert.equal(iso(nextDailyReset(now, eu)), "2026-11-12T04:00:00.000Z")
})
