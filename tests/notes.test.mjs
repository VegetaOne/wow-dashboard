// Tests für den reinen Teil der Charakter-Notizen in src/lib/notes.ts.
//
// notes.ts ist TypeScript ohne Importe – geladen über load-ts.mjs.

import { test } from "node:test"
import assert from "node:assert/strict"
import { loadTs } from "./load-ts.mjs"

const { cleanNoteText, sortNotes, NOTE_MAX_LENGTH } = await loadTs("src/lib/notes.ts")

test("Text wird getrimmt und bleibt sonst unverändert", () => {
  assert.equal(cleanNoteText("  Rezept beim Händler holen  "), "Rezept beim Händler holen")
})

test("Zeilenumbrüche und Mehrfach-Leerraum werden zu einem Leerzeichen", () => {
  assert.equal(cleanNoteText("Ruf\n\nbei   Thorium"), "Ruf bei Thorium")
})

test("Leer oder nur Leerraum ist keine Notiz", () => {
  assert.equal(cleanNoteText(""), null)
  assert.equal(cleanNoteText("   \n\t "), null)
})

test("Kein Text ist keine Notiz", () => {
  assert.equal(cleanNoteText(undefined), null)
  assert.equal(cleanNoteText(42), null)
})

test("Genau an der Grenze geht, ein Zeichen mehr nicht", () => {
  assert.equal(cleanNoteText("x".repeat(NOTE_MAX_LENGTH)), "x".repeat(NOTE_MAX_LENGTH))
  assert.equal(cleanNoteText("x".repeat(NOTE_MAX_LENGTH + 1)), null)
})

test("Die Grenze gilt nach dem Bereinigen, nicht davor", () => {
  const padded = `   ${"x".repeat(NOTE_MAX_LENGTH)}   `
  assert.equal(cleanNoteText(padded), "x".repeat(NOTE_MAX_LENGTH))
})

test("Offene zuerst, darin die Reihenfolge des Anheftens", () => {
  const notes = [
    { id: "a", done: true },
    { id: "b", done: false },
    { id: "c", done: true },
    { id: "d", done: false },
  ]
  assert.deepEqual(sortNotes(notes).map((n) => n.id), ["b", "d", "a", "c"])
})

test("Sortieren verändert die Eingabe nicht", () => {
  const notes = [{ id: "a", done: true }, { id: "b", done: false }]
  sortNotes(notes)
  assert.deepEqual(notes.map((n) => n.id), ["a", "b"])
})
