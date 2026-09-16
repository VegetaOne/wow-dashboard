/**
 * Journal-API: Loot-Tabellen aus Raids und Dungeons.
 *
 * Ein vollständiger Durchlauf kostet hunderte Anfragen (Instanzen →
 * Encounter → Item-Details). Deshalb wird er einmal ausgeführt und das
 * Ergebnis in die lokale Datenbank geschrieben, nicht pro Seitenaufruf.
 *
 * Ob die Journal-API für die Classic-Namespaces überhaupt Daten liefert,
 * ist nicht garantiert – alle Funktionen liefern im Zweifel leere Listen
 * statt zu werfen, und der Aufrufer kann das dem Nutzer melden.
 */

import { GAME_MODES, type GameMode } from "./battlenet"
import { apiBase, locale } from "./runtime"


/** Statische Spieldaten – eine Woche Cache ist reichlich konservativ. */
const STATIC_REVALIDATE = 60 * 60 * 24 * 7
const CONCURRENCY = 6

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface JournalInstanceRef {
  id: number
  name: string
}

export interface LootEntry {
  itemId: number
  name: string
  inventoryType: string
  itemLevel: number | null
  quality: string | null
  instanceName: string
  encounterName: string
}

/**
 * Zuordnung der API-Werte (inventory_type) auf die Slots der
 * Ausrüstungsantwort. Ein Typ kann auf mehrere Slots passen.
 */
export const INVENTORY_TYPE_TO_SLOTS: Record<string, string[]> = {
  HEAD: ["HEAD"],
  NECK: ["NECK"],
  SHOULDER: ["SHOULDER"],
  CLOAK: ["BACK"],
  BACK: ["BACK"],
  CHEST: ["CHEST"],
  ROBE: ["CHEST"],
  WRIST: ["WRIST"],
  HAND: ["HANDS"],
  HANDS: ["HANDS"],
  WAIST: ["WAIST"],
  LEGS: ["LEGS"],
  FEET: ["FEET"],
  FINGER: ["FINGER_1", "FINGER_2"],
  TRINKET: ["TRINKET_1", "TRINKET_2"],
  WEAPON: ["MAIN_HAND", "OFF_HAND"],
  WEAPONMAINHAND: ["MAIN_HAND"],
  TWOHWEAPON: ["MAIN_HAND"],
  WEAPONOFFHAND: ["OFF_HAND"],
  SHIELD: ["OFF_HAND"],
  HOLDABLE: ["OFF_HAND"],
  OFFHAND: ["OFF_HAND"],
  // In Classic ein eigener Slot, den die Ausrüstungsantwort nicht führt –
  // wir hängen ihn an die Haupthand, damit er nicht verlorengeht.
  RANGED: ["MAIN_HAND"],
  RANGEDRIGHT: ["MAIN_HAND"],
  THROWN: ["MAIN_HAND"],
}

/** Welche inventory_type-Werte auf einen Ausrüstungsslot passen. */
export function inventoryTypesForSlot(slotType: string): string[] {
  return Object.entries(INVENTORY_TYPE_TO_SLOTS)
    .filter(([, slots]) => slots.includes(slotType))
    .map(([type]) => type)
}

// ─── Fetch-Hilfen ─────────────────────────────────────────────────────────────

async function staticFetch<T>(
  path: string,
  token: string,
  namespace: string
): Promise<T> {
  const url = new URL(`${apiBase()}${path}`)
  url.searchParams.set("namespace", namespace)
  url.searchParams.set("locale", locale())

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: STATIC_REVALIDATE },
  })

  if (!res.ok) {
    throw new Error(`Journal-API ${res.status} (${namespace}): ${path}`)
  }
  return res.json() as Promise<T>
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  )
  return results
}

function namespaceFor(mode: GameMode): string {
  return (GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]).staticNamespace
}

// ─── Journal durchlaufen ──────────────────────────────────────────────────────

/**
 * Alle Instanzen eines Spielmodus. Leere Liste, wenn die Journal-API
 * für diesen Namespace nichts hergibt.
 */
export async function listInstances(
  token: string,
  mode: GameMode
): Promise<JournalInstanceRef[]> {
  try {
    const data = await staticFetch<{
      instances?: { id: number; name: string }[]
    }>("/data/wow/journal-instance/index", token, namespaceFor(mode))

    return (data.instances ?? [])
      .map((i) => ({ id: i.id, name: i.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.warn(
      `[journal] Instanzliste für ${mode} nicht verfügbar:`,
      error instanceof Error ? error.message : error
    )
    return []
  }
}

/** Item-Details: Slot-Typ, Stufe, Qualität. */
async function getItemMeta(
  itemId: number,
  token: string,
  namespace: string
): Promise<{ inventoryType: string; itemLevel: number | null; quality: string | null } | null> {
  try {
    const data = await staticFetch<{
      level?: number
      quality?: { type?: string }
      inventory_type?: { type?: string }
    }>(`/data/wow/item/${itemId}`, token, namespace)

    const inventoryType = data.inventory_type?.type
    if (!inventoryType) return null

    return {
      inventoryType,
      itemLevel: typeof data.level === "number" ? data.level : null,
      quality: data.quality?.type ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Loot einer einzelnen Instanz: alle Encounter, alle Items, mit Slot-Typ.
 * Wird stückweise aufgerufen, damit kein Request in einen Timeout läuft.
 */
export async function getInstanceLoot(
  instanceId: number,
  token: string,
  mode: GameMode
): Promise<{ instanceName: string; entries: LootEntry[] }> {
  const namespace = namespaceFor(mode)

  const instance = await staticFetch<{
    name?: string
    encounters?: { id: number; name: string }[]
  }>(`/data/wow/journal-instance/${instanceId}`, token, namespace)

  const instanceName = instance.name ?? `Instanz ${instanceId}`
  const encounters = instance.encounters ?? []

  const perEncounter = await mapLimit(encounters, CONCURRENCY, async (enc) => {
    try {
      const data = await staticFetch<{
        name?: string
        items?: { item?: { id?: number; name?: string } }[]
      }>(`/data/wow/journal-encounter/${enc.id}`, token, namespace)

      const encounterName = data.name ?? enc.name
      const rawItems = (data.items ?? [])
        .map((entry) => entry.item)
        .filter((i): i is { id: number; name?: string } => typeof i?.id === "number")

      const withMeta = await mapLimit(rawItems, CONCURRENCY, async (item) => {
        const meta = await getItemMeta(item.id, token, namespace)
        // Ohne Slot-Typ ist ein Item für den Vergleich nutzlos (z.B. Materialien)
        if (!meta) return null

        return {
          itemId: item.id,
          name: item.name ?? `Item ${item.id}`,
          inventoryType: meta.inventoryType,
          itemLevel: meta.itemLevel,
          quality: meta.quality,
          instanceName,
          encounterName,
        } satisfies LootEntry
      })

      return withMeta.filter((e): e is LootEntry => e !== null)
    } catch (error) {
      console.warn(
        `[journal] Encounter ${enc.id} übersprungen:`,
        error instanceof Error ? error.message : error
      )
      return [] as LootEntry[]
    }
  })

  return { instanceName, entries: perEncounter.flat() }
}
