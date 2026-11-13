/**
 * Notizen je Charakter – der reine Teil: Form, Grenzen, Bereinigung.
 * Darf in Client-Komponenten; Lesen und Schreiben steht in `note-store.ts`
 * (Paar wie `talent-tree.ts` / `talent-builds.ts`).
 */

/** Eine Notiz ist ein Merkzettel, kein Tagebuch. */
export const NOTE_MAX_LENGTH = 200

/** Gegen versehentliches Fluten, keine Regel für den Inhalt. */
export const NOTES_PER_CHARACTER = 50

export interface CharacterNoteView {
  id: string
  text: string
  done: boolean
}

/**
 * Eingabe bereinigen: Leerraum (auch Zeilenumbrüche) wird zu einem
 * Leerzeichen, eine Notiz ist eine Zeile. Leer oder zu lang → `null`.
 */
export function cleanNoteText(input: unknown): string | null {
  if (typeof input !== "string") return null
  const text = input.replace(/\s+/g, " ").trim()
  if (!text || text.length > NOTE_MAX_LENGTH) return null
  return text
}

/** Offene zuerst, darin in der Reihenfolge des Anheftens. */
export function sortNotes<T extends { done: boolean }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => Number(a.done) - Number(b.done))
}
