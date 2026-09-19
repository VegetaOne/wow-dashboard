"use client"

import { useEffect, useState } from "react"
import type { ItemDetails } from "@/lib/battlenet"
import { QUALITY_COLORS, qualityLabelKey } from "@/lib/battlenet"
import { useT } from "./I18nProvider"

export interface CandidateTarget {
  itemId: number
  fallbackName: string
  slotName: string
  source: string
  /** Stufe des aktuell angelegten Gegenstands, für den Vergleich */
  equippedLevel: number | null
  equippedName: string | null
  x: number
  y: number
}

/**
 * Tooltip für einen Loot-Kandidaten. Lädt die Stammdaten beim ersten
 * Überfahren und behält sie – Gegenstandsdaten ändern sich nicht.
 *
 * Der Wertevergleich gegen das angelegte Teil ist die eigentlich nützliche
 * Information hier, und er braucht keine Statgewichte: die Differenz je
 * Wert ist eine Tatsache, die Bewertung überlassen wir dem Leser.
 */
export function CandidateTooltip({
  target,
  mode,
  cache,
  onLoaded,
}: {
  target: CandidateTarget | null
  mode: string
  cache: Record<number, ItemDetails>
  onLoaded: (items: Record<number, ItemDetails>) => void
}) {
  const t = useT()
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const itemId = target?.itemId
  const known = itemId !== undefined ? cache[itemId] : undefined

  useEffect(() => {
    if (itemId === undefined || known || loading) return

    let active = true
    setLoading(true)

    fetch(`/api/wow/item?ids=${itemId}&mode=${mode}`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data.items) onLoaded(data.items)
      })
      .catch(() => {
        // Tooltip zeigt dann nur die Basisangaben
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, known, mode])

  if (!target) return null

  const quality = known?.quality ?? "COMMON"
  const qualityKey = qualityLabelKey(quality)
  const color = QUALITY_COLORS[quality] ?? "#FFFFFF"

  const WIDTH = 300
  const GAP = 14
  const flipX = viewport.w > 0 && target.x + GAP + WIDTH > viewport.w - 8
  const left = flipX ? Math.max(8, target.x - GAP - WIDTH) : target.x + GAP
  const top = Math.min(Math.max(8, target.y - 20), Math.max(8, viewport.h - 380))

  const levelDiff =
    known?.itemLevel != null && target.equippedLevel != null
      ? known.itemLevel - target.equippedLevel
      : null

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[100] border-2 bg-ground px-3 py-2.5 shadow-2xl"
      style={{ left, top, width: WIDTH, borderColor: color }}
    >
      <div className="font-heading text-[14px] font-extrabold leading-tight" style={{ color }}>
        {known?.name ?? target.fallbackName}
      </div>

      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="eyebrow">{target.slotName}</span>
        {known?.quality && qualityKey && (
          <span className="eyebrow">{t(qualityKey)}</span>
        )}
      </div>

      {known?.itemLevel != null && (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]">
            Stufe {known.itemLevel}
          </span>
          {levelDiff !== null && levelDiff !== 0 && (
            <span
              className="font-heading text-[12px] font-extrabold"
              style={{
                color:
                  levelDiff > 0 ? "var(--faction-alliance)" : "var(--color-accent)",
              }}
            >
              {levelDiff > 0 ? `+${levelDiff}` : levelDiff}
            </span>
          )}
        </div>
      )}

      {known?.armor && (
        <div className="mt-1 text-[12px] opacity-80">{known.armor}</div>
      )}

      {known && known.stats.length > 0 && (
        <ul className="mt-2 list-none space-y-0.5 p-0">
          {known.stats.map((s, i) => (
            <li key={i} className="text-[12px] opacity-85">
              {s.label || `${s.value} ${s.type ?? ""}`.trim()}
            </li>
          ))}
        </ul>
      )}

      {known?.binding && (
        <div className="mt-2 text-[11px] opacity-55">{known.binding}</div>
      )}

      {/* Quelle: der Grund, warum diese Liste überhaupt nützlich ist */}
      <div className="mt-2 border-t border-line pt-1.5">
        <span className="eyebrow block">Quelle</span>
        <span className="text-[12px] opacity-80">{target.source}</span>
      </div>

      {target.equippedName && (
        <div className="mt-2 border-t border-line pt-1.5">
          <span className="eyebrow block">Aktuell angelegt</span>
          <span className="text-[12px] opacity-70">
            {target.equippedName}
            {target.equippedLevel != null && ` · Stufe ${target.equippedLevel}`}
          </span>
        </div>
      )}

      {loading && !known && (
        <div className="mt-2 text-[11px] opacity-55">Lade Gegenstandsdaten…</div>
      )}
    </div>
  )
}
