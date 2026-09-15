/**
 * Verlauf: aus den täglichen Snapshots Zahlenreihen gewinnen.
 *
 * Diese Datei ist der Grund, warum die Snapshot-Schicht den Tag im
 * Unique-Key führt. Was hier entsteht, kann keine Live-Abfrage liefern:
 * „Gegenstandsstufe diese Woche von 604 auf 619".
 *
 * Wichtig für die Erwartung: der Verlauf beginnt mit dem ersten Abruf.
 * Bei einem einzigen Datenpunkt gibt es keinen Trend, und das sagt die
 * Oberfläche auch – statt eine Linie durch einen Punkt zu zeichnen.
 */

import { getHistory, type SnapshotKey, type Dataset } from "./snapshot"
import type { GameMode } from "./battlenet"
import { parseProfessions, type RawProfessions } from "./professions"
import { parseProgress, parseMythicProfile, type RawEncounters, type RawMythicProfile } from "./progress"
import type { AchievementSummary } from "./achievements"

import type { TrendPoint, TrendSeries } from "./trend"

// Weiterreichen, damit bestehende Importe aus history.ts weiterarbeiten
export type { TrendPoint, TrendSeries, TrendDelta, ChartGeometry } from "./trend"
export { deltaOf, chartGeometry } from "./trend"

// ─── Reihen aus den gespeicherten Formen gewinnen ────────────────────────────

function key(
  mode: GameMode,
  realm: string,
  name: string,
  dataset: Dataset
): SnapshotKey {
  return { gameMode: mode, realmSlug: realm, charName: name, dataset }
}

/**
 * Alle Verlaufsreihen eines Charakters.
 *
 * Jede Reihe kommt aus einem eigenen Datensatz. Fehlt einer, fehlt die
 * Reihe – die Seite zeigt dann die anderen, statt ganz auszufallen.
 */
export async function characterTrends(
  mode: GameMode,
  realm: string,
  name: string,
  limitDays = 90
): Promise<TrendSeries[]> {
  const series: TrendSeries[] = []

  // ── Gegenstandsstufe ──
  try {
    const rows = await getHistory<{
      equippedItemLevel?: number
      averageItemLevel?: number
    }>(key(mode, realm, name, "profile"), limitDays)

    const equipped: TrendPoint[] = []
    const average: TrendPoint[] = []
    for (const row of rows) {
      if (typeof row.data.equippedItemLevel === "number") {
        equipped.push({ day: row.day, value: row.data.equippedItemLevel })
      }
      if (typeof row.data.averageItemLevel === "number") {
        average.push({ day: row.day, value: row.data.averageItemLevel })
      }
    }

    if (equipped.length > 0) {
      series.push({ key: "ilvl", label: "Gegenstandsstufe angelegt", points: equipped })
    }
    if (average.length > 0) {
      series.push({ key: "ilvl-avg", label: "Gegenstandsstufe Ø inkl. Tasche", points: average })
    }
  } catch {
    // Datensatz fehlt – kein Grund, die Seite scheitern zu lassen
  }

  // ── Erfolge ──
  try {
    const rows = await getHistory<AchievementSummary>(
      key(mode, realm, name, "achievements"),
      limitDays
    )

    const points: TrendPoint[] = []
    const counts: TrendPoint[] = []
    for (const row of rows) {
      if (typeof row.data.totalPoints === "number") {
        points.push({ day: row.day, value: row.data.totalPoints })
      }
      if (typeof row.data.totalQuantity === "number") {
        counts.push({ day: row.day, value: row.data.totalQuantity })
      }
    }

    if (points.length > 0) {
      series.push({ key: "ach-points", label: "Erfolgspunkte", unit: "Punkte", points })
    }
    if (counts.length > 0) {
      series.push({ key: "ach-count", label: "Erfolge", unit: "Erfolge", points: counts })
    }
  } catch {
    /* übersprungen */
  }

  // ── Mythisch+ Wertung ──
  if (mode === "retail") {
    try {
      const rows = await getHistory<RawMythicProfile>(
        key(mode, realm, name, "mythic-keystone"),
        limitDays
      )

      const points: TrendPoint[] = []
      for (const row of rows) {
        const parsed = parseMythicProfile(row.data)
        if (parsed?.currentRating != null) {
          points.push({ day: row.day, value: Math.round(parsed.currentRating) })
        }
      }
      if (points.length > 0) {
        series.push({ key: "mplus", label: "Mythisch+ Wertung", points })
      }
    } catch {
      /* übersprungen */
    }
  }

  // ── Bekannte Rezepte ──
  try {
    const rows = await getHistory<RawProfessions>(
      key(mode, realm, name, "professions"),
      limitDays
    )

    const points: TrendPoint[] = []
    for (const row of rows) {
      const parsed = parseProfessions(row.data)
      const total = parsed.reduce(
        (sum, prof) =>
          sum + prof.tiers.reduce((s, t) => s + t.knownRecipes.length, 0),
        0
      )
      points.push({ day: row.day, value: total })
    }
    if (points.length > 0) {
      series.push({ key: "recipes", label: "Bekannte Rezepte", unit: "Rezepte", points })
    }
  } catch {
    /* übersprungen */
  }

  // ── Bosskills insgesamt ──
  try {
    const rows = await getHistory<RawEncounters>(
      key(mode, realm, name, "raids"),
      limitDays
    )

    const points: TrendPoint[] = []
    for (const row of rows) {
      const parsed = parseProgress(row.data)
      const total = parsed.reduce(
        (sum, exp) =>
          sum +
          exp.instances.reduce(
            (s, inst) =>
              s + inst.modes.reduce((m, mode) => m + mode.completed, 0),
            0
          ),
        0
      )
      points.push({ day: row.day, value: total })
    }
    if (points.length > 0) {
      series.push({ key: "raid-kills", label: "Bosskills insgesamt", points })
    }
  } catch {
    /* übersprungen */
  }

  return series
}

