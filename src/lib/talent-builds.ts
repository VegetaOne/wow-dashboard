/**
 * Gespeicherte Talentbuilds und Ziel-Builds je Charakter (Datenbank).
 * Die Regeln und das Format stehen rein in `talent-tree.ts`; hier nur Lesen
 * und Schreiben, immer auf den Nutzer und die Region beschränkt.
 *
 * Geprüft wird hier die Form, nicht der Inhalt gegen die Bäume: die kennt
 * nur die Oberfläche, und ein Build gehört dem, der ihn speichert.
 */

import { prisma } from "./db"
import { cleanRanks, type SavedBuild, type TalentRanks } from "./talent-tree"

/** Obergrenze je Klasse – gegen versehentliches Fluten, nicht als Regel des Spiels */
export const MAX_BUILDS_PER_CLASS = 100

export type { SavedBuild }

function toSaved(row: { id: string; classId: number; name: string; ranks: string; updatedAt: Date }): SavedBuild {
  let ranks: TalentRanks = {}
  try {
    // Tolerant lesen: eine kaputte Zeile ergibt einen leeren Build, keinen Absturz
    ranks = cleanRanks(JSON.parse(row.ranks)) ?? {}
  } catch {
    ranks = {}
  }
  return { id: row.id, classId: row.classId, name: row.name, ranks, updatedAt: row.updatedAt.toISOString() }
}

export async function listBuilds(userId: string, region: string, classId?: number): Promise<SavedBuild[]> {
  const rows = await prisma.talentBuild.findMany({
    where: { userId, region, ...(classId !== undefined ? { classId } : {}) },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
  })
  return rows.map(toSaved)
}

export async function createBuild(
  userId: string,
  region: string,
  classId: number,
  name: string,
  ranks: TalentRanks
): Promise<SavedBuild | "tooMany"> {
  const count = await prisma.talentBuild.count({ where: { userId, region, classId } })
  if (count >= MAX_BUILDS_PER_CLASS) return "tooMany"
  const row = await prisma.talentBuild.create({
    data: { userId, region, classId, name, ranks: JSON.stringify(ranks) },
  })
  return toSaved(row)
}

/** Nur eigene Builds – fremde IDs verhalten sich wie nicht vorhanden. */
export async function updateBuild(
  userId: string,
  region: string,
  id: string,
  change: { name?: string; ranks?: TalentRanks }
): Promise<SavedBuild | null> {
  const owned = await prisma.talentBuild.findFirst({ where: { id, userId, region } })
  if (!owned) return null
  const row = await prisma.talentBuild.update({
    where: { id },
    data: {
      ...(change.name !== undefined ? { name: change.name } : {}),
      ...(change.ranks !== undefined ? { ranks: JSON.stringify(change.ranks) } : {}),
    },
  })
  return toSaved(row)
}

/** Löscht den Build; Ziel-Einträge darauf fallen mit (Cascade). */
export async function deleteBuild(userId: string, region: string, id: string): Promise<boolean> {
  const result = await prisma.talentBuild.deleteMany({ where: { id, userId, region } })
  return result.count > 0
}

/** Ziel-Build je Talentverteilung eines Charakters: Verteilung → Build-ID. */
export async function getTargets(userId: string, region: string, charSlug: string): Promise<Record<number, string>> {
  const rows = await prisma.talentTarget.findMany({ where: { userId, region, charSlug } })
  return Object.fromEntries(rows.map((r) => [r.talentGroup, r.buildId]))
}

/** Ziel setzen oder mit `null` aufheben. Der Build muss dem Nutzer gehören. */
export async function setTarget(
  userId: string,
  region: string,
  charSlug: string,
  talentGroup: number,
  buildId: string | null
): Promise<boolean> {
  const key = { userId_region_charSlug_talentGroup: { userId, region, charSlug, talentGroup } }
  if (buildId === null) {
    await prisma.talentTarget.deleteMany({ where: { userId, region, charSlug, talentGroup } })
    return true
  }
  const owned = await prisma.talentBuild.findFirst({ where: { id: buildId, userId, region } })
  if (!owned) return false
  await prisma.talentTarget.upsert({
    where: key,
    update: { buildId },
    create: { userId, region, charSlug, talentGroup, buildId },
  })
  return true
}
