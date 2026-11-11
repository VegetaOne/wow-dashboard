/**
 * Snapshot-Schicht: Antworten der Profil-API zwischenspeichern.
 *
 * Drei Gründe, das nicht einfach durchzureichen:
 *
 * 1. Die Profil-API aktualisiert erst, wenn der Charakter ausloggt. Häufiger
 *    als ein paar Minuten abzufragen bringt nachweislich nichts.
 * 2. Ein Companion hat viele Ansichten. Jede bei jedem Aufruf frisch zu holen
 *    wäre langsam und verschwendet Anfragen.
 * 3. Aufbewahrte Stände ergeben den Verlauf – „Gegenstandsstufe diese Woche
 *    von 604 auf 619" kann keine Live-Abfrage beantworten.
 *
 * Fällt die API aus, wird der letzte bekannte Stand zurückgegeben und als
 * veraltet markiert, statt die Ansicht scheitern zu lassen.
 */

import { prisma } from "./db"
import { region } from "./runtime"

/** Bekannte Datensätze. Neue Features tragen sich hier ein. */
export type Dataset =
  | "profile"
  | "equipment"
  | "media"
  | "professions"
  | "collections"
  | "achievements"
  | "raids"
  | "dungeons"
  | "reputations"
  | "titles"
  | "statistics"
  | "pvp"
  | "pvp-brackets"
  /** Welcher Gilde ein Charakter angehört – je Charakter */
  | "character-guild"
  /** Gildengebunden, nicht je Charakter – siehe `guildKey` */
  | "guild"
  | "guild-roster"
  | "guild-activity"
  | "guild-achievements"
  | "specializations"
  | "titles"
  | "toys"
  /** Account-weit, nicht je Charakter */
  | "account-mounts"
  /**
   * Charakterliste des Besitzers – Grundlage der Hintergrund-Auffrischung.
   * Die Liste selbst braucht ein Nutzertoken; der Auffrischer hat keins und
   * nimmt darum den Stand vom letzten Besuch des Besitzers.
   */
  | "owner-characters"
  | "account-pets"

/**
 * Schlüssel eines Datensatzes.
 *
 * Seit der Umstellung auf WoW Forever ist ein Charakter `{name}-{surname}`
 * ohne Realm. Eindeutig ist dieser Slug nur **je Region** – die Region
 * gehört darum in jede Zeile. Sie kommt nicht aus dem Schlüssel, sondern
 * wird beim Lesen und Schreiben aus der Konfiguration genommen
 * (`region()`): so zeigt ein Wechsel der Region nie Stände der alten.
 */
export interface SnapshotKey {
  /** Charakter-Slug, `@account` oder `@guild:<slug>` */
  charSlug: string
  dataset: Dataset
}

/**
 * Platzhalter für account-weite Datensätze. Reittiere und Begleiter
 * hängen am Account, nicht am Charakter – sie nutzen dieselbe Tabelle
 * (und damit dieselbe Historie), nur mit diesem Schlüssel.
 */
export const ACCOUNT_SCOPE = "@account"

export function accountKey(dataset: Dataset): SnapshotKey {
  return { charSlug: ACCOUNT_SCOPE, dataset }
}

/** Schlüssel eines Charakter-Datensatzes. */
export function characterKey(slug: string, dataset: Dataset): SnapshotKey {
  return { charSlug: slug, dataset }
}

/**
 * Schlüssel für gildengebundene Datensätze. Eine Gilde gehört nicht zu einem
 * Charakter – sonst läge dieselbe Mitgliederliste einmal je Gildenmitglied in
 * der Tabelle. Sie nutzt dieselbe Tabelle, nur mit der Gilde im Schlüssel.
 * Forever-Gilden haben wie Charaktere keinen Realm.
 */
export function guildKey(guildSlug: string, dataset: Dataset): SnapshotKey {
  return { charSlug: `@guild:${guildSlug}`, dataset }
}

export interface SnapshotResult<T> {
  data: T
  /** Wann die Daten tatsächlich von der API kamen */
  fetchedAt: Date
  /** true = aus dem Zwischenspeicher, kein API-Aufruf */
  fromCache: boolean
  /** true = die API war nicht erreichbar, das ist der letzte bekannte Stand */
  stale: boolean
}

/** Standard-Frist: die Profil-API ändert sich ohnehin nur beim Ausloggen. */
export const DEFAULT_MAX_AGE_SECONDS = 15 * 60

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface ScopedKey extends SnapshotKey {
  region: string
}

function normalize(key: SnapshotKey): ScopedKey {
  return { ...key, charSlug: key.charSlug.toLowerCase(), region: region() }
}

/** Was wir aus einer gespeicherten Zeile brauchen – entkoppelt von Prismas Typ. */
interface StoredSnapshot {
  day: string
  payload: string
  fetchedAt: Date
}

/** Neuester vorhandener Stand, unabhängig vom Tag. */
async function readLatest(key: SnapshotKey): Promise<StoredSnapshot | null> {
  const k = normalize(key)
  const rows = await prisma.characterSnapshot.findMany({
    where: {
      region: k.region,
      charSlug: k.charSlug,
      dataset: k.dataset,
    },
    orderBy: { day: "desc" },
    take: 1,
  })

  const row = rows[0]
  if (!row) return null
  return { day: row.day, payload: row.payload, fetchedAt: row.fetchedAt }
}

async function write(key: SnapshotKey, payload: unknown): Promise<Date> {
  const k = normalize(key)
  const day = today()
  const fetchedAt = new Date()

  await prisma.characterSnapshot.upsert({
    where: {
      region_charSlug_dataset_day: {
        region: k.region,
        charSlug: k.charSlug,
        dataset: k.dataset,
        day,
      },
    },
    update: { payload: JSON.stringify(payload), fetchedAt },
    create: {
      region: k.region,
      charSlug: k.charSlug,
      dataset: k.dataset,
      day,
      payload: JSON.stringify(payload),
      fetchedAt,
    },
  })

  return fetchedAt
}

/**
 * Liefert den Datensatz aus dem Zwischenspeicher, wenn er frisch genug ist,
 * sonst über `fetcher` – und schreibt das Ergebnis weg.
 *
 * Schlägt `fetcher` fehl und es liegt ein alter Stand vor, wird dieser
 * mit `stale: true` zurückgegeben. Nur wenn beides fehlt, wird geworfen.
 */
export async function withSnapshot<T>(
  key: SnapshotKey,
  fetcher: () => Promise<T>,
  maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS
): Promise<SnapshotResult<T>> {
  let existing: StoredSnapshot | null = null

  try {
    existing = await readLatest(key)
  } catch (error) {
    // Datenbankfehler darf den Abruf nicht verhindern
    console.warn("[snapshot] Lesen fehlgeschlagen:", error)
  }

  if (existing) {
    const ageSeconds = (Date.now() - existing.fetchedAt.getTime()) / 1000
    if (ageSeconds < maxAgeSeconds) {
      try {
        return {
          data: JSON.parse(existing.payload) as T,
          fetchedAt: existing.fetchedAt,
          fromCache: true,
          stale: false,
        }
      } catch {
        // Kaputtes JSON: ignorieren und neu holen
      }
    }
  }

  try {
    const data = await fetcher()
    let fetchedAt = new Date()
    try {
      fetchedAt = await write(key, data)
    } catch (error) {
      console.warn("[snapshot] Schreiben fehlgeschlagen:", error)
    }
    return { data, fetchedAt, fromCache: false, stale: false }
  } catch (fetchError) {
    // API nicht erreichbar – letzter bekannter Stand ist besser als nichts
    if (existing) {
      try {
        return {
          data: JSON.parse(existing.payload) as T,
          fetchedAt: existing.fetchedAt,
          fromCache: true,
          stale: true,
        }
      } catch {
        // fällt unten durch
      }
    }
    throw fetchError
  }
}

/**
 * Einen Stand ohne Abruf ablegen – für Daten, die schon vorliegen (etwa die
 * Charakterliste, die die Startseite ohnehin geholt hat).
 */
export async function storeSnapshot(key: SnapshotKey, payload: unknown): Promise<void> {
  await write(key, payload)
}

/** Neuester Stand eines Datensatzes oder `null`, ohne Abruf. */
export async function latestSnapshot<T>(
  key: SnapshotKey
): Promise<{ data: T; fetchedAt: Date } | null> {
  const row = await readLatest(key)
  if (!row) return null
  try {
    return { data: JSON.parse(row.payload) as T, fetchedAt: row.fetchedAt }
  } catch {
    return null
  }
}

// ─── Verlauf ──────────────────────────────────────────────────────────────────

export interface HistoryEntry<T> {
  day: string
  fetchedAt: Date
  data: T
}

/**
 * Historie eines Datensatzes, älteste zuerst.
 * Grundlage für alles Verlaufsbezogene.
 */
export async function getHistory<T>(
  key: SnapshotKey,
  limitDays = 90
): Promise<HistoryEntry<T>[]> {
  const k = normalize(key)
  const rows = await prisma.characterSnapshot.findMany({
    where: {
      region: k.region,
      charSlug: k.charSlug,
      dataset: k.dataset,
    },
    orderBy: { day: "desc" },
    take: limitDays,
  })

  const entries: HistoryEntry<T>[] = []
  for (const row of rows) {
    try {
      entries.push({
        day: row.day,
        fetchedAt: row.fetchedAt,
        data: JSON.parse(row.payload) as T,
      })
    } catch {
      // kaputte Zeile auslassen
    }
  }

  return entries.reverse()
}

/** Wie viele Stände liegen insgesamt vor – für die Verlaufsansicht. */
export async function countSnapshots(dataset?: Dataset): Promise<number> {
  return prisma.characterSnapshot.count(
    dataset ? { where: { dataset } } : undefined
  )
}
