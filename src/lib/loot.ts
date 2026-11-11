import { prisma } from "./db"
import { listInstances, getInstanceLoot, inventoryTypesForSlot } from "./journal"
import { region as currentRegion } from "./runtime"

export interface IndexStatus {
  region: string
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED" | "EMPTY"
  totalInstances: number
  indexedInstances: number
  itemCount: number
  error: string | null
  updatedAt: Date | null
}

const EMPTY_STATUS = (region: string): IndexStatus => ({
  region,
  status: "PENDING",
  totalInstances: 0,
  indexedInstances: 0,
  itemCount: 0,
  error: null,
  updatedAt: null,
})

/**
 * Stand des Index der eingestellten Region. Die Region kommt aus der
 * Konfiguration, nicht vom Aufrufer – Stammdaten hängen an ihrem Namespace.
 */
export async function getIndexStatus(): Promise<IndexStatus> {
  const region = currentRegion()
  const run = await prisma.lootIndexRun.findUnique({ where: { region } })
  if (!run) return EMPTY_STATUS(region)

  return {
    region: run.region,
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
 * Meldet EMPTY, wenn die Journal-API nichts liefert – das ist kein Fehler,
 * sondern eine Eigenschaft des Namespaces. Für WoW Forever ist genau das
 * offen: ob die Journal-API dort liefert, ist nicht belegt.
 */
export async function startIndex(token: string): Promise<IndexStatus> {
  const region = currentRegion()
  const instances = await listInstances(token)

  await prisma.lootItem.deleteMany({ where: { region } })

  if (instances.length === 0) {
    await prisma.lootIndexRun.upsert({
      where: { region },
      update: {
        status: "EMPTY",
        totalInstances: 0,
        indexedInstances: 0,
        itemCount: 0,
        pendingInstanceIds: "[]",
        error: "Die Journal-API liefert für WoW Forever keine Instanzen.",
      },
      create: {
        region,
        status: "EMPTY",
        error: "Die Journal-API liefert für WoW Forever keine Instanzen.",
      },
    })
    return getIndexStatus()
  }

  const queue = JSON.stringify(instances.map((i) => i.id))

  await prisma.lootIndexRun.upsert({
    where: { region },
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
      region,
      status: "RUNNING",
      totalInstances: instances.length,
      pendingInstanceIds: queue,
    },
  })

  return getIndexStatus()
}

/**
 * Arbeitet genau eine Instanz ab. Der Client ruft das in einer Schleife,
 * damit keine Anfrage in einen Timeout läuft und ein Fortschritt sichtbar ist.
 */
export async function indexNextInstance(
  token: string
): Promise<IndexStatus & { justIndexed?: string }> {
  const region = currentRegion()
  const run = await prisma.lootIndexRun.findUnique({ where: { region } })
  if (!run || run.status !== "RUNNING") {
    return getIndexStatus()
  }

  let pending: number[]
  try {
    pending = JSON.parse(run.pendingInstanceIds || "[]")
  } catch {
    pending = []
  }

  if (pending.length === 0) {
    await prisma.lootIndexRun.update({
      where: { region },
      data: { status: "DONE" },
    })
    return getIndexStatus()
  }

  const [instanceId, ...rest] = pending

  try {
    const { instanceName, entries } = await getInstanceLoot(
      instanceId,
      token
    )

    // Dasselbe Item kann in der API mehrfach bei einem Encounter auftauchen.
    // Die Unique-Constraint ist (region, itemId, encounterName) – also
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
      await prisma.lootItem.deleteMany({ where: { region, instanceName } })

      await prisma.lootItem.createMany({
        data: deduped.map((e) => ({
          region,
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

    const itemCount = await prisma.lootItem.count({ where: { region } })

    await prisma.lootIndexRun.update({
      where: { region },
      data: {
        pendingInstanceIds: JSON.stringify(rest),
        indexedInstances: run.indexedInstances + 1,
        itemCount,
        status: rest.length === 0 ? "DONE" : "RUNNING",
      },
    })

    return { ...(await getIndexStatus()), justIndexed: instanceName }
  } catch (error) {
    // Eine kaputte Instanz soll den ganzen Lauf nicht beenden – überspringen
    console.warn(
      `[loot] Instanz ${instanceId} übersprungen:`,
      error instanceof Error ? error.message : error
    )
    await prisma.lootIndexRun.update({
      where: { region },
      data: {
        pendingInstanceIds: JSON.stringify(rest),
        indexedInstances: run.indexedInstances + 1,
        status: rest.length === 0 ? "DONE" : "RUNNING",
      },
    })
    return getIndexStatus()
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
  slotType: string,
  limit = 8
): Promise<LootCandidate[]> {
  const types = inventoryTypesForSlot(slotType)
  if (types.length === 0) return []
  const region = currentRegion()

  const rows = await prisma.lootItem.findMany({
    where: { region, inventoryType: { in: types } },
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
