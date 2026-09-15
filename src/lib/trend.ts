/**
 * Reine Verlaufs-Rechnerei: Typen, Differenz, Diagramm-Geometrie.
 *
 * Bewusst OHNE Datenbank-Zugriff. `history.ts` liest die Snapshots und
 * braucht dafür Prisma – eine Client-Komponente, die nur die Geometrie
 * benötigt, würde den Prisma-Client sonst ins Browser-Bundle ziehen.
 * Diese Trennung hält beides auseinander und macht die Rechnerei prüfbar.
 */

export interface TrendPoint {
  day: string
  value: number
}

export interface TrendSeries {
  key: string
  label: string
  /** Kurzer Zusatz für die Kopfzeile, z.B. „Punkte" */
  unit?: string
  points: TrendPoint[]
}

export interface TrendDelta {
  first: number
  last: number
  change: number
  /** Anzahl Tage zwischen erstem und letztem Punkt */
  spanDays: number
}

/** Differenz zwischen erstem und letztem Punkt. Null bei unter zwei Punkten. */
export function deltaOf(series: TrendSeries): TrendDelta | null {
  if (series.points.length < 2) return null

  const first = series.points[0]
  const last = series.points[series.points.length - 1]

  const spanDays = Math.max(
    0,
    Math.round(
      (Date.parse(last.day) - Date.parse(first.day)) / (1000 * 60 * 60 * 24)
    )
  )

  return {
    first: first.value,
    last: last.value,
    change: last.value - first.value,
    spanDays,
  }
}

// ─── Geometrie für das Diagramm ───────────────────────────────────────────────

export interface ChartGeometry {
  /** SVG-Pfad der Linie */
  path: string
  /** true, wenn alle Werte gleich sind – dann gibt es keine Spanne */
  flat: boolean
  /** Bildschirmkoordinaten je Punkt, für Marker und Trefferflächen */
  coords: { x: number; y: number; point: TrendPoint }[]
  min: number
  max: number
  /** Gitterlinien auf gerundeten Werten */
  ticks: { value: number; y: number }[]
}

/**
 * Rechnet eine Reihe in Bildschirmkoordinaten um.
 *
 * Bewusst hier und nicht in der Komponente: so lässt sich prüfen, dass
 * kein Punkt aus dem Zeichenbereich fällt und kein NaN im Pfad landet.
 */
export function chartGeometry(
  points: TrendPoint[],
  width: number,
  height: number,
  padding = { top: 8, right: 8, bottom: 8, left: 8 }
): ChartGeometry {
  const usable = points.filter((p) => Number.isFinite(p.value))

  const plotWidth = Math.max(1, width - padding.left - padding.right)
  const plotHeight = Math.max(1, height - padding.top - padding.bottom)

  if (usable.length === 0) {
    return { path: "", coords: [], min: 0, max: 0, ticks: [], flat: true }
  }

  const values = usable.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  const flat = min === max

  // Flache Reihe: Spanne erzeugen, sonst wäre die Division null
  if (flat) {
    const pad = Math.max(1, Math.abs(min) * 0.05)
    min -= pad
    max += pad
  }

  const xFor = (index: number) =>
    usable.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + (index / (usable.length - 1)) * plotWidth

  const yFor = (value: number) =>
    padding.top + plotHeight - ((value - min) / (max - min)) * plotHeight

  const coords = usable.map((point, i) => ({
    x: Math.round(xFor(i) * 100) / 100,
    y: Math.round(yFor(point.value) * 100) / 100,
    point,
  }))

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`)
    .join(" ")

  return {
    path,
    coords,
    min,
    max,
    flat,
    // Bei gleichbleibenden Werten wäre jede Gitterlinie eine erfundene
    // Spanne – und die Beschriftung träfe genau den Endpunkt-Marker.
    ticks: flat ? [] : niceTicks(min, max, yFor),
  }
}

/** Zwei bis drei Gitterlinien auf gerundeten Werten. */
function niceTicks(
  min: number,
  max: number,
  yFor: (value: number) => number
): { value: number; y: number }[] {
  const span = max - min
  if (span <= 0) return []

  const rawStep = span / 2
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const step = Math.max(1, Math.round(rawStep / magnitude) * magnitude)

  const ticks: { value: number; y: number }[] = []
  const start = Math.ceil(min / step) * step

  for (let v = start; v <= max; v += step) {
    ticks.push({ value: v, y: Math.round(yFor(v) * 100) / 100 })
    if (ticks.length >= 4) break
  }

  return ticks
}
