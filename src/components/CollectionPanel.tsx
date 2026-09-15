"use client"

import { useMemo, useState } from "react"
import type { CollectionView, CollectibleEntry } from "@/lib/collections"

type Filter = "collected" | "missing"

/**
 * Eine Sammlung mit Fortschritt und Fehlliste.
 *
 * Fehlen die Stammdaten (`hasTotal === false`), wird kein Prozentwert
 * gezeigt: ohne Gesamtmenge wäre jede Quote geraten.
 */
export function CollectionPanel({
  view,
  pageSize = 60,
}: {
  view: CollectionView
  pageSize?: number
}) {
  const [filter, setFilter] = useState<Filter>("collected")
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(pageSize)

  const source = filter === "collected" ? view.collected : view.missing

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return source
    return source.filter((e) => e.name.toLowerCase().includes(q))
  }, [source, query])

  const shown = filtered.slice(0, limit)
  const pct = view.hasTotal
    ? Math.round((view.collected.length / view.all.length) * 100)
    : null

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          {view.label}
        </span>
        <span className="font-heading text-[13px] font-extrabold">
          {view.hasTotal
            ? `${view.collected.length} / ${view.all.length} (${pct}%)`
            : `${view.collected.length} gesammelt`}
        </span>
      </div>

      {pct !== null && (
        <div className="h-1.5 bg-neutral-300">
          <div
            className="h-1.5"
            style={{ width: `${pct}%`, background: "var(--faction-alliance)" }}
          />
        </div>
      )}

      {/* Ohne Stammdaten offen sagen, dass keine Fehlliste möglich ist */}
      {!view.hasTotal && (
        <div className="border-b border-line px-4 py-2">
          <span className="text-[12px] opacity-60">
            Die Stammdaten für diese Sammlung sind nicht abrufbar — es lässt sich
            deshalb nicht sagen, was noch fehlt.
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <div className="flex">
          {([
            ["collected", `Gesammelt (${view.collected.length})`] as const,
            ...(view.hasTotal
              ? [["missing", `Fehlt (${view.missing.length})`] as const]
              : []),
          ]).map(([id, label]) => {
            const active = filter === id
            return (
              <button
                key={id}
                onClick={() => {
                  setFilter(id)
                  setLimit(pageSize)
                }}
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

        <input
          className="input max-w-[200px]"
          placeholder="Suchen…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(pageSize)
          }}
        />

        <span className="ml-auto eyebrow">
          {filtered.length === source.length
            ? `${filtered.length} Einträge`
            : `${filtered.length} von ${source.length}`}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="px-4 py-6 text-[13px] opacity-55">
          {query ? "Kein Treffer." : "Nichts vorhanden."}
        </div>
      ) : (
        <>
          <ul className="m-0 grid list-none grid-cols-1 gap-x-4 px-4 py-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((e) => (
              <EntryRow key={e.id} entry={e} dim={filter === "missing"} />
            ))}
          </ul>

          {/* Stapelweise nachladen statt tausend Zeilen auf einmal */}
          {filtered.length > shown.length && (
            <div className="border-t border-line px-4 py-2.5">
              <button
                onClick={() => setLimit((l) => l + pageSize)}
                className="btn btn-secondary text-[12px]"
              >
                {`Weitere ${Math.min(pageSize, filtered.length - shown.length)} anzeigen`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EntryRow({ entry, dim }: { entry: CollectibleEntry; dim: boolean }) {
  // Gesammelt aber nicht nutzbar: kommt bei Reittieren vor, deren
  // Anforderung der Charakter nicht erfüllt
  const notUsable = entry.usable === false

  return (
    <li
      className="flex items-center gap-2 py-0.5 text-[12px]"
      style={{ opacity: dim ? 0.55 : 1 }}
    >
      <span
        className="h-2 w-2 flex-none border"
        style={{
          borderColor: dim ? "var(--color-divider)" : "transparent",
          background: dim
            ? "transparent"
            : notUsable
              ? "var(--color-neutral-300)"
              : "var(--faction-alliance)",
        }}
        aria-hidden
      />
      <span className="truncate" title={entry.name}>
        {entry.name}
      </span>
      {notUsable && <span className="eyebrow flex-none">nicht nutzbar</span>}
    </li>
  )
}
