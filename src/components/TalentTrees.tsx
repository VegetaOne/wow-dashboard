"use client"

import { useState } from "react"
import { useFormat, useT } from "./I18nProvider"
import {
  pointsInTree,
  type Allocation,
  type ClassTalents,
  type TalentNode,
  type TalentTree,
} from "@/lib/talent-tree"

/**
 * Die drei Talentbäume einer Klasse, angelehnt an den Client: quadratische
 * Icons im Raster der API (`display_row`/`display_col`), Rang unten rechts,
 * Pfeile für Voraussetzungen, Beschreibung als Tooltip am Icon.
 *
 * - Untereinander, sortiert nach gesetzten Punkten – der Hauptbaum oben.
 * - Ungesetzt grau, gesetzt farbig mit grünem Rand, voll ausgebaut golden.
 * - Fehlt ein Icon oder Hintergrund (für Forever nicht belegt), steht der
 *   Name im Feld bzw. bleibt der Grund schlicht.
 */

const ICON = 44
const STEP_X = 72
const STEP_Y = 64
const PAD = 16

export function TalentTrees({
  talents,
  allocation,
  unmatched,
}: {
  talents: ClassTalents
  allocation: Allocation
  unmatched: number
}) {
  const t = useT()
  const f = useFormat()
  const total = talents.trees.reduce((sum, tree) => sum + pointsInTree(tree, allocation), 0)

  // Absteigend nach Punkten; bei Gleichstand die Reihenfolge der API
  const ordered = talents.trees
    .map((tree, index) => ({ tree, index, points: pointsInTree(tree, allocation) }))
    .sort((a, b) => b.points - a.points || a.index - b.index)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
        <span className="font-heading font-extrabold">
          {total > 0 ? t("talents.spentTotal", { points: f.number(total) }) : t("talents.noneSpent")}
        </span>
        {total > 0 && (
          <span className="opacity-60" style={{ fontVariantNumeric: "tabular-nums" }}>
            {ordered.map(({ points }) => f.number(points)).join(" / ")}
          </span>
        )}
      </div>

      {unmatched > 0 && (
        <div className="mb-4 border-2 border-line px-4 py-2 text-[12px] opacity-75">
          {t("talents.unmatched", { count: f.number(unmatched) })}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {ordered.map(({ tree, points }) => (
          <TreeView key={tree.specId} tree={tree} points={points} allocation={allocation} />
        ))}
      </div>
    </div>
  )
}

function TreeView({
  tree,
  points,
  allocation,
}: {
  tree: TalentTree
  points: number
  allocation: Allocation
}) {
  const f = useFormat()
  const [hover, setHover] = useState<number | null>(null)
  const byId = new Map(tree.nodes.map((n) => [n.id, n]))

  const width = Math.max(1, tree.cols) * STEP_X - (STEP_X - ICON)
  const height = Math.max(1, tree.rows) * STEP_Y - (STEP_Y - ICON)
  const pos = (n: TalentNode) => ({ x: (n.col - 1) * STEP_X, y: (n.row - 1) * STEP_Y })
  // Je Farbe ein Pfeilkopf: `context-stroke` können nicht alle Browser
  const markerMet = `talent-arrow-met-${tree.specId}`
  const markerOpen = `talent-arrow-open-${tree.specId}`

  return (
    <section className="border-2 border-line">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[15px] font-extrabold">{tree.name}</span>
        <span className="font-heading text-[15px] font-extrabold" style={{ fontVariantNumeric: "tabular-nums" }}>
          {f.number(points)}
        </span>
      </div>

      {/* Hintergrund des Baums, gedämpft – die Icons müssen lesbar bleiben */}
      <div
        className="relative overflow-x-auto"
        style={{
          backgroundImage: tree.background
            ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${tree.background})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative mx-auto" style={{ width: width + PAD * 2, height: height + PAD * 2, padding: PAD }}>
          <div className="relative" style={{ width, height }}>
            {/* Voraussetzungen als Pfeile von unten am Vorgänger zu oben am Talent */}
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={height} aria-hidden>
              <defs>
                {[
                  [markerMet, "var(--color-gold)"],
                  [markerOpen, "var(--color-divider)"],
                ].map(([id, color]) => (
                  <marker key={id} id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
                    {/* Farbe über style: var() greift in SVG-Attributen nicht überall */}
                    <path d="M0,0 L8,4 L0,8 z" style={{ fill: color }} />
                  </marker>
                ))}
              </defs>
              {tree.nodes.flatMap((node) =>
                node.requires
                  .map((id) => byId.get(id))
                  .filter((req): req is TalentNode => req !== undefined)
                  .map((req) => {
                    const a = pos(req)
                    const b = pos(node)
                    const met = (allocation[req.id] ?? 0) >= req.maxRank
                    const color = met ? "var(--color-gold)" : "var(--color-divider)"
                    // Gleiche Spalte: senkrecht. Sonst erst waagrecht, dann hinunter.
                    const path =
                      a.x === b.x
                        ? `M${a.x + ICON / 2},${a.y + ICON} L${b.x + ICON / 2},${b.y - 2}`
                        : `M${a.x + (b.x > a.x ? ICON : 0)},${a.y + ICON / 2} L${b.x + ICON / 2},${a.y + ICON / 2} L${b.x + ICON / 2},${b.y - 2}`
                    return (
                      <path
                        key={`${req.id}-${node.id}`}
                        d={path}
                        fill="none"
                        style={{ stroke: color }}
                        strokeWidth={3}
                        markerEnd={`url(#${met ? markerMet : markerOpen})`}
                      />
                    )
                  })
              )}
            </svg>

            {tree.nodes.map((node) => (
              <TalentIcon
                key={node.id}
                node={node}
                rank={allocation[node.id] ?? 0}
                left={pos(node).x}
                top={pos(node).y}
                tooltipLeft={node.col > Math.ceil(tree.cols / 2)}
                open={hover === node.id}
                onOpen={() => setHover(node.id)}
                onClose={() => setHover((h) => (h === node.id ? null : h))}
                byId={byId}
                allocation={allocation}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TalentIcon({
  node,
  rank,
  left,
  top,
  tooltipLeft,
  open,
  onOpen,
  onClose,
  byId,
  allocation,
}: {
  node: TalentNode
  rank: number
  left: number
  top: number
  tooltipLeft: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  byId: Map<number, TalentNode>
  allocation: Allocation
}) {
  const t = useT()
  const maxed = rank >= node.maxRank
  const border = maxed ? "var(--color-gold)" : rank > 0 ? "var(--color-gain)" : "var(--color-divider)"

  return (
    <div className="absolute" style={{ left, top, width: ICON, height: ICON, zIndex: open ? 20 : 1 }}>
      <button
        type="button"
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
        onFocus={onOpen}
        onBlur={onClose}
        className="relative block h-full w-full overflow-hidden border-2 bg-surface"
        style={{
          borderColor: border,
          filter: rank > 0 ? undefined : "grayscale(1)",
          opacity: rank > 0 ? 1 : 0.5,
        }}
        aria-label={`${node.name}, ${t("talents.rank", { rank, max: node.maxRank })}`}
      >
        {node.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.icon} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="line-clamp-3 px-0.5 text-[8px] leading-[1.1]">{node.name}</span>
        )}
      </button>

      {/* Rang unten rechts, ausserhalb des Graufilters */}
      <span
        className="pointer-events-none absolute -bottom-1.5 -right-1.5 border bg-ground px-1 text-[10px] font-extrabold leading-[14px]"
        style={{ borderColor: border, color: maxed ? "var(--color-gold)" : rank > 0 ? "var(--color-gain)" : undefined, fontVariantNumeric: "tabular-nums" }}
      >
        {`${rank}/${node.maxRank}`}
      </span>

      {open && (
        <Tooltip
          node={node}
          rank={rank}
          left={tooltipLeft}
          // Nur unerfüllte Voraussetzungen – wie im Client
          missing={node.requires
            .map((id) => byId.get(id))
            .filter((req): req is TalentNode => req !== undefined && (allocation[req.id] ?? 0) < req.maxRank)}
        />
      )}
    </div>
  )
}

function Tooltip({
  node,
  rank,
  left,
  missing,
}: {
  node: TalentNode
  rank: number
  left: boolean
  missing: TalentNode[]
}) {
  const t = useT()
  // Ohne Punkt zeigt der Tooltip Rang 1 – das, was man bekäme
  const current = node.ranks.find((r) => r.rank === Math.max(1, rank)) ?? null
  const next = rank > 0 ? node.ranks.find((r) => r.rank === rank + 1) ?? null : null

  return (
    <div
      role="tooltip"
      className="absolute top-0 w-64 border-2 border-line bg-ground px-3 py-2 text-[12px] shadow-lg"
      style={left ? { right: ICON + 10 } : { left: ICON + 10 }}
    >
      <div className="font-heading text-[13px] font-extrabold">{node.name}</div>
      <div className="eyebrow mt-0.5">{t("talents.rank", { rank, max: node.maxRank })}</div>
      {current?.description && <p className="mt-1.5 opacity-85">{current.description}</p>}
      {next?.description && (
        <p className="mt-1.5 opacity-65">
          <span className="eyebrow mr-1">{t("talents.nextRank")}</span>
          {next.description}
        </p>
      )}
      {missing.map((req) => (
        <p key={req.id} className="mt-1.5" style={{ color: "var(--color-loss)" }}>
          {t("talents.requires", { name: req.name })}
        </p>
      ))}
    </div>
  )
}
