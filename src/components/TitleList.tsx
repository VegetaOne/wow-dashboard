"use client"

import { useMemo, useState } from "react"
import type { TitleView } from "@/lib/collections"

/**
 * Freigeschaltete Titel. Eine Fehlliste gibt es hier absichtlich nicht:
 * der Titel-Index enthält auch Titel, die für diese Klasse oder Fraktion
 * nie erreichbar sind – eine Quote daraus wäre irreführend.
 */
export function TitleList({ view }: { view: TitleView }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return view.titles
    return view.titles.filter((t) => t.name.toLowerCase().includes(q))
  }, [view.titles, query])

  const active = view.titles.find((t) => t.id === view.activeTitleId)

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          Titel
        </span>
        <span className="font-heading text-[13px] font-extrabold">
          {`${view.titles.length} freigeschaltet`}
        </span>
      </div>

      {active && (
        <div className="border-b border-line px-4 py-2.5">
          <span className="eyebrow block">Aktiv getragen</span>
          <span
            className="font-heading text-[14px] font-extrabold"
            style={{ color: "var(--color-accent)" }}
          >
            {active.name}
          </span>
        </div>
      )}

      {view.titles.length === 0 ? (
        <div className="px-4 py-4 text-[13px] opacity-55">
          Noch keine Titel freigeschaltet.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
            <input
              className="input max-w-[200px]"
              placeholder="Titel suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="ml-auto eyebrow">
              {filtered.length === view.titles.length
                ? `${filtered.length} Titel`
                : `${filtered.length} von ${view.titles.length}`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-[13px] opacity-55">Kein Treffer.</div>
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-x-4 px-4 py-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => {
                const isActive = t.id === view.activeTitleId
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 py-0.5 text-[12px]"
                  >
                    <span
                      className="h-2 w-2 flex-none"
                      style={{
                        background: isActive
                          ? "var(--color-accent)"
                          : "var(--faction-alliance)",
                      }}
                      aria-hidden
                    />
                    <span className="truncate" title={t.name}>
                      {t.name}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
