/**
 * PvP: Ehrestufe, Schlachtfeld-Statistik und die gewerteten Klassen.
 *
 * Die Wertungen liegen in eigenen Endpunkten je Klasse (2v2, 3v3, RBG).
 * Hat ein Charakter eine Klasse nie gespielt, antwortet der Endpunkt mit
 * 404 – das ist hier kein Fehler, sondern bedeutet „nicht gespielt".
 *
 * WoW Forever: `pvp-summary` liefert laut Community-Tests. Ob es gewertete
 * Klassen gibt, ist nicht belegt – fehlen sie, antworten die Endpunkte mit
 * 404, und das heisst hier wie immer „nicht gespielt".
 */

import { bnetGet, characterPath } from "./battlenet"
import type { TranslationKey } from "./i18n"


/** Die gewerteten Klassen, wie die API sie im Pfad erwartet. */
export const PVP_BRACKETS: { slug: string; labelKey: TranslationKey }[] = [
  { slug: "2v2", labelKey: "pvp.bracket.2v2" },
  { slug: "3v3", labelKey: "pvp.bracket.3v3" },
  { slug: "rbg", labelKey: "pvp.bracket.rbg" },
]

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

function pvpFetch<T>(path: string, token: string): Promise<T> {
  return bnetGet<T>(path, token, "profile", 900)
}

export function fetchPvpSummary(
  slug: string,
  token: string
): Promise<RawPvpSummary> {
  return pvpFetch<RawPvpSummary>(characterPath(slug, "pvp-summary"), token)
}

/**
 * Eine gewertete Klasse. Gibt null zurück, wenn der Endpunkt 404 meldet –
 * das heisst, der Charakter hat diese Klasse nie gespielt.
 */
export async function fetchBracket(
  slug: string,
  bracket: string,
  token: string
): Promise<RawBracket | null> {
  try {
    return await pvpFetch<RawBracket>(
      characterPath(slug, `pvp-bracket/${bracket}`),
      token
    )
  } catch {
    return null
  }
}
