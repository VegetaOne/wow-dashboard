"use client"

import { useState } from "react"
// Aus trend.ts, nicht history.ts: Letzteres zieht Prisma mit
import type { TrendSeries } from "@/lib/trend"
import { chartGeometry, deltaOf } from "@/lib/trend"
import { useT, useFormat } from "./I18nProvider"

const WIDTH = 640
const HEIGHT = 140
const PADDING = { top: 14, right: 46, bottom: 22, left: 8 }

/**
 * Eine Verlaufslinie mit Kennzahl, Fadenkreuz-Tooltip und Tabellenansicht.
 *
 * Gestaltungsregeln, die hier bewusst eingehalten sind:
 * - Eine Serie je Diagramm, nie zwei Achsen. Mehrere Messgrössen = mehrere
 *   Diagramme; ein zweiter Maßstab im selben Bild wäre irreführend.
 * - 2px-Linie mit runden Enden, Endpunkt-Marker mit 2px-Ring in Flächenfarbe.
 * - Gitter als durchgezogene Haarlinie, zurückgenommen, nie gestrichelt.
 * - Keine Legende: bei einer Serie sagt die Überschrift schon, was gezeigt wird.
 * - Nur der Endpunkt ist beschriftet, nicht jeder Punkt.
 * - Beschriftungen tragen Text-Token, nie die Datenfarbe.
 */
export function TrendChart({ series }: { series: TrendSeries }) {
  const t = useT()
  const f = useFormat()
  const [hover, setHover] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const geo = chartGeometry(series.points, WIDTH, HEIGHT, PADDING)
  const delta = deltaOf(series)
  const last = series.points[series.points.length - 1]

  // Ein einzelner Punkt ist kein Verlauf – das wird gesagt, nicht gezeichnet
  const tooFewPoints = series.points.length < 2

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[13px] font-extrabold uppercase tracking-[0.06em]">
          {series.label}
        </span>

        <span className="flex items-baseline gap-3">
          {last && (
            <span className="font-heading text-[20px] font-extrabold leading-none tracking-[-0.01em]">
              {f.number(last.value)}
            </span>
          )}
          {delta && delta.change !== 0 && (
            <span
              className="font-heading text-[12px] font-extrabold"
              style={{
                color:
                  delta.change > 0
                    ? "var(--faction-alliance)"
                    : "var(--color-accent)",
              }}
            >
              {`${delta.change > 0 ? "+" : ""}${f.number(delta.change)} in ${t.tPlural("core.days", delta.spanDays)}`}
            </span>
          )}
        </span>
      </div>

      {tooFewPoints ? (
        <div className="px-4 py-4 text-[13px] opacity-60">
          {series.points.length === 0
            ? "Noch keine Daten aufgezeichnet."
            : `Bisher nur ein Stand (${f.date(Date.parse(series.points[0].day))}). Ein Verlauf entsteht ab dem zweiten Tag.`}
        </div>
      ) : (
        <>
          <div className="px-2 pt-2">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full"
              role="img"
              aria-label={`${series.label}: ${f.number(geo.min)} bis ${f.number(geo.max)}`}
              onMouseLeave={() => setHover(null)}
            >
              {/* Gitter: Haarlinie, durchgezogen, zurückgenommen */}
              {geo.ticks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={PADDING.left}
                    x2={WIDTH - PADDING.right}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="var(--color-divider)"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                  <text
                    x={WIDTH - PADDING.right + 6}
                    y={tick.y + 3.5}
                    fontSize="10"
                    fill="var(--color-text)"
                    opacity="0.5"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {f.number(tick.value)}
                  </text>
                </g>
              ))}

              {/* Fläche als Wasch, nicht als Block */}
              <path
                d={`${geo.path} L${geo.coords[geo.coords.length - 1].x} ${HEIGHT - PADDING.bottom} L${geo.coords[0].x} ${HEIGHT - PADDING.bottom} Z`}
                fill="var(--faction-alliance)"
                opacity="0.1"
              />

              {/* Linie: 2px, runde Enden */}
              <path
                d={geo.path}
                fill="none"
                stroke="var(--faction-alliance)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Fadenkreuz beim Überfahren */}
              {hover !== null && geo.coords[hover] && (
                <line
                  x1={geo.coords[hover].x}
                  x2={geo.coords[hover].x}
                  y1={PADDING.top}
                  y2={HEIGHT - PADDING.bottom}
                  stroke="var(--color-text)"
                  strokeWidth="1"
                  opacity="0.35"
                />
              )}

              {/* Endpunkt-Marker mit Ring in Flächenfarbe */}
              <circle
                cx={geo.coords[geo.coords.length - 1].x}
                cy={geo.coords[geo.coords.length - 1].y}
                r="4"
                fill="var(--faction-alliance)"
                stroke="var(--color-bg)"
                strokeWidth="2"
              />

              {/* Punkt unter dem Zeiger hervorheben */}
              {hover !== null && geo.coords[hover] && (
                <circle
                  cx={geo.coords[hover].x}
                  cy={geo.coords[hover].y}
                  r="4"
                  fill="var(--faction-alliance)"
                  stroke="var(--color-bg)"
                  strokeWidth="2"
                />
              )}

              {/* Trefferflächen: breiter als die Marker, damit man sie trifft */}
              {geo.coords.map((c, i) => (
                <rect
                  key={c.point.day}
                  x={c.x - (WIDTH - PADDING.left - PADDING.right) / geo.coords.length / 2}
                  y={PADDING.top}
                  width={Math.max(
                    8,
                    (WIDTH - PADDING.left - PADDING.right) / geo.coords.length
                  )}
                  height={HEIGHT - PADDING.top - PADDING.bottom}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
              ))}
            </svg>
          </div>

          {/* Tooltip als HTML unter dem Bild – im SVG wäre er schwer lesbar */}
          <div className="flex min-h-[32px] flex-wrap items-baseline gap-3 px-4 py-1.5">
            {hover !== null && geo.coords[hover] ? (
              <>
                <span className="eyebrow">
                  {f.date(Date.parse(geo.coords[hover].point.day))}
                </span>
                <span className="font-heading text-[13px] font-extrabold">
                  {f.number(geo.coords[hover].point.value)}
                </span>
                {series.unit && <span className="eyebrow">{series.unit}</span>}
              </>
            ) : (
              <span className="eyebrow">
                {`${f.number(series.points.length)} Stände · ${f.date(Date.parse(series.points[0].day))} bis ${f.date(Date.parse(last.day))}`}
              </span>
            )}

            <button
              onClick={() => setShowTable((v) => !v)}
              aria-expanded={showTable}
              className="ml-auto btn btn-ghost text-[12px]"
            >
              {showTable ? "Tabelle ausblenden" : "Als Tabelle"}
            </button>
          </div>

          {/* Tabellenansicht: die Werte sind nie nur im Bild verfügbar */}
          {showTable && (
            <div className="max-h-[240px] overflow-y-auto border-t border-line">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Wert</th>
                    <th>Änderung</th>
                  </tr>
                </thead>
                <tbody>
                  {[...series.points].reverse().map((p, i, arr) => {
                    const prev = arr[i + 1]
                    const change = prev ? p.value - prev.value : null
                    return (
                      <tr key={p.day}>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {f.date(Date.parse(p.day))}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {f.number(p.value)}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {change === null
                            ? "—"
                            : change === 0
                              ? "±0"
                              : `${change > 0 ? "+" : ""}${f.number(change)}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
