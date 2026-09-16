/**
 * PvP: Ehrestufe, Schlachtfeld-Statistik und die gewerteten Klassen.
 *
 * Die Wertungen liegen in eigenen Endpunkten je Klasse (2v2, 3v3, RBG).
 * Hat ein Charakter eine Klasse nie gespielt, antwortet der Endpunkt mit
 * 404 – das ist hier kein Fehler, sondern bedeutet „nicht gespielt".
 *
 * PvP gibt es nur in Retail sinnvoll; die Classic-Namespaces führen
 * diese Endpunkte nicht durchgängig.
 */

import { GAME_MODES, type GameMode } from "./battlenet"
import { apiBase, locale } from "./runtime"


/** Die gewerteten Klassen, wie die API sie im Pfad erwartet. */
export const PVP_BRACKETS = [
  { slug: "2v2", label: "Arena 2v2" },
  { slug: "3v3", label: "Arena 3v3" },
  { slug: "rbg", label: "Gewertete Schlachtfelder" },
] as const

export interface MatchRecord {
  played: number
  won: number
  lost: number
}

export interface BracketView {
  slug: string
  label: string
  rating: number | null
  season: MatchRecord | null
  weekly: MatchRecord | null
}

export interface MapRecord {
  name: string
  played: number
  won: number
  lost: number
}

export interface PvpSummaryView {
  honorLevel: number | null
  honorableKills: number | null
  maps: MapRecord[]
}

// ─── Rohformen ────────────────────────────────────────────────────────────────

interface RawMatchStats {
  played?: number
  won?: number
  lost?: number
}

export interface RawPvpSummary {
  honor_level?: number
  honorable_kills?: number
  pvp_map_statistics?: {
    world_map?: { name?: string }
    match_statistics?: RawMatchStats
  }[]
}

export interface RawBracket {
  bracket?: { type?: string }
  rating?: number
  season_match_statistics?: RawMatchStats
  weekly_match_statistics?: RawMatchStats
}

// ─── Auswertung ───────────────────────────────────────────────────────────────

function record(raw: RawMatchStats | undefined): MatchRecord | null {
  if (!raw) return null
  const played = typeof raw.played === "number" ? raw.played : null
  if (played === null) return null
  return {
    played,
    won: typeof raw.won === "number" ? raw.won : 0,
    lost: typeof raw.lost === "number" ? raw.lost : 0,
  }
}

export function parsePvpSummary(raw: RawPvpSummary | null): PvpSummaryView {
  const maps = (raw?.pvp_map_statistics ?? [])
    .map((m): MapRecord | null => {
      const name = m.world_map?.name
      const stats = record(m.match_statistics)
      if (!name || !stats) return null
      return { name, ...stats }
    })
    .filter((m): m is MapRecord => m !== null)
    .sort((a, b) => b.played - a.played)

  return {
    honorLevel: typeof raw?.honor_level === "number" ? raw.honor_level : null,
    honorableKills:
      typeof raw?.honorable_kills === "number" ? raw.honorable_kills : null,
    maps,
  }
}

export function parseBracket(
  raw: RawBracket | null,
  slug: string,
  label: string
): BracketView | null {
  if (!raw) return null

  const rating = typeof raw.rating === "number" ? raw.rating : null
  const season = record(raw.season_match_statistics)
  const weekly = record(raw.weekly_match_statistics)

  // Nichts Verwertbares: nicht als leere Zeile zeigen
  if (rating === null && season === null && weekly === null) return null

  return { slug, label, rating, season, weekly }
}

/** Siegquote in Prozent. Null bei keinem Spiel – nicht 0. */
export function winRate(rec: MatchRecord | null): number | null {
  if (!rec || rec.played <= 0) return null
  return Math.round((rec.won / rec.played) * 100)
}

// ─── Abrufe ───────────────────────────────────────────────────────────────────

async function pvpFetch<T>(
  path: string,
  token: string,
  mode: GameMode
): Promise<T> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(`${apiBase()}${path}`)
  url.searchParams.set("namespace", config.namespace)
  url.searchParams.set("locale", locale())

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 900 },
  })
  if (!res.ok) throw new Error(`PvP ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export function fetchPvpSummary(
  realm: string,
  name: string,
  token: string,
  mode: GameMode
): Promise<RawPvpSummary> {
  return pvpFetch<RawPvpSummary>(
    `/profile/wow/character/${realm}/${name.toLowerCase()}/pvp-summary`,
    token,
    mode
  )
}

/**
 * Eine gewertete Klasse. Gibt null zurück, wenn der Endpunkt 404 meldet –
 * das heisst, der Charakter hat diese Klasse nie gespielt.
 */
export async function fetchBracket(
  realm: string,
  name: string,
  bracket: string,
  token: string,
  mode: GameMode
): Promise<RawBracket | null> {
  try {
    return await pvpFetch<RawBracket>(
      `/profile/wow/character/${realm}/${name.toLowerCase()}/pvp-bracket/${bracket}`,
      token,
      mode
    )
  } catch {
    return null
  }
}
