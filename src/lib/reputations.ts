/**
 * Ansehen bei Fraktionen.
 *
 * Die API liefert eine flache Liste ohne Gruppierung nach Erweiterung.
 * Der Aufbau des `standing`-Objekts unterscheidet sich zudem zwischen
 * klassischem Ansehen (Feindselig … Ehrfürchtig mit Punkten innerhalb
 * der Stufe) und Ruf-basierten Fraktionen neuerer Erweiterungen.
 * Beides wird tolerant gelesen; fehlende Felder werden `null`.
 */

import { bnetGet, characterPath } from "./battlenet"


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

export function fetchReputations(
  slug: string,
  token: string
): Promise<RawReputations> {
  return bnetGet<RawReputations>(characterPath(slug, "reputations"), token, "profile", 900)
}
