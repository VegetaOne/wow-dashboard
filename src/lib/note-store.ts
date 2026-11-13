/**
 * Notizen je Charakter (Datenbank). Form und Grenzen stehen rein in
 * `notes.ts`; hier nur Lesen und Schreiben, immer auf den Nutzer beschränkt –
 * Änderungen und Löschen gehen über `updateMany`/`deleteMany` mit `userId`,
 * damit eine fremde ID still ins Leere läuft statt fremde Daten zu treffen.
 */

import { prisma } from "./db"
import { NOTES_PER_CHARACTER, sortNotes, type CharacterNoteView } from "./notes"

const VIEW = { id: true, text: true, done: true } as const

export async function listNotes(userId: string, region: string, charSlug: string): Promise<CharacterNoteView[]> {
  const rows = await prisma.characterNote.findMany({
    where: { userId, region, charSlug },
    orderBy: { createdAt: "asc" },
    select: VIEW,
  })
  return sortNotes(rows)
}

/** `null`, wenn der Charakter schon die Obergrenze an Notizen hat. */
export async function addNote(
  userId: string,
  region: string,
  charSlug: string,
  text: string
): Promise<CharacterNoteView | null> {
  const count = await prisma.characterNote.count({ where: { userId, region, charSlug } })
  if (count >= NOTES_PER_CHARACTER) return null
  return prisma.characterNote.create({ data: { userId, region, charSlug, text }, select: VIEW })
}

/** `false`, wenn es die Notiz nicht (mehr) gibt oder sie einem anderen gehört. */
export async function setNoteDone(userId: string, id: string, done: boolean): Promise<boolean> {
  const result = await prisma.characterNote.updateMany({ where: { id, userId }, data: { done } })
  return result.count > 0
}

export async function deleteNote(userId: string, id: string): Promise<boolean> {
  const result = await prisma.characterNote.deleteMany({ where: { id, userId } })
  return result.count > 0
}
