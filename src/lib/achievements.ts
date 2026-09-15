/**
 * Erfolge.
 *
 * Besonderheit gegenüber den anderen Datensätzen: die Rohantwort ist
 * gross. Ein Charakter mit tausenden Erfolgen liefert leicht ein bis zwei
 * Megabyte, und bei täglicher Historie über mehrere Charaktere wäre das
 * schnell dreistellig in Megabyte.
 *
 * Deshalb wird hier **vor** dem Ablegen verdichtet: die erreichten Erfolge
 * werden nur als Zahlenliste gespeichert, nicht als Objekte. Für den
 * Abgleich mit einer Kategorie genügt das, und ein Snapshot bleibt bei
 * etwa zehn Kilobyte statt zwei Megabyte.
 *
 * Die Antwort bringt `category_progress` gleich mit – der Fortschritt je
 * Kategorie braucht also keinen eigenen Abruf. Nur die Fehlliste kostet
 * einen, und den erst auf Anforderung.
 */

import { GAME_MODES, type GameMode } from "./battlenet"

const REGION = process.env.BNET_REGION || "eu"
const API_BASE = `https://${REGION}.api.blizzard.com`
const LOCALE = "de_DE"
const STATIC_REVALIDATE = 60 * 60 * 24 * 7

// ─── Verdichtete Form (das, was gespeichert wird) ────────────────────────────

export interface RecentAchievement {
  id: number
  name: string
  at: number | null
}

export interface CategoryProgress {
  id: number
  name: string
  quantity: number
  points: number
}

export interface AchievementSummary {
  totalQuantity: number | null
  totalPoints: number | null
  /** Nur IDs – hält den Snapshot klein */
  earnedIds: number[]
  recent: RecentAchievement[]
  categories: CategoryProgress[]
}

// ─── Rohform ──────────────────────────────────────────────────────────────────

interface RawAchievementEntry {
  id?: number
  achievement?: { id?: number; name?: string }
  completed_timestamp?: number
}

interface RawAchievements {
  total_quantity?: number
  total_points?: number
  achievements?: RawAchievementEntry[]
  category_progress?: {
    category?: { id?: number; name?: string }
    quantity?: number
    points?: number
  }[]
  recent_events?: {
    achievement?: { id?: number; name?: string }
    timestamp?: number
  }[]
}

// ─── Verdichten ───────────────────────────────────────────────────────────────

/**
 * Rohantwort auf die kleine Form bringen. Läuft **vor** dem Speichern,
 * damit nie die volle Antwort in der Datenbank landet.
 */
export function condenseAchievements(raw: unknown): AchievementSummary {
  const data = (raw ?? {}) as RawAchievements

  const earnedIds: number[] = []
  const withTimestamp: RecentAchievement[] = []

  for (const entry of data.achievements ?? []) {
    const id = entry.achievement?.id ?? entry.id
    if (typeof id !== "number") continue
    earnedIds.push(id)

    if (typeof entry.completed_timestamp === "number") {
      withTimestamp.push({
        id,
        name: entry.achievement?.name ?? `Erfolg ${id}`,
        at: entry.completed_timestamp,
      })
    }
  }

  // `recent_events` liefert die API teils mit, teils nicht – sonst
  // erschliessen wir die neuesten aus den Zeitstempeln.
  const fromEvents = (data.recent_events ?? [])
    .map((e): RecentAchievement | null => {
      const id = e.achievement?.id
      if (typeof id !== "number") return null
      return {
        id,
        name: e.achievement?.name ?? `Erfolg ${id}`,
        at: typeof e.timestamp === "number" ? e.timestamp : null,
      }
    })
    .filter((e): e is RecentAchievement => e !== null)

  const recent = (fromEvents.length > 0 ? fromEvents : withTimestamp)
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
    .slice(0, 25)

  const categories = (data.category_progress ?? [])
    .map((c): CategoryProgress | null => {
      const id = c.category?.id
      if (typeof id !== "number") return null
      return {
        id,
        name: c.category?.name ?? `Kategorie ${id}`,
        quantity: typeof c.quantity === "number" ? c.quantity : 0,
        points: typeof c.points === "number" ? c.points : 0,
      }
    })
    .filter((c): c is CategoryProgress => c !== null)
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))

  return {
    totalQuantity:
      typeof data.total_quantity === "number"
        ? data.total_quantity
        : earnedIds.length > 0
          ? earnedIds.length
          : null,
    totalPoints:
      typeof data.total_points === "number" ? data.total_points : null,
    earnedIds,
    recent,
    categories,
  }
}

// ─── Kategorie-Katalog (für die Fehlliste) ───────────────────────────────────

export interface CategoryCatalogEntry {
  id: number
  name: string
  points: number | null
}

export interface CategoryCatalog {
  categoryId: number
  name: string
  achievements: CategoryCatalogEntry[]
  subcategories: { id: number; name: string }[]
}

/**
 * Alle Erfolge einer Kategorie. Ein Aufruf je Kategorie, erst auf
 * Anforderung, eine Woche gecacht.
 */
export async function getCategoryCatalog(
  categoryId: number,
  token: string,
  mode: GameMode
): Promise<CategoryCatalog | null> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(`${API_BASE}/data/wow/achievement-category/${categoryId}`)
  url.searchParams.set("namespace", config.staticNamespace)
  url.searchParams.set("locale", LOCALE)

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: STATIC_REVALIDATE },
    })
    if (!res.ok) return null

    const data = (await res.json()) as {
      id?: number
      name?: string
      achievements?: { id?: number; name?: string; points?: number }[]
      subcategories?: { id?: number; name?: string }[]
    }

    const achievements = (data.achievements ?? [])
      .map((a): CategoryCatalogEntry | null => {
        if (typeof a.id !== "number") return null
        return {
          id: a.id,
          name: a.name ?? `Erfolg ${a.id}`,
          points: typeof a.points === "number" ? a.points : null,
        }
      })
      .filter((a): a is CategoryCatalogEntry => a !== null)
      .sort((a, b) => a.name.localeCompare(b.name))

    const subcategories = (data.subcategories ?? [])
      .map((s) =>
        typeof s.id === "number"
          ? { id: s.id, name: s.name ?? `Kategorie ${s.id}` }
          : null
      )
      .filter((s): s is { id: number; name: string } => s !== null)

    return {
      categoryId,
      name: data.name ?? `Kategorie ${categoryId}`,
      achievements,
      subcategories,
    }
  } catch {
    return null
  }
}

/** Rohabruf der Charakter-Erfolge – wird sofort verdichtet. */
export async function fetchCharacterAchievements(
  realm: string,
  name: string,
  token: string,
  mode: GameMode
): Promise<AchievementSummary> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(
    `${API_BASE}/profile/wow/character/${realm}/${name.toLowerCase()}/achievements`
  )
  url.searchParams.set("namespace", config.namespace)
  url.searchParams.set("locale", LOCALE)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 900 },
  })
  if (!res.ok) throw new Error(`Erfolge ${res.status}`)

  // Direkt verdichten: die volle Antwort soll nie in den Snapshot
  return condenseAchievements(await res.json())
}

// ─── Darstellungs-Helfer ──────────────────────────────────────────────────────

export { formatDate as formatDay } from "./format"
