"use client"

import { useCallback, useRef, useState } from "react"
import type { GameMode } from "@/lib/battlenet"
import type {
  AchievementSummary,
  CategoryProgress,
  CategoryCatalog,
} from "@/lib/achievements"
import { formatNumber, formatDate } from "@/lib/format"

export function AchievementsPanel({
  summary,
  mode,
}: {
  summary: AchievementSummary
  mode: GameMode
}) {
  const [catalogs, setCatalogs] = useState<Record<number, CategoryCatalog | null>>({})
  const [loading, setLoading] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const requested = useRef<Set<number>>(new Set())

  const earned = new Set(summary.earnedIds)

  const loadCatalog = useCallback(
    async (categoryId: number) => {
      if (requested.current.has(categoryId)) return
      requested.current.add(categoryId)
      setLoading(categoryId)

      try {
        const res = await fetch(
          `/api/wow/achievement-category?categoryId=${categoryId}&mode=${mode}`
        )
        const data = await res.json()
        setCatalogs((prev) => ({ ...prev, [categoryId]: data.catalog ?? null }))
      } catch {
        requested.current.delete(categoryId)
        setCatalogs((prev) => ({ ...prev, [categoryId]: null }))
      } finally {
        setLoading(null)
      }
    },
    [mode]
  )

  function toggle(categoryId: number) {
    const next = open === categoryId ? null : categoryId
    setOpen(next)
    if (next !== null) loadCatalog(next)
  }

  return (
    <div className="space-y-8">
      {/* Kennzahlen */}
      <div className="grid grid-cols-2 border-2 border-line lg:grid-cols-3">
        <Stat label="Erfolgspunkte" value={summary.totalPoints} />
        <Stat label="Erfolge" value={summary.totalQuantity} />
        <Stat label="Kategorien" value={summary.categories.length} />
      </div>

      {/* Zuletzt erreicht */}
      {summary.recent.length > 0 && (
        <section className="border-2 border-line">
          <div className="border-b border-line px-4 py-2">
            <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
              Zuletzt erreicht
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {summary.recent.slice(0, 12).map((r) => (
              <li
                key={`${r.id}-${r.at ?? 0}`}
                className="flex flex-wrap items-baseline gap-x-3 border-b border-line px-4 py-2 text-[13px] last:border-0"
              >
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="w-20 flex-none text-right text-[11px] opacity-50">
                  {formatDate(r.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Kategorien */}
      <section>
        <h4 className="mb-3">Nach Kategorie</h4>

        {summary.categories.length === 0 ? (
          <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
            Die API liefert keinen Fortschritt je Kategorie für diesen Charakter.
          </div>
        ) : (
          <div className="border-2 border-line">
            {summary.categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                isOpen={open === cat.id}
                isLoading={loading === cat.id}
                catalog={catalogs[cat.id]}
                hasCatalog={cat.id in catalogs}
                earned={earned}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="border-r border-line px-6 py-4 last:border-r-0">
      <span className="eyebrow">{label}</span>
      <div className="font-heading text-[30px] font-extrabold leading-none tracking-[-0.02em]">
        {formatNumber(value)}
      </div>
    </div>
  )
}

function CategoryRow({
  category,
  isOpen,
  isLoading,
  catalog,
  hasCatalog,
  earned,
  onToggle,
}: {
  category: CategoryProgress
  isOpen: boolean
  isLoading: boolean
  catalog: CategoryCatalog | null | undefined
  hasCatalog: boolean
  earned: Set<number>
  onToggle: (categoryId: number) => void
}) {
  // Der Fortschritt kommt aus der Charakterantwort. Die Gesamtmenge kennen
  // wir erst nach dem Aufklappen – vorher wird keine Quote gezeigt.
  const total = catalog?.achievements.length ?? null
  const done = catalog
    ? catalog.achievements.filter((a) => earned.has(a.id)).length
    : null
  const pct =
    total !== null && total > 0 && done !== null
      ? Math.round((done / total) * 100)
      : null

  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => onToggle(category.id)}
        aria-expanded={isOpen}
        className="w-full px-4 py-2.5 text-left hover:bg-ink/5"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="min-w-0 flex-1 truncate text-[13px]">
            {category.name}
          </span>

          <span className="eyebrow">
            {`${formatNumber(category.quantity)} erreicht · ${formatNumber(category.points)} Punkte`}
          </span>

          {pct !== null && (
            <span className="font-heading text-[13px] font-extrabold">
              {`${done} / ${total} (${pct}%)`}
            </span>
          )}

          <span className="w-4 flex-none text-center text-[12px] opacity-55">
            {isOpen ? "−" : "+"}
          </span>
        </div>

        {pct !== null && (
          <div className="mt-1.5 h-1.5 bg-neutral-300">
            <div
              className="h-1.5"
              style={{ width: `${pct}%`, background: "var(--faction-alliance)" }}
            />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-line bg-surface px-4 py-3">
          {isLoading && (
            <span className="text-[13px] opacity-55">Lade Erfolgsliste…</span>
          )}

          {!isLoading && hasCatalog && !catalog && (
            <span className="text-[12px] opacity-60">
              Für diese Kategorie liefert die API keine Erfolgsliste — es lässt
              sich also nicht sagen, was noch fehlt.
            </span>
          )}

          {!isLoading && catalog && (
            <CategoryDetail catalog={catalog} earned={earned} />
          )}
        </div>
      )}
    </div>
  )
}

function CategoryDetail({
  catalog,
  earned,
}: {
  catalog: CategoryCatalog
  earned: Set<number>
}) {
  const [showMissing, setShowMissing] = useState(true)

  const done = catalog.achievements.filter((a) => earned.has(a.id))
  const missing = catalog.achievements.filter((a) => !earned.has(a.id))
  const shown = showMissing ? missing : done

  if (catalog.achievements.length === 0) {
    return (
      <div>
        <span className="text-[12px] opacity-60">
          Diese Kategorie enthält keine eigenen Erfolge
          {catalog.subcategories.length > 0 && ", nur Unterkategorien"}.
        </span>
        {catalog.subcategories.length > 0 && (
          <ul className="mt-2 m-0 list-none p-0">
            {catalog.subcategories.map((s) => (
              <li key={s.id} className="py-0.5 text-[12px] opacity-75">
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex">
        {([
          ["missing", `Fehlt (${missing.length})`] as const,
          ["done", `Erreicht (${done.length})`] as const,
        ]).map(([id, label]) => {
          const active = (id === "missing") === showMissing
          return (
            <button
              key={id}
              onClick={() => setShowMissing(id === "missing")}
              className="-ml-px border border-line px-3 py-1 font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]"
              style={{
                background: active ? "var(--color-text)" : "transparent",
                color: active ? "var(--color-bg)" : "var(--color-text)",
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <span className="text-[12px] opacity-55">
          {showMissing ? "Alle Erfolge dieser Kategorie erreicht." : "Noch keiner erreicht."}
        </span>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-x-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {shown.slice(0, 90).map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 py-0.5 text-[12px]"
              style={{ opacity: showMissing ? 0.6 : 1 }}
            >
              <span
                className="h-2 w-2 flex-none border"
                style={{
                  borderColor: showMissing ? "var(--color-divider)" : "transparent",
                  background: showMissing ? "transparent" : "var(--faction-alliance)",
                }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate" title={a.name}>
                {a.name}
              </span>
              {a.points !== null && a.points > 0 && (
                <span className="flex-none eyebrow">{`${a.points}P`}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {shown.length > 90 && (
        <span className="mt-2 block eyebrow">
          {`${shown.length - 90} weitere nicht angezeigt`}
        </span>
      )}
    </div>
  )
}
