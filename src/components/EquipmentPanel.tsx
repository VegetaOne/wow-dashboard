"use client"

import { useMemo, useState } from "react"
import type { CharacterEquipment, EquipmentSlot, GameMode } from "@/lib/battlenet"
import {
  SLOT_ORDER,
  SLOT_NAMES,
  QUALITY_COLORS,
  ENCHANTABLE_SLOTS,
  PAPERDOLL_LEFT,
  PAPERDOLL_RIGHT,
  PAPERDOLL_WEAPONS,
} from "@/lib/battlenet"
import { ItemTooltip, itemDisplayName, type TooltipTarget } from "./ItemTooltip"

interface EquipmentPanelProps {
  equipment: CharacterEquipment
  /** Icon-URLs je Gegenstands-ID, serverseitig nachgeladen */
  icons?: Record<number, string>
  /** Freigestelltes Charaktermodell (main-raw), wenn die API eines liefert */
  renderUrl?: string | null
  mode?: GameMode
}

const QUALITY_LABEL: Record<string, string> = {
  POOR: "Schlecht", COMMON: "Gewöhnlich", UNCOMMON: "Ungewöhnlich", RARE: "Selten",
  EPIC: "Episch", LEGENDARY: "Legendär", ARTIFACT: "Artefakt", HEIRLOOM: "Erbstück",
}

type Upgrade = {
  kind: "ENCHANT" | "SOCKET" | "WEAK"
  slotType: string
  itemName: string
  detail: string
}

const UPGRADE_LABEL: Record<Upgrade["kind"], string> = {
  ENCHANT: "Verzauberung fehlt",
  SOCKET: "Fassung leer",
  WEAK: "Schwächster Slot",
}

export function EquipmentPanel({
  equipment,
  icons = {},
  renderUrl = null,
  mode = "retail",
}: EquipmentPanelProps) {
  const [tooltip, setTooltip] = useState<TooltipTarget | null>(null)
  const [modelSize, setModelSize] = useState<"normal" | "large">("normal")

  const items = equipment.equipped_items ?? []

  const slotMap = useMemo(() => {
    const map: Record<string, EquipmentSlot> = {}
    for (const item of items) {
      if (item.slot?.type) map[item.slot.type] = item
    }
    return map
  }, [items])

  const levels = items
    .map((i) => i.level?.value)
    .filter((v): v is number => typeof v === "number")
  const hasLevels = levels.length > 0
  const maxLevel = Math.max(1, ...levels)

  const upgrades = useMemo(
    () => findUpgrades(items, slotMap, mode, levels),
    [items, slotMap, mode, levels.join(",")]
  )

  function showTooltip(item: EquipmentSlot, slotType: string, e: React.MouseEvent) {
    setTooltip({
      item,
      slotName: SLOT_NAMES[slotType] ?? slotType,
      x: e.clientX,
      y: e.clientY,
    })
  }

  if (items.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-65">
        <span className="eyebrow block">Keine Ausrüstung</span>
        Für diesen Charakter liefert die API keine angelegten Gegenstände.
      </div>
    )
  }

  return (
    <div onMouseLeave={() => setTooltip(null)}>
      <ItemTooltip target={tooltip} />

      {/* ── Upgrade-Möglichkeiten ───────────────────────────────── */}
      {upgrades.length > 0 ? (
        <div className="mb-8 border-2 border-accent">
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2">
            <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.08em] text-accent">
              Upgrade-Möglichkeiten
            </span>
            <span className="eyebrow">{upgrades.length} offen</span>
          </div>
          <ul className="m-0 list-none p-0">
            {upgrades.map((u, i) => (
              <li
                key={`${u.kind}-${u.slotType}-${i}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line px-4 py-2 last:border-0"
              >
                <span className="w-[130px] flex-none eyebrow">
                  {UPGRADE_LABEL[u.kind]}
                </span>
                <span className="text-[13px]">{u.itemName}</span>
                <span className="ml-auto text-[12px] opacity-60">{u.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-8 border-2 border-line px-4 py-2.5">
          <span className="eyebrow block">Upgrade-Möglichkeiten</span>
          <span className="text-[13px] opacity-75">
            Keine offenen Punkte gefunden.
          </span>
        </div>
      )}

      {/* ── Paperdoll ───────────────────────────────────────────── */}
      <h4 className="mb-3">Charakterfenster</h4>

      <div className="mb-8 border-2 border-line p-4">
        {/* Gross: eigene Reihe über den Spalten, damit das Modell den
            ganzen Platz bekommt statt die Slots zu quetschen. */}
        {renderUrl && modelSize === "large" && (
          <div className="mb-4 flex flex-col items-center gap-2 border-b-2 border-line pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={renderUrl}
              alt="Charaktermodell"
              className="max-h-[min(860px,82vh)] w-auto max-w-full object-contain"
            />
            <ModelSizeToggle size={modelSize} onChange={setModelSize} />
          </div>
        )}

        <div
          className={`grid gap-x-8 gap-y-2 ${
            renderUrl && modelSize === "normal"
              ? "md:grid-cols-2 lg:grid-cols-[1fr_minmax(260px,400px)_1fr]"
              : "md:grid-cols-2"
          }`}
        >
          <div className="flex flex-col gap-2">
            {PAPERDOLL_LEFT.map((slotType) => (
              <PaperdollSlot
                key={slotType}
                slotType={slotType}
                item={slotMap[slotType]}
                icon={slotMap[slotType] ? icons[slotMap[slotType].item.id] : undefined}
                mode={mode}
                align="left"
                onEnter={showTooltip}
                onLeave={() => setTooltip(null)}
              />
            ))}
          </div>

          {/* Charaktermodell zwischen den Spalten – auf schmalen Schirmen
              rutscht es unter die Slots, damit nichts gequetscht wird. */}
          {renderUrl && modelSize === "normal" && (
            <div className="order-last flex flex-col items-center justify-end gap-2 md:col-span-2 lg:order-none lg:col-span-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={renderUrl}
                alt="Charaktermodell"
                className="max-h-[min(620px,70vh)] w-auto max-w-full object-contain"
              />
              <ModelSizeToggle size={modelSize} onChange={setModelSize} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {PAPERDOLL_RIGHT.map((slotType) => (
              <PaperdollSlot
                key={slotType}
                slotType={slotType}
                item={slotMap[slotType]}
                icon={slotMap[slotType] ? icons[slotMap[slotType].item.id] : undefined}
                mode={mode}
                align="right"
                onEnter={showTooltip}
                onLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        </div>

        {/* Waffen zentriert unter den Spalten, wie im Spiel */}
        <div className="mt-4 flex flex-wrap justify-center gap-3 border-t-2 border-line pt-4">
          {PAPERDOLL_WEAPONS.map((slotType) => (
            <PaperdollSlot
              key={slotType}
              slotType={slotType}
              item={slotMap[slotType]}
              icon={slotMap[slotType] ? icons[slotMap[slotType].item.id] : undefined}
              mode={mode}
              align="left"
              onEnter={showTooltip}
              onLeave={() => setTooltip(null)}
            />
          ))}
        </div>
      </div>

      {/* ── Detailliste ─────────────────────────────────────────── */}
      <h4 className="mb-3">Alle Slots</h4>

      <div className="border-t-2 border-line">
        {SLOT_ORDER.map((slotType) => (
          <SlotRow
            key={slotType}
            slotType={slotType}
            item={slotMap[slotType]}
            icon={slotMap[slotType] ? icons[slotMap[slotType].item.id] : undefined}
            max={maxLevel}
            showBars={hasLevels}
            onEnter={showTooltip}
            onLeave={() => setTooltip(null)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Upgrade-Erkennung ────────────────────────────────────────────────────────

function findUpgrades(
  items: EquipmentSlot[],
  slotMap: Record<string, EquipmentSlot>,
  mode: GameMode,
  levels: number[]
): Upgrade[] {
  const upgrades: Upgrade[] = []

  // Leere Fassungen
  for (const item of items) {
    const empty = item.sockets?.filter((s) => !s.item).length ?? 0
    if (empty > 0) {
      upgrades.push({
        kind: "SOCKET",
        slotType: item.slot?.type ?? "",
        itemName: itemDisplayName(item),
        detail: `${empty} von ${item.sockets?.length ?? empty}`,
      })
    }
  }

  // Fehlende Verzauberungen – nur dort, wo wir die Regeln kennen
  for (const slotType of ENCHANTABLE_SLOTS[mode] ?? []) {
    const item = slotMap[slotType]
    if (!item) continue
    if ((item.enchantments?.length ?? 0) === 0) {
      upgrades.push({
        kind: "ENCHANT",
        slotType,
        itemName: itemDisplayName(item),
        detail: SLOT_NAMES[slotType] ?? slotType,
      })
    }
  }

  // Slots, die den eigenen Schnitt nach unten ziehen (nur wo es Stufen gibt)
  if (levels.length >= 4) {
    const sorted = [...levels].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const weak = items
      .filter((i) => typeof i.level?.value === "number" && i.level.value <= median - 10)
      .sort((a, b) => (a.level?.value ?? 0) - (b.level?.value ?? 0))
      .slice(0, 5)

    for (const item of weak) {
      upgrades.push({
        kind: "WEAK",
        slotType: item.slot?.type ?? "",
        itemName: itemDisplayName(item),
        detail: `Stufe ${item.level?.value} · ${median - (item.level?.value ?? 0)} unter Median`,
      })
    }
  }

  return upgrades
}

// ─── Paperdoll-Slot ───────────────────────────────────────────────────────────

function PaperdollSlot({
  slotType,
  item,
  icon,
  mode,
  align,
  onEnter,
  onLeave,
}: {
  slotType: string
  item?: EquipmentSlot
  icon?: string
  mode: GameMode
  align: "left" | "right"
  onEnter: (item: EquipmentSlot, slotType: string, e: React.MouseEvent) => void
  onLeave: () => void
}) {
  const slotName = SLOT_NAMES[slotType] ?? slotType

  if (!item) {
    return (
      <div
        className={`flex items-center gap-3 opacity-30 ${
          align === "right" ? "md:flex-row-reverse md:text-right" : ""
        }`}
      >
        <span className="h-11 w-11 flex-none border border-line" aria-hidden />
        <span className="text-[11px] uppercase tracking-[0.06em]">{slotName}</span>
      </div>
    )
  }

  const quality = item.quality?.type ?? "COMMON"
  const color = QUALITY_COLORS[quality] ?? "#FFFFFF"
  const level = item.level?.value ?? null
  const emptySocket = item.sockets?.some((s) => !s.item) ?? false
  const enchantable = (ENCHANTABLE_SLOTS[mode] ?? []).includes(slotType)
  const missingEnchant = enchantable && (item.enchantments?.length ?? 0) === 0

  return (
    <div
      className={`flex cursor-help items-center gap-3 ${
        align === "right" ? "md:flex-row-reverse md:text-right" : ""
      }`}
      onMouseEnter={(e) => onEnter(item, slotType, e)}
      onMouseMove={(e) => onEnter(item, slotType, e)}
      onMouseLeave={onLeave}
    >
      {/* Icon mit Qualitätsrahmen und Stufen-Plakette */}
      <span
        className="relative h-11 w-11 flex-none border-2 bg-surface"
        style={{ borderColor: color }}
      >
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-heading text-[10px] font-extrabold"
            style={{ color }}
          >
            {slotName.slice(0, 2).toUpperCase()}
          </span>
        )}

        {level !== null && (
          <span
            className="absolute -bottom-px -right-px px-1 font-heading text-[10px] font-extrabold leading-[1.3]"
            style={{ background: color, color: "var(--color-bg)" }}
          >
            {level}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] leading-tight" style={{ color }}>
          {itemDisplayName(item)}
        </span>
        <span
          className={`mt-0.5 flex items-center gap-1.5 ${
            align === "right" ? "md:justify-end" : ""
          }`}
        >
          <span className="eyebrow">{slotName}</span>
          {emptySocket && (
            <span
              className="h-2 w-2 flex-none"
              style={{ background: "var(--color-accent)" }}
              title="Leere Fassung"
              aria-label="Leere Fassung"
            />
          )}
          {missingEnchant && (
            <span
              className="h-2 w-2 flex-none border"
              style={{ borderColor: "var(--color-accent)" }}
              title="Verzauberung fehlt"
              aria-label="Verzauberung fehlt"
            />
          )}
        </span>
      </span>
    </div>
  )
}

// ─── Detailliste ──────────────────────────────────────────────────────────────

function SlotRow({
  slotType,
  item,
  icon,
  max,
  showBars,
  onEnter,
  onLeave,
}: {
  slotType: string
  item?: EquipmentSlot
  icon?: string
  max: number
  showBars: boolean
  onEnter: (item: EquipmentSlot, slotType: string, e: React.MouseEvent) => void
  onLeave: () => void
}) {
  const slotName = SLOT_NAMES[slotType] ?? slotType

  if (!item) {
    return (
      <div className="flex items-center gap-3 border-b border-line py-2.5 opacity-40">
        <span className="h-8 w-8 flex-none border border-line" aria-hidden />
        <span className="w-24 flex-none text-[12px]">{slotName}</span>
        <span className="flex-1 text-[13px]">Leer</span>
      </div>
    )
  }

  const quality = item.quality?.type ?? "COMMON"
  const color = QUALITY_COLORS[quality] ?? "#FFFFFF"
  const level = item.level?.value ?? null
  const pct = level !== null ? Math.round((level / max) * 100) : 0
  const emptySocket = item.sockets?.some((s) => !s.item) ?? false
  const socketCount = item.sockets?.length ?? 0
  const hasEnchant = (item.enchantments?.length ?? 0) > 0
  const name = itemDisplayName(item)

  return (
    <div
      className="flex cursor-help items-center gap-3 border-b border-line py-2.5"
      onMouseEnter={(e) => onEnter(item, slotType, e)}
      onMouseMove={(e) => onEnter(item, slotType, e)}
      onMouseLeave={onLeave}
    >
      <span
        className="h-8 w-8 flex-none border-2 bg-surface"
        style={{ borderColor: color }}
      >
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-full w-full object-cover" />
        ) : null}
      </span>

      <span className="w-24 flex-none text-[12px] opacity-65">{slotName}</span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px]" style={{ color }} title={name}>
          {name}
        </span>
        {showBars && level !== null && (
          <span className="mt-1 block h-1.5 bg-neutral-300">
            <span className="block h-1.5" style={{ width: `${pct}%`, background: color }} />
          </span>
        )}
      </span>

      <span className="w-10 flex-none text-right font-heading text-[13px] font-extrabold">
        {level ?? "—"}
      </span>

      <span className="hidden w-24 flex-none text-[10px] uppercase tracking-[0.06em] opacity-50 sm:block">
        {QUALITY_LABEL[quality] ?? quality}
      </span>

      <span className="flex w-40 flex-none flex-wrap gap-1">
        {emptySocket && <span className="tag tag-accent">Leere Fassung</span>}
        {!emptySocket && socketCount > 0 && (
          <span className="tag tag-neutral">Fassung belegt</span>
        )}
        {hasEnchant && <span className="tag tag-neutral">Verzaubert</span>}
      </span>
    </div>
  )
}

/**
 * Zwei Grössenstufen für das Charaktermodell. Echtes Drehen ist nicht
 * möglich: die API liefert ein fertig gerendertes PNG aus einem festen
 * Winkel, kein 3D-Modell.
 */
function ModelSizeToggle({
  size,
  onChange,
}: {
  size: "normal" | "large"
  onChange: (next: "normal" | "large") => void
}) {
  return (
    <button
      onClick={() => onChange(size === "normal" ? "large" : "normal")}
      className="btn btn-secondary text-[12px]"
      aria-label={size === "normal" ? "Modell vergrössern" : "Modell verkleinern"}
    >
      {size === "normal" ? "Modell vergrössern" : "Modell verkleinern"}
    </button>
  )
}
