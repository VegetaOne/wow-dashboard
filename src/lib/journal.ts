/**
 * Journal-API: Loot-Tabellen aus Raids und Dungeons.
 *
 * Ein vollständiger Durchlauf kostet hunderte Anfragen (Instanzen →
 * Encounter → Item-Details). Deshalb wird er einmal ausgeführt und das
 * Ergebnis in die lokale Datenbank geschrieben, nicht pro Seitenaufruf.
 *
 * **Für WoW Forever nicht belegt** (Stand 2026-11-11): es gibt keinen
 * Bericht, dass die Journal-API im Namespace `static-forever-{region}`
 * liefert. Steht auf der Liste „Gestrichen bis bestätigt" in
 * `docs/roadmap.md`. Alle Funktionen liefern im Zweifel leere Listen statt
 * zu werfen, und der Aufrufer meldet das dem Nutzer.
 */

import { bnetGet, mapLimit } from "./battlenet"


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

function staticFetch<T>(path: string, token: string): Promise<T> {
  return bnetGet<T>(path, token, "static", STATIC_REVALIDATE)
}

// ─── Journal durchlaufen ──────────────────────────────────────────────────────

/**
 * Alle Instanzen. Leere Liste, wenn die Journal-API nichts hergibt.
 */
export async function listInstances(token: string): Promise<JournalInstanceRef[]> {
  try {
    const data = await staticFetch<{
      instances?: { id: number; name: string }[]
    }>("/data/wow/journal-instance/index", token)

    return (data.instances ?? [])
      .map((i) => ({ id: i.id, name: i.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.warn(
      "[journal] Instanzliste nicht verfügbar:",
      error instanceof Error ? error.message : error
    )
    return []
  }
}

/** Item-Details: Slot-Typ, Stufe, Qualität. */
async function getItemMeta(
  itemId: number,
  token: string
): Promise<{ inventoryType: string; itemLevel: number | null; quality: string | null } | null> {
  try {
    const data = await staticFetch<{
      level?: number
      quality?: { type?: string }
      inventory_type?: { type?: string }
    }>(`/data/wow/item/${itemId}`, token)

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
  token: string
): Promise<{ instanceName: string; entries: LootEntry[] }> {
  const instance = await staticFetch<{
    name?: string
    encounters?: { id: number; name: string }[]
  }>(`/data/wow/journal-instance/${instanceId}`, token)

  const instanceName = instance.name ?? `Instanz ${instanceId}`
  const encounters = instance.encounters ?? []

  const perEncounter = await mapLimit(encounters, CONCURRENCY, async (enc) => {
    try {
      const data = await staticFetch<{
        name?: string
        items?: { item?: { id?: number; name?: string } }[]
      }>(`/data/wow/journal-encounter/${enc.id}`, token)

      const encounterName = data.name ?? enc.name
      const rawItems = (data.items ?? [])
        .map((entry) => entry.item)
        .filter((i): i is { id: number; name?: string } => typeof i?.id === "number")

      const withMeta = await mapLimit(rawItems, CONCURRENCY, async (item) => {
        const meta = await getItemMeta(item.id, token)
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
