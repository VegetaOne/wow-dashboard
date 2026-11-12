"use client"

import { useState } from "react"
import { useFormat, useT } from "./I18nProvider"
import {
  MAX_POINTS,
  POINTS_PER_ROW,
  addBlock,
  canRemove,
  compareAllocations,
  nodeStatus,
  pointsInTree,
  totalPoints,
  type AddBlock,
  type Allocation,
  type ClassTalents,
  type NodeStatus,
  type TalentNode,
  type TalentTree,
} from "@/lib/talent-tree"

/**
 * Die drei Talentbäume einer Klasse, angelehnt an den Client: quadratische
 * Icons im Raster der API (`display_row`/`display_col`), Rang unten rechts,
 * Pfeile für Voraussetzungen, Beschreibung als Tooltip am Icon.
 *
 * Drei Arten, je nach Props:
 * - **Ansehen** (nur `allocation`): was gesetzt ist.
 * - **Planen** (`onChange`): Klick setzt einen Punkt, Rechtsklick oder
 *   Umschalt+Klick nimmt ihn weg; für Touch ein Umschalter „Entfernen".
 *   Regeln aus `talent-tree.ts`, angenommen.
 * - **Vergleichen** (`target`): der aktivierte Build gegen das, was im Spiel
 *   gesetzt ist – was noch fehlt, was passt, was anders sitzt.
 *
 * Nebeneinander in der Reihenfolge des Spiels; auf schmalen Bildschirmen
 * brechen die Bäume um. Fehlt ein Icon oder Hintergrund (für Forever nicht
 * belegt), steht der Name im Feld bzw. bleibt der Grund schlicht.
 */

const ICON = 44
const STEP_X = 72
const STEP_Y = 64
const PAD = 16

type Mode = "view" | "edit" | "compare"

interface Ctx {
  mode: Mode
  trees: TalentTree[]
  allocation: Allocation
  target: Allocation | null
  removing: boolean
  change: (node: TalentNode, tree: TalentTree, delta: 1 | -1) => void
}

export function TalentTrees({
  talents,
  allocation,
  unmatched = 0,
  target = null,
  onChange,
}: {
  talents: ClassTalents
  allocation: Allocation
  unmatched?: number
  target?: Allocation | null
  onChange?: (next: Allocation) => void
}) {
  const t = useT()
  const f = useFormat()
  const [removing, setRemoving] = useState(false)
  const mode: Mode = onChange ? "edit" : target ? "compare" : "view"
  const trees = talents.trees
  const total = totalPoints(trees, allocation)

  const change = (node: TalentNode, tree: TalentTree, delta: 1 | -1) => {
    if (!onChange) return
    if (delta > 0 && addBlock(trees, tree, allocation, node) !== null) return
    if (delta < 0 && !canRemove(tree, allocation, node)) return
    const rank = (allocation[node.id] ?? 0) + delta
    const next = { ...allocation }
    if (rank > 0) next[node.id] = rank
    else delete next[node.id]
    onChange(next)
  }

  const ctx: Ctx = { mode, trees, allocation, target, removing, change }

  // Gemeinsame Breite: die Spalten des breitesten Baums. Schmalere Bäume
  // werden darin mittig gesetzt (Spalten beginnen je Baum bei 1, talent-tree.ts)
  const cols = Math.max(1, ...trees.map((tree) => tree.cols))
  const diff = target ? compareAllocations(trees, allocation, target) : null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 text-[13px]">
        {mode === "edit" ? (
          <>
            <span className="font-heading font-extrabold">
              {t("planner.pointsUsed", { used: f.number(total), max: f.number(MAX_POINTS) })}
            </span>
            <span style={{ color: total > MAX_POINTS ? "var(--color-loss)" : undefined, opacity: total > MAX_POINTS ? 1 : 0.6 }}>
              {total > MAX_POINTS
                ? t("planner.pointsOver", { count: f.number(total - MAX_POINTS) })
                : t("planner.pointsLeft", { count: f.number(MAX_POINTS - total) })}
            </span>
          </>
        ) : diff ? (
          <>
            <span className="font-heading font-extrabold">
              {diff.missing > 0
                ? t("planner.compareMissing", { count: f.number(diff.missing) })
                : t("planner.compareComplete")}
            </span>
            {diff.extra > 0 && (
              <span style={{ color: "var(--color-loss)" }}>{t("planner.compareExtra", { count: f.number(diff.extra) })}</span>
            )}
          </>
        ) : (
          <span className="font-heading font-extrabold">
            {total > 0 ? t("talents.spentTotal", { points: f.number(total) }) : t("talents.noneSpent")}
          </span>
        )}
        {(total > 0 || target) && (
          <span className="opacity-60" style={{ fontVariantNumeric: "tabular-nums" }}>
            {trees
              .map((tree) =>
                target
                  ? `${f.number(pointsInTree(tree, allocation))}→${f.number(pointsInTree(tree, target))}`
                  : f.number(pointsInTree(tree, allocation))
              )
              .join(" / ")}
          </span>
        )}
      </div>

      {mode === "edit" && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-[12px]">
          <div className="flex">
            <button type="button" className="wb-tab" aria-pressed={!removing} onClick={() => setRemoving(false)}>
              {t("planner.modeAdd")}
            </button>
            <button type="button" className="wb-tab" aria-pressed={removing} onClick={() => setRemoving(true)}>
              {t("planner.modeRemove")}
            </button>
          </div>
          <span className="italic opacity-70">{t("planner.clickHint")}</span>
        </div>
      )}

      {mode === "compare" && <Legend />}

      {unmatched > 0 && (
        <div className="mx-auto mb-4 max-w-md border-2 border-line px-4 py-2 text-center text-[12px] opacity-75">
          {t("talents.unmatched", { count: f.number(unmatched) })}
        </div>
      )}

      {/* Alle Bäume gleich breit wie im Client (Raster des breitesten), jeder
          so schmal wie sein Inhalt, zusammen mittig */}
      <div className="flex flex-wrap items-start justify-center gap-6">
        {trees.map((tree) => (
          <TreeView key={tree.specId} tree={tree} cols={cols} ctx={ctx} />
        ))}
      </div>
    </div>
  )
}

const STATUS_COLOR: Record<NodeStatus, string> = {
  done: "var(--color-gain)",
  todo: "var(--wb-gold-lit)",
  extra: "var(--color-loss)",
  none: "var(--color-divider)",
}

function Legend() {
  const t = useT()
  const items: [NodeStatus, string, boolean][] = [
    ["todo", t("planner.legendTodo"), true],
    ["done", t("planner.legendDone"), false],
    ["extra", t("planner.legendExtra"), false],
  ]
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[12px]">
      {items.map(([status, label, dashed]) => (
        <span key={status} className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-3.5 w-3.5"
            style={{ border: `2px ${dashed ? "dashed" : "solid"} ${STATUS_COLOR[status]}` }}
          />
          {label}
        </span>
      ))}
    </div>
  )
}

function TreeView({ tree, cols, ctx }: { tree: TalentTree; cols: number; ctx: Ctx }) {
  const f = useFormat()
  const [hover, setHover] = useState<number | null>(null)
  const byId = new Map(tree.nodes.map((n) => [n.id, n]))
  // Pfeile folgen dem Build, den man ansteuert – im Vergleich dem Ziel
  const path = ctx.target ?? ctx.allocation
  const points = pointsInTree(tree, ctx.allocation)

  const width = cols * STEP_X - (STEP_X - ICON)
  const height = Math.max(1, tree.rows) * STEP_Y - (STEP_Y - ICON)
  // Schmalerer Baum: mittig im gemeinsamen Raster
  const offsetX = ((cols - Math.max(1, tree.cols)) * STEP_X) / 2
  const pos = (n: TalentNode) => ({ x: offsetX + (n.col - 1) * STEP_X, y: (n.row - 1) * STEP_Y })
  // Je Farbe ein Pfeilkopf: `context-stroke` können nicht alle Browser
  const markerMet = `talent-arrow-met-${tree.specId}`
  const markerOpen = `talent-arrow-open-${tree.specId}`

  return (
    <section className="flex-none border-2 border-line" style={{ width: width + PAD * 2 + 4 }}>
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-heading text-[15px] font-extrabold">{tree.name}</span>
        <span className="font-heading text-[15px] font-extrabold" style={{ fontVariantNumeric: "tabular-nums" }}>
          {ctx.target ? `${f.number(points)}→${f.number(pointsInTree(tree, ctx.target))}` : f.number(points)}
        </span>
      </div>

      {/* Hintergrund des Baums, gedämpft – die Icons müssen lesbar bleiben */}
      <div
        className="relative"
        style={{
          backgroundImage: tree.background
            ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${tree.background})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div style={{ padding: PAD }}>
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
                    const met = (path[req.id] ?? 0) >= req.maxRank
                    const color = met ? "var(--color-gold)" : "var(--color-divider)"
                    // Gleiche Spalte: senkrecht. Sonst erst waagrecht, dann hinunter.
                    const d =
                      a.x === b.x
                        ? `M${a.x + ICON / 2},${a.y + ICON} L${b.x + ICON / 2},${b.y - 2}`
                        : `M${a.x + (b.x > a.x ? ICON : 0)},${a.y + ICON / 2} L${b.x + ICON / 2},${a.y + ICON / 2} L${b.x + ICON / 2},${b.y - 2}`
                    return (
                      <path
                        key={`${req.id}-${node.id}`}
                        d={d}
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
                tree={tree}
                ctx={ctx}
                left={pos(node).x}
                top={pos(node).y}
                tooltipLeft={node.col > Math.ceil(tree.cols / 2)}
                open={hover === node.id}
                onOpen={() => setHover(node.id)}
                onClose={() => setHover((h) => (h === node.id ? null : h))}
                byId={byId}
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
  tree,
  ctx,
  left,
  top,
  tooltipLeft,
  open,
  onOpen,
  onClose,
  byId,
}: {
  node: TalentNode
  tree: TalentTree
  ctx: Ctx
  left: number
  top: number
  tooltipLeft: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  byId: Map<number, TalentNode>
}) {
  const t = useT()
  const rank = ctx.allocation[node.id] ?? 0
  const targetRank = ctx.target ? ctx.target[node.id] ?? 0 : null
  const maxed = rank >= node.maxRank

  // Farbe, Strich und Sichtbarkeit je Art
  let border = maxed ? "var(--color-gold)" : rank > 0 ? "var(--color-gain)" : "var(--color-divider)"
  let dashed = false
  let lit = rank > 0
  let badge = `${rank}/${node.maxRank}`
  let badgeColor: string | undefined = maxed ? "var(--color-gold)" : rank > 0 ? "var(--color-gain)" : undefined
  let block: AddBlock | null = null
  let status: NodeStatus | null = null

  if (ctx.mode === "edit") {
    block = addBlock(ctx.trees, tree, ctx.allocation, node)
    // Setzbar, aber noch leer: farbig wie im Client, damit man sieht, was offen ist
    if (rank === 0 && block === null) lit = true
  } else if (targetRank !== null) {
    status = nodeStatus(rank, targetRank)
    border = STATUS_COLOR[status]
    dashed = status === "todo"
    lit = status === "todo" || status === "done"
    badge = targetRank > 0 ? `${rank}/${targetRank}` : `${rank}`
    badgeColor = status === "none" ? undefined : STATUS_COLOR[status]
  }

  const onClick = (e: React.MouseEvent) => {
    if (ctx.mode !== "edit") return
    ctx.change(node, tree, e.shiftKey || ctx.removing ? -1 : 1)
  }
  const onContextMenu = (e: React.MouseEvent) => {
    if (ctx.mode !== "edit") return
    e.preventDefault()
    ctx.change(node, tree, -1)
  }

  return (
    <div className="absolute" style={{ left, top, width: ICON, height: ICON, zIndex: open ? 20 : 1 }}>
      <button
        type="button"
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
        onFocus={onOpen}
        onBlur={onClose}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className="relative block h-full w-full overflow-hidden bg-surface"
        style={{
          border: `2px ${dashed ? "dashed" : "solid"} ${border}`,
          // „Anders gesetzt" bleibt deutlich sichtbar, nur das Bild grau
          opacity: lit || status === "extra" ? 1 : 0.45,
          cursor: ctx.mode === "edit" ? "pointer" : "default",
          animation: status === "todo" ? "wbEmber 2.4s ease-in-out infinite" : undefined,
        }}
        aria-label={`${node.name}, ${t("talents.rank", { rank, max: node.maxRank })}`}
      >
        {/* Graufilter nur aufs Bild – der Rahmen trägt die Farbe des Zustands */}
        {node.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.icon} alt="" className="h-full w-full object-cover" loading="lazy" style={{ filter: lit ? undefined : "grayscale(1)" }} />
        ) : (
          <span className="line-clamp-3 px-0.5 text-[8px] leading-[1.1]" style={{ filter: lit ? undefined : "grayscale(1)" }}>
            {node.name}
          </span>
        )}
      </button>

      {/* Rang unten rechts, ausserhalb des Graufilters */}
      <span
        className="pointer-events-none absolute -bottom-1.5 -right-1.5 border bg-ground px-1 text-[10px] font-extrabold leading-[14px]"
        style={{ borderColor: border, color: badgeColor, fontVariantNumeric: "tabular-nums" }}
      >
        {badge}
      </span>

      {open && (
        <Tooltip
          node={node}
          rank={rank}
          targetRank={targetRank}
          status={status}
          block={rank === 0 ? block : null}
          rowPoints={(node.row - 1) * POINTS_PER_ROW}
          left={tooltipLeft}
          // Nur unerfüllte Voraussetzungen – wie im Client. Im Vergleich die des Builds.
          missing={node.requires
            .map((id) => byId.get(id))
            .filter(
              (req): req is TalentNode =>
                req !== undefined && ((ctx.target ?? ctx.allocation)[req.id] ?? 0) < req.maxRank
            )}
        />
      )}
    </div>
  )
}

function Tooltip({
  node,
  rank,
  targetRank,
  status,
  block,
  rowPoints,
  left,
  missing,
}: {
  node: TalentNode
  rank: number
  targetRank: number | null
  status: NodeStatus | null
  block: AddBlock | null
  rowPoints: number
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
      {targetRank !== null && status !== null && status !== "none" && (
        <div className="mt-1" style={{ color: STATUS_COLOR[status] }}>
          {status === "todo"
            ? t("planner.tipTodo", { rank: targetRank })
            : status === "done"
              ? t("planner.tipDone")
              : t("planner.tipExtra", { rank: targetRank })}
        </div>
      )}
      {current?.description && <p className="mt-1.5 opacity-85">{current.description}</p>}
      {next?.description && (
        <p className="mt-1.5 opacity-65">
          <span className="eyebrow mr-1">{t("talents.nextRank")}</span>
          {next.description}
        </p>
      )}
      {block === "rowLocked" && (
        <p className="mt-1.5" style={{ color: "var(--color-loss)" }}>
          {t("planner.tipRowLocked", { points: rowPoints })}
        </p>
      )}
      {block === "noPoints" && (
        <p className="mt-1.5" style={{ color: "var(--color-loss)" }}>
          {t("planner.tipNoPoints")}
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
