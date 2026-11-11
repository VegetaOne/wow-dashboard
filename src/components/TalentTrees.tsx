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
 * Die drei Talentbäume einer Klasse.
 *
 * Gezeichnet wird nach `display_row`/`display_col` der API, nicht nach den
 * Pixelkoordinaten: das Raster ist das, was man im Spiel sieht, und bleibt
 * auf jeder Breite gleich. Voraussetzungen als Linien von oben nach unten.
 *
 * Bewusst ohne Icons: die Zauber-Medien sind für Forever nicht belegt, und
 * je Knoten ein Abruf wären rund fünfzig pro Seite.
 */

const STEP_X = 78
const STEP_Y = 66
const NODE_W = 66
const NODE_H = 52

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
        <span className="font-heading font-extrabold">
          {total > 0 ? t("talents.spentTotal", { points: f.number(total) }) : t("talents.noneSpent")}
        </span>
        {total > 0 && (
          <span className="opacity-60">
            {talents.trees
              .map((tree) => t("talents.inTree", { points: f.number(pointsInTree(tree, allocation)), tree: tree.name }))
              .join(" · ")}
          </span>
        )}
      </div>

      {unmatched > 0 && (
        <div className="mb-4 border-2 border-line px-4 py-2 text-[12px] opacity-75">
          {t("talents.unmatched", { count: f.number(unmatched) })}
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        {talents.trees.map((tree) => (
          <TreeView key={tree.specId} tree={tree} allocation={allocation} />
        ))}
      </div>
    </div>
  )
}

function TreeView({ tree, allocation }: { tree: TalentTree; allocation: Allocation }) {
  const t = useT()
  const f = useFormat()
  const [focus, setFocus] = useState<TalentNode | null>(null)
  const byId = new Map(tree.nodes.map((n) => [n.id, n]))

  const width = Math.max(1, tree.cols) * STEP_X
  const height = Math.max(1, tree.rows) * STEP_Y
  const center = (n: TalentNode) => ({
    x: (n.col - 1) * STEP_X + NODE_W / 2,
    y: (n.row - 1) * STEP_Y + NODE_H / 2,
  })

  return (
    <div className="border-2 border-line">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2">
        <span className="font-heading text-[14px] font-extrabold">{tree.name}</span>
        <span className="eyebrow" style={{ fontVariantNumeric: "tabular-nums" }}>
          {f.number(pointsInTree(tree, allocation))}
        </span>
      </div>

      <div className="p-3">
        <div className="relative" style={{ width, height }}>
          {/* Voraussetzungen */}
          <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
            {tree.nodes.flatMap((node) =>
              node.requires
                .map((id) => byId.get(id))
                .filter((req): req is TalentNode => req !== undefined)
                .map((req) => {
                  const a = center(req)
                  const b = center(node)
                  const met = (allocation[req.id] ?? 0) >= req.maxRank
                  return (
                    <line
                      key={`${req.id}-${node.id}`}
                      x1={a.x}
                      y1={a.y + NODE_H / 2}
                      x2={b.x}
                      y2={b.y - NODE_H / 2}
                      stroke={met ? "var(--color-accent)" : "var(--color-divider)"}
                      strokeWidth={2}
                    />
                  )
                })
            )}
          </svg>

          {tree.nodes.map((node) => {
            const rank = allocation[node.id] ?? 0
            const maxed = rank >= node.maxRank
            return (
              <button
                key={node.id}
                type="button"
                onMouseEnter={() => setFocus(node)}
                onFocus={() => setFocus(node)}
                className="absolute flex flex-col justify-between border-2 px-1 py-0.5 text-left"
                style={{
                  left: (node.col - 1) * STEP_X,
                  top: (node.row - 1) * STEP_Y,
                  width: NODE_W,
                  height: NODE_H,
                  borderColor: rank > 0 ? "var(--color-accent)" : "var(--color-divider)",
                  background: maxed ? "var(--color-accent-100)" : "var(--color-surface)",
                  opacity: rank > 0 ? 1 : 0.6,
                }}
                aria-label={`${node.name}, ${t("talents.rank", { rank, max: node.maxRank })}`}
              >
                <span className="line-clamp-2 text-[10px] leading-[1.15]">{node.name}</span>
                <span
                  className="self-end text-[10px] font-extrabold"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {`${rank}/${node.maxRank}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <NodeDetails node={focus} allocation={allocation} byId={byId} />
    </div>
  )
}

function NodeDetails({
  node,
  allocation,
  byId,
}: {
  node: TalentNode | null
  allocation: Allocation
  byId: Map<number, TalentNode>
}) {
  const t = useT()
  if (!node) {
    return (
      <div className="border-t border-line px-3 py-2 text-[12px] opacity-50">
        {t("talents.hoverHint")}
      </div>
    )
  }

  const rank = allocation[node.id] ?? 0
  const current = node.ranks.find((r) => r.rank === rank) ?? null
  const next = node.ranks.find((r) => r.rank === rank + 1) ?? null

  return (
    <div className="border-t border-line px-3 py-2 text-[12px]" style={{ maxWidth: Math.max(240, STEP_X * 4) }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading font-extrabold">{node.name}</span>
        <span className="eyebrow">{t("talents.rank", { rank, max: node.maxRank })}</span>
      </div>
      {current?.description && <p className="mt-1 opacity-80">{current.description}</p>}
      {next?.description && (
        <p className="mt-1 opacity-60">
          <span className="eyebrow mr-1">{t("talents.nextRank")}</span>
          {next.description}
        </p>
      )}
      {node.requires.map((id) => {
        const req = byId.get(id)
        return req ? (
          <p key={id} className="mt-1 opacity-60">
            {t("talents.requires", { name: req.name })}
          </p>
        ) : null
      })}
    </div>
  )
}
