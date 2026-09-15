"use client"

import { useEffect, useState } from "react"
import type { EquipmentSlot } from "@/lib/battlenet"
import { QUALITY_COLORS } from "@/lib/battlenet"

export interface TooltipTarget {
  item: EquipmentSlot
  slotName: string
  x: number
  y: number
}

const QUALITY_LABEL: Record<string, string> = {
  POOR: "Schlecht", COMMON: "Gewöhnlich", UNCOMMON: "Ungewöhnlich", RARE: "Selten",
  EPIC: "Episch", LEGENDARY: "Legendär", ARTIFACT: "Artefakt", HEIRLOOM: "Erbstück",
}

export function itemDisplayName(item: EquipmentSlot): string {
  return item.name ?? item.item?.name ?? "Unbekannter Gegenstand"
}

/**
 * Folgt dem Zeiger und dreht bei Bedarf zur anderen Seite,
 * damit der Kasten nicht aus dem Fenster läuft.
 */
export function ItemTooltip({ target }: { target: TooltipTarget | null }) {
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  if (!target) return null

  const { item, slotName, x, y } = target
  const quality = item.quality?.type ?? "COMMON"
  const color = QUALITY_COLORS[quality] ?? "#FFFFFF"

  const WIDTH = 280
  const GAP = 14
  // Nach links kippen, wenn rechts kein Platz mehr ist
  const flipX = viewport.w > 0 && x + GAP + WIDTH > viewport.w - 8
  const left = flipX ? Math.max(8, x - GAP - WIDTH) : x + GAP
  const top = Math.min(Math.max(8, y - 20), Math.max(8, viewport.h - 340))

  const stats = (item.stats ?? [])
    .map((s) => s.display?.display_string)
    .filter((s): s is string => !!s)

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[100] border-2 bg-ground px-3 py-2.5 shadow-2xl"
      style={{ left, top, width: WIDTH, borderColor: color }}
    >
      <div className="font-heading text-[14px] font-extrabold leading-tight" style={{ color }}>
        {itemDisplayName(item)}
      </div>

      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="eyebrow">{slotName}</span>
        <span className="eyebrow">{QUALITY_LABEL[quality] ?? quality}</span>
      </div>

      {item.level?.value != null && (
        <div className="mt-2 font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]">
          {item.level.display_string ?? `Gegenstandsstufe ${item.level.value}`}
        </div>
      )}

      {item.armor?.display?.display_string && (
        <div className="mt-1 text-[12px] opacity-80">
          {item.armor.display.display_string}
        </div>
      )}

      {stats.length > 0 && (
        <ul className="mt-2 list-none space-y-0.5 p-0">
          {stats.map((s, i) => (
            <li key={i} className="text-[12px] opacity-85">
              {s}
            </li>
          ))}
        </ul>
      )}

      {item.enchantments?.length ? (
        <div className="mt-2 border-t border-line pt-1.5">
          {item.enchantments.map((e, i) => (
            <div key={i} className="text-[12px]" style={{ color: "var(--faction-alliance)" }}>
              {e.display_string}
            </div>
          ))}
        </div>
      ) : null}

      {item.sockets?.length ? (
        <div className="mt-2 border-t border-line pt-1.5">
          {item.sockets.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2.5 w-2.5 flex-none border"
                style={{
                  borderColor: "var(--color-divider)",
                  background: s.item ? color : "transparent",
                }}
                aria-hidden
              />
              {s.item?.name ?? (
                <span style={{ color: "var(--color-accent)" }}>Leere Fassung</span>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {item.binding?.name && (
        <div className="mt-2 text-[11px] opacity-55">{item.binding.name}</div>
      )}
    </div>
  )
}
