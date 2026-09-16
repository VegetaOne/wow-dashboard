/**
 * Ansehen bei Fraktionen.
 *
 * Die API liefert eine flache Liste ohne Gruppierung nach Erweiterung.
 * Der Aufbau des `standing`-Objekts unterscheidet sich zudem zwischen
 * klassischem Ansehen (Feindselig … Ehrfürchtig mit Punkten innerhalb
 * der Stufe) und Ruf-basierten Fraktionen neuerer Erweiterungen.
 * Beides wird tolerant gelesen; fehlende Felder werden `null`.
 */

import { GAME_MODES, type GameMode } from "./battlenet"
import { apiBase, locale } from "./runtime"


export interface ReputationView {
  factionId: number
  factionName: string
  /** Stufenname wie „Ehrfürchtig" oder „Ruf 20" */
  standingName: string | null
  /** Numerische Stufe, für die Sortierung */
  tier: number | null
  /** Punkte innerhalb der aktuellen Stufe */
  value: number | null
  max: number | null
  /** Paragon-Fortschritt, wenn die Fraktion einen hat */
  paragon: { value: number; max: number } | null
}

export interface RawReputations {
  reputations?: {
    faction?: { id?: number; name?: string }
    standing?: {
      raw?: number
      value?: number
      max?: number
      tier?: number
      name?: string
    }
    paragon?: { value?: number; max?: number }
  }[]
}

export function parseReputations(raw: RawReputations | null): ReputationView[] {
  return (raw?.reputations ?? [])
    .map((r): ReputationView | null => {
      const id = r.faction?.id
      if (typeof id !== "number") return null

      const paragon =
        typeof r.paragon?.value === "number" && typeof r.paragon?.max === "number"
          ? { value: r.paragon.value, max: r.paragon.max }
          : null

      return {
        factionId: id,
        factionName: r.faction?.name ?? `Fraktion ${id}`,
        standingName: r.standing?.name ?? null,
        tier: typeof r.standing?.tier === "number" ? r.standing.tier : null,
        value: typeof r.standing?.value === "number" ? r.standing.value : null,
        max: typeof r.standing?.max === "number" ? r.standing.max : null,
        paragon,
      }
    })
    .filter((r): r is ReputationView => r !== null)
    // Höchste Stufe zuerst – das ist meist das Interessante
    .sort(
      (a, b) =>
        (b.tier ?? -1) - (a.tier ?? -1) ||
        a.factionName.localeCompare(b.factionName)
    )
}

/** Anteil innerhalb der aktuellen Stufe. Null, wenn nicht berechenbar. */
export function tierProgress(rep: ReputationView): number | null {
  if (rep.value === null || rep.max === null || rep.max <= 0) return null
  return Math.min(100, Math.round((rep.value / rep.max) * 100))
}

export async function fetchReputations(
  realm: string,
  name: string,
  token: string,
  mode: GameMode
): Promise<RawReputations> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(
    `${apiBase()}/profile/wow/character/${realm}/${name.toLowerCase()}/reputations`
  )
  url.searchParams.set("namespace", config.namespace)
  url.searchParams.set("locale", locale())

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 900 },
  })
  if (!res.ok) throw new Error(`Ansehen ${res.status}`)
  return res.json() as Promise<RawReputations>
}
