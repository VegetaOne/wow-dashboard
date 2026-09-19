"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GameMode, ItemDetails } from "@/lib/battlenet"
import { QUALITY_COLORS } from "@/lib/battlenet"
import { CandidateTooltip, type CandidateTarget } from "./CandidateTooltip"
import { useT } from "./I18nProvider"

interface LootCandidate {
  itemId: number
  name: string
  itemLevel: number | null
  quality: string | null
  instanceName: string
  encounterName: string
}

interface SlotUpgrades {
  slotType: string
  slotName: string
  equippedName: string | null
  equippedLevel: number | null
  candidates: LootCandidate[]
}

interface IndexStatus {
  status: string
  itemCount: number
}

/**
 * Loot-Kandidaten je Slot. Bewusst nicht "Best in Slot" genannt:
 * ohne Statgewichte ist keine Aussage darüber möglich, ob ein Item
 * für die Spezialisierung besser ist.
 */
export function SlotCandidates({
  realm,
  name,
  mode,
}: {
  realm: string
  name: string
  mode: GameMode
}) {
  const t = useT()
  const [slots, setSlots] = useState<SlotUpgrades[]>([])
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSlot, setOpenSlot] = useState<string | null>(null)

  // Icons und Stammdaten erst holen, wenn ein Slot aufgeklappt wird –
  // der Index führt sie nicht, und ihn zu erweitern würde ihn verdoppeln.
  const [icons, setIcons] = useState<Record<number, string>>({})
  const [itemCache, setItemCache] = useState<Record<number, ItemDetails>>({})
  const [tooltip, setTooltip] = useState<CandidateTarget | null>(null)
  const requestedIcons = useRef<Set<number>>(new Set())

  const mergeItems = useCallback((items: Record<number, ItemDetails>) => {
    setItemCache((prev) => ({ ...prev, ...items }))
  }, [])

  const loadIconsFor = useCallback(
    async (candidates: LootCandidate[]) => {
      const missing = candidates
        .map((c) => c.itemId)
        .filter((id) => !requestedIcons.current.has(id))
      if (missing.length === 0) return
      for (const id of missing) requestedIcons.current.add(id)

      try {
        const res = await fetch(
          `/api/wow/item?ids=${missing.join(",")}&mode=${mode}`
        )
        const data = await res.json()
        if (data.icons) setIcons((prev) => ({ ...prev, ...data.icons }))
        if (data.items) mergeItems(data.items)
      } catch {
        for (const id of missing) requestedIcons.current.delete(id)
      }
    },
    [mode, mergeItems]
  )

  function toggleSlot(slot: SlotUpgrades) {
    const next = openSlot === slot.slotType ? null : slot.slotType
    setOpenSlot(next)
    if (next) loadIconsFor(slot.candidates)
  }

  // Moduswechsel: Geladenes verwerfen, es gilt pro Modus
  useEffect(() => {
    setIcons({})
    setItemCache({})
    requestedIcons.current = new Set()
    setOpenSlot(null)
  }, [mode])

  useEffect(() => {
    let active = true
    setLoading(true)

    fetch(`/api/wow/upgrades?realm=${realm}&name=${name}&mode=${mode}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setSlots(data.slots ?? [])
        setIndexStatus(data.indexStatus ?? null)
      })
      .catch(() => {
        if (active) setSlots([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [realm, name, mode])

  if (loading) {
    return (
      <div className="border-2 border-line px-4 py-3">
        <span className="eyebrow block">{t("loot.candidatesEyebrow")}</span>
        <span className="text-[13px] opacity-55">{t("core.loading")}</span>
      </div>
    )
  }

  // Ohne Index offen sagen, dass nichts verglichen werden kann
  if (!indexStatus || indexStatus.itemCount === 0) {
    return (
      <div className="border-2 border-line px-4 py-3">
        <span className="eyebrow block">{t("loot.candidatesEyebrow")}</span>
        <span className="text-[13px] opacity-75">{t("loot.noIndexYet")}</span>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3">
        <span className="eyebrow block">{t("loot.candidatesEyebrow")}</span>
        <span className="text-[13px] opacity-75">{t("loot.noMatchingItems")}</span>
      </div>
    )
  }

  return (
    <div className="border-2 border-line" onMouseLeave={() => setTooltip(null)}>
      <CandidateTooltip
        target={tooltip}
        mode={mode}
        cache={itemCache}
        onLoaded={mergeItems}
      />

      <div className="border-b border-line px-4 py-2">
        <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.08em]">
          {t("loot.candidatesTitle")}
        </span>
        <p className="mt-1 text-[12px] opacity-60">
          {t("loot.candidatesHint")}
          {mode !== "retail" && <> {t("loot.classicLevelCaveat")}</>}{" "}
          {t("loot.noDpsRating")}
        </p>
      </div>

      <div>
        {slots.map((slot) => {
          const isOpen = openSlot === slot.slotType
          const better = slot.candidates.filter(
            (c) =>
              slot.equippedLevel !== null &&
              c.itemLevel !== null &&
              c.itemLevel > slot.equippedLevel
          ).length

          return (
            <div key={slot.slotType} className="border-b border-line last:border-0">
              <button
                onClick={() => toggleSlot(slot)}
                aria-expanded={isOpen}
                className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5 text-left hover:bg-ink/5"
              >
                <span className="w-[110px] flex-none eyebrow">{slot.slotName}</span>
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  {slot.equippedName ?? (
                    <span className="opacity-50">{t("loot.noItemEquipped")}</span>
                  )}
                  {slot.equippedLevel !== null && (
                    <span className="ml-2 opacity-55">
                      {t("equipment.candidateLevel", { level: slot.equippedLevel })}
                    </span>
                  )}
                </span>
                <span className="eyebrow">
                  {t("loot.knownCount", { count: slot.candidates.length })}
                  {better > 0 && ` · ${t("loot.higherBy", { delta: better })}`}
                </span>
                <span className="w-4 flex-none text-center text-[12px] opacity-55">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <ul className="m-0 list-none border-t border-line bg-surface p-0">
                  {slot.candidates.map((c) => {
                    const color = QUALITY_COLORS[c.quality ?? "COMMON"] ?? "#FFFFFF"
                    const isHigher =
                      slot.equippedLevel !== null &&
                      c.itemLevel !== null &&
                      c.itemLevel > slot.equippedLevel

                    return (
                      <li
                        key={`${c.itemId}-${c.encounterName}`}
                        className="flex cursor-help flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-line px-4 py-2 last:border-0"
                        onMouseEnter={(e) =>
                          setTooltip({
                            itemId: c.itemId,
                            fallbackName: c.name,
                            slotName: slot.slotName,
                            source: `${c.instanceName} · ${c.encounterName}`,
                            equippedLevel: slot.equippedLevel,
                            equippedName: slot.equippedName,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                        onMouseMove={(e) =>
                          setTooltip((t) =>
                            t && t.itemId === c.itemId
                              ? { ...t, x: e.clientX, y: e.clientY }
                              : t
                          )
                        }
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {/* Icon, sonst ein Farbfeld in der Qualität */}
                        <span
                          className="h-7 w-7 flex-none border-2 bg-surface"
                          style={{ borderColor: color }}
                        >
                          {icons[c.itemId] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={icons[c.itemId]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </span>
                        <span
                          className="min-w-0 flex-1 truncate text-[13px]"
                          style={{ color }}
                        >
                          {c.name}
                        </span>
                        <span className="w-14 flex-none text-right font-heading text-[13px] font-extrabold">
                          {c.itemLevel ?? "—"}
                        </span>
                        {isHigher && (
                          <span className="tag tag-accent">{t("loot.higher")}</span>
                        )}
                        <span className="w-full text-[11px] opacity-50 sm:w-auto">
                          {c.instanceName} · {c.encounterName}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
