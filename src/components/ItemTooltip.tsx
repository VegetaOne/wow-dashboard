"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { EquipmentSlot } from "@/lib/battlenet"
import { QUALITY_COLORS, qualityLabelKey } from "@/lib/battlenet"
import { buildItemTooltip, type TooltipTone } from "@/lib/item-tooltip"
import { useT } from "./I18nProvider"
import type { Translate } from "@/lib/i18n"

export interface TooltipTarget {
  item: EquipmentSlot
  slotName: string
  x: number
  y: number
}

/** `t` als Parameter statt `useT()`: auch aus `findUpgrades()` gebraucht, das keine Komponente ist. */
export function itemDisplayName(item: EquipmentSlot, t: Translate): string {
  return item.name ?? item.item?.name ?? t("equipment.unknownItem")
}

/** Farben wie im Spiel. Der Kasten ist in beiden Themes dunkel, sonst wären Grün und Gold auf Pergament unlesbar. */
const TONE_COLORS: Record<TooltipTone, string> = {
  plain: "#ffffff",
  green: "#1eff00",
  gold: "#ffd100",
  dim: "#9d9d9d",
  heading: "#ffd100",
}

/**
 * Folgt dem Zeiger und dreht bei Bedarf zur anderen Seite, damit der Kasten
 * nicht aus dem Fenster läuft. Zeigt den vollen Text, den das Spiel beim
 * Gegenstand zeigt – aufgebaut in `buildItemTooltip`.
 */
export function ItemTooltip({ target }: { target: TooltipTarget | null }) {
  const t = useT()
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const boxRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const model = useMemo(() => (target ? buildItemTooltip(target.item) : null), [target?.item])

  // Echte Höhe messen: lange Tooltips (Set, Effekte) sollen unten nicht abgeschnitten werden
  useLayoutEffect(() => {
    setHeight(boxRef.current?.offsetHeight ?? 0)
  }, [model])

  if (!target || !model) return null

  const { item, slotName, x, y } = target
  const quality = item.quality?.type ?? "COMMON"
  const qualityKey = qualityLabelKey(quality)
  const color = QUALITY_COLORS[quality] ?? "#FFFFFF"

  const WIDTH = 300
  const GAP = 14
  // Nach links kippen, wenn rechts kein Platz mehr ist
  const flipX = viewport.w > 0 && x + GAP + WIDTH > viewport.w - 8
  const left = flipX ? Math.max(8, x - GAP - WIDTH) : x + GAP
  const top = Math.min(Math.max(8, y - 20), Math.max(8, viewport.h - (height || 340) - 8))

  return (
    <div
      ref={boxRef}
      role="tooltip"
      className="pointer-events-none fixed z-[100] border-2 px-3 py-2.5 shadow-2xl"
      style={{
        left,
        top,
        width: WIDTH,
        borderColor: color,
        background: "rgba(10, 8, 14, 0.96)",
        color: "#ffffff",
        maxHeight: viewport.h ? viewport.h - 16 : undefined,
        overflow: "hidden",
      }}
    >
      <div className="font-heading text-[14px] font-extrabold leading-tight" style={{ color }}>
        {itemDisplayName(item, t)}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: "#9d9d9d" }}>
        <span>{model.hasSlotLine ? "" : slotName}</span>
        <span>{qualityKey ? t(qualityKey) : "—"}</span>
      </div>

      <div className="mt-1.5 text-[12px] leading-[1.4]">
        {model.lines.map((line, i) => (
          <div
            key={i}
            className={`flex items-start justify-between gap-3 ${line.gap ? "mt-1.5" : ""} ${
              line.tone === "heading" ? "font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]" : ""
            }`}
            style={{ color: line.color ?? TONE_COLORS[line.tone] }}
          >
            <span className="flex min-w-0 items-start gap-2">
              {line.socket && (
                <span
                  className="mt-[3px] h-2.5 w-2.5 flex-none border"
                  style={{ borderColor: "#9d9d9d", background: line.socket === "filled" ? color : "transparent" }}
                  aria-hidden
                />
              )}
              <span className="min-w-0" style={line.socket === "empty" ? { color: "#9d9d9d" } : undefined}>
                {line.key ? t(line.key, line.params) : line.text}
              </span>
            </span>
            {line.right && <span className="flex-none">{line.right}</span>}
          </div>
        ))}

        {model.price && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5">
            {model.price.header && <span>{model.price.header}</span>}
            {model.price.gold > 0 && <Coin value={model.price.gold} color="#ffd700" />}
            {(model.price.gold > 0 || model.price.silver > 0) && <Coin value={model.price.silver} color="#c7c7cf" />}
            <Coin value={model.price.copper} color="#c8602c" />
          </div>
        )}
      </div>
    </div>
  )
}

/** Münzbetrag mit Münze in der Metallfarbe, wie im Spiel. */
function Coin({ value, color }: { value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {value}
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
    </span>
  )
}
