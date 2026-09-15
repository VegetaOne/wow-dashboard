import { prisma } from "./db"
import { listInstances, getInstanceLoot, inventoryTypesForSlot } from "./journal"
import type { GameMode } from "./battlenet"

export interface IndexStatus {
  gameMode: string
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED" | "EMPTY"
  totalInstances: number
  indexedInstances: number
  itemCount: number
  error: string | null
  updatedAt: Date | null
}

const EMPTY_STATUS = (gameMode: string): IndexStatus => ({
  gameMode,
  status: "PENDING",
  totalInstances: 0,
  indexedInstances: 0,
  itemCount: 0,
  error: null,
  updatedAt: null,
})

export async function getIndexStatus(gameMode: GameMode): Promise<IndexStatus> {
  const run = await prisma.lootIndexRun.findUnique({ where: { gameMode } })
  if (!run) return EMPTY_STATUS(gameMode)

  return {
    gameMode: run.gameMode,
    status: run.status as IndexStatus["status"],
    totalInstances: run.totalInstances,
    indexedInstances: run.indexedInstances,
    itemCount: run.itemCount,
    error: run.error,
    updatedAt: run.updatedAt,
  }
}

/**
 * Setzt den Index neu auf: Instanzliste holen, alte Einträge verwerfen.
 * Meldet EMPTY, wenn die Journal-API für diesen Modus nichts liefert –
 * das ist kein Fehler, sondern eine Eigenschaft des Namespaces.
 */
export async function startIndex(
  token: string,
  gameMode: GameMode
): Promise<IndexStatus> {
  const instances = await listInstances(token, gameMode)

  await prisma.lootItem.deleteMany({ where: { gameMode } })

  if (instances.length === 0) {
    await prisma.lootIndexRun.upsert({
      where: { gameMode },
      update: {
        status: "EMPTY",
        totalInstances: 0,
        indexedInstances: 0,
        itemCount: 0,
        pendingInstanceIds: "[]",
        error: "Die Journal-API liefert für diesen Spielmodus keine Instanzen.",
      },
      create: {
        gameMode,
        status: "EMPTY",
        error: "Die Journal-API liefert für diesen Spielmodus keine Instanzen.",
      },
    })
    return getIndexStatus(gameMode)
  }

  const queue = JSON.stringify(instances.map((i) => i.id))

  await prisma.lootIndexRun.upsert({
    where: { gameMode },
    update: {
      status: "RUNNING",
      totalInstances: instances.length,
      indexedInstances: 0,
      itemCount: 0,
      pendingInstanceIds: queue,
      error: null,
      startedAt: new Date(),
    },
    create: {
      gameMode,
      status: "RUNNING",
      totalInstances: instances.length,
      pendingInstanceIds: queue,
    },
  })

  return getIndexStatus(gameMode)
}

/**
 * Arbeitet genau eine Instanz ab. Der Client ruft das in einer Schleife,
 * damit keine Anfrage in einen Timeout läuft und ein Fortschritt sichtbar ist.
 */
export async function indexNextInstance(
  token: string,
  gameMode: GameMode
): Promise<IndexStatus & { justIndexed?: string }> {
  const run = await prisma.lootIndexRun.findUnique({ where: { gameMode } })
  if (!run || run.status !== "RUNNING") {
    return getIndexStatus(gameMode)
  }

  let pending: number[]
  try {
    pending = JSON.parse(run.pendingInstanceIds || "[]")
  } catch {
    pending = []
  }

  if (pending.length === 0) {
    await prisma.lootIndexRun.update({
      where: { gameMode },
      data: { status: "DONE" },
    })
    return getIndexStatus(gameMode)
  }

  const [instanceId, ...rest] = pending

  try {
    const { instanceName, entries } = await getInstanceLoot(
      instanceId,
      token,
      gameMode
    )

    // Dasselbe Item kann in der API mehrfach bei einem Encounter auftauchen.
    // Die Unique-Constraint ist (gameMode, itemId, encounterName) – also
    // vorher entdoppeln. skipDuplicates unterstützt Prisma auf SQLite nicht.
    const seen = new Set<string>()
    const deduped = entries.filter((e) => {
      const key = `${e.itemId}:${e.encounterName}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (deduped.length > 0) {
      // Erst die Zeilen dieser Instanz weg: macht den Schritt wiederholbar,
      // falls ein vorheriger Versuch nach dem Einfügen abgebrochen ist.
      await prisma.lootItem.deleteMany({ where: { gameMode, instanceName } })

      await prisma.lootItem.createMany({
        data: deduped.map((e) => ({
          gameMode,
          itemId: e.itemId,
          name: e.name,
          inventoryType: e.inventoryType,
          itemLevel: e.itemLevel,
          quality: e.quality,
          instanceName: e.instanceName,
          encounterName: e.encounterName,
        })),
      })
    }

    const itemCount = await prisma.lootItem.count({ where: { gameMode } })

    await prisma.lootIndexRun.update({
      where: { gameMode },
      data: {
        pendingInstanceIds: JSON.stringify(rest),
        indexedInstances: run.indexedInstances + 1,
        itemCount,
        status: rest.length === 0 ? "DONE" : "RUNNING",
      },
    })

    return { ...(await getIndexStatus(gameMode)), justIndexed: instanceName }
  } catch (error) {
    // Eine kaputte Instanz soll den ganzen Lauf nicht beenden – überspringen
    console.warn(
      `[loot] Instanz ${instanceId} übersprungen:`,
      error instanceof Error ? error.message : error
    )
    await prisma.lootIndexRun.update({
      where: { gameMode },
      data: {
        pendingInstanceIds: JSON.stringify(rest),
        indexedInstances: run.indexedInstances + 1,
        status: rest.length === 0 ? "DONE" : "RUNNING",
      },
    })
    return getIndexStatus(gameMode)
  }
}

// ─── Kandidaten abfragen ──────────────────────────────────────────────────────

export interface LootCandidate {
  itemId: number
  name: string
  itemLevel: number | null
  quality: string | null
  instanceName: string
  encounterName: string
}

/**
 * Loot-Kandidaten für einen Slot, absteigend nach Gegenstandsstufe.
 *
 * Wichtig: Das ist eine Auflistung dessen, was für den Slot überhaupt
 * droppt – keine DPS-Aussage. Ohne Statgewichte lässt sich nicht sagen,
 * ob ein Item mit höherer Stufe für die Spezialisierung besser ist.
 */
export async function getSlotCandidates(
  gameMode: GameMode,
  slotType: string,
  limit = 8
): Promise<LootCandidate[]> {
  const types = inventoryTypesForSlot(slotType)
  if (types.length === 0) return []

  const rows = await prisma.lootItem.findMany({
    where: { gameMode, inventoryType: { in: types } },
    orderBy: [{ itemLevel: "desc" }, { name: "asc" }],
    take: limit,
  })

  return rows.map((r) => ({
    itemId: r.itemId,
    name: r.name,
    itemLevel: r.itemLevel,
    quality: r.quality,
    instanceName: r.instanceName,
    encounterName: r.encounterName,
  }))
}
