"use client"

import { useMemo, useState } from "react"
import type { ReputationView } from "@/lib/reputations"
import { tierProgress } from "@/lib/reputations"
import { formatNumber } from "@/lib/format"

const PAGE = 40

export function ReputationList({
  reputations,
}: {
  reputations: ReputationView[]
}) {
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(PAGE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return reputations
    return reputations.filter(
      (r) =>
        r.factionName.toLowerCase().includes(q) ||
        (r.standingName ?? "").toLowerCase().includes(q)
    )
  }, [reputations, query])

  const shown = filtered.slice(0, limit)
  const withParagon = reputations.filter((r) => r.paragon !== null).length

  if (reputations.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        Für diesen Charakter liefert die API kein Ansehen.
      </div>
    )
  }

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          Fraktionen
        </span>
        <span className="eyebrow">
          {withParagon > 0
            ? `${formatNumber(reputations.length)} Fraktionen · ${formatNumber(withParagon)} mit Paragon`
            : `${formatNumber(reputations.length)} Fraktionen`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <input
          className="input max-w-[220px]"
          placeholder="Fraktion oder Stufe suchen…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE)
          }}
        />
        <span className="ml-auto eyebrow">
          {filtered.length === reputations.length
            ? `${formatNumber(filtered.length)} Einträge`
            : `${formatNumber(filtered.length)} von ${formatNumber(reputations.length)}`}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="px-4 py-6 text-[13px] opacity-55">Kein Treffer.</div>
      ) : (
        <>
          {shown.map((rep) => (
            <ReputationRow key={rep.factionId} rep={rep} />
          ))}

          {filtered.length > shown.length && (
            <div className="border-t border-line px-4 py-2.5">
              <button
                onClick={() => setLimit((l) => l + PAGE)}
                className="btn btn-secondary text-[12px]"
              >
                {`Weitere ${formatNumber(Math.min(PAGE, filtered.length - shown.length))} anzeigen`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReputationRow({ rep }: { rep: ReputationView }) {
  const pct = tierProgress(rep)
  const paragonPct =
    rep.paragon && rep.paragon.max > 0
      ? Math.min(100, Math.round((rep.paragon.value / rep.paragon.max) * 100))
      : null

  return (
    <div className="border-b border-line px-4 py-2.5 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="min-w-0 flex-1 basis-[180px] truncate text-[13px]">
          {rep.factionName}
        </span>

        {rep.standingName && (
          <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]">
            {rep.standingName}
          </span>
        )}

        {/* Punkte nur zeigen, wenn beide Werte da sind – sonst wäre
            ein Bruch mit fehlendem Nenner irreführend */}
        {rep.value !== null && rep.max !== null && (
          <span
            className="w-24 flex-none text-right text-[12px] opacity-70"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {`${formatNumber(rep.value)} / ${formatNumber(rep.max)}`}
          </span>
        )}
      </div>

      {pct !== null && (
        <div className="mt-1.5 h-1.5 bg-neutral-300">
          <div
            className="h-1.5"
            style={{ width: `${pct}%`, background: "var(--faction-alliance)" }}
          />
        </div>
      )}

      {/* Paragon getrennt ausweisen: es ist kein weiterer Ansehensrang */}
      {rep.paragon && paragonPct !== null && (
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="eyebrow flex-none">Paragon</span>
          <span className="h-1.5 flex-1 bg-neutral-300">
            <span
              className="block h-1.5"
              style={{ width: `${paragonPct}%`, background: "var(--color-accent)" }}
            />
          </span>
          <span
            className="flex-none text-[11px] opacity-60"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {`${formatNumber(rep.paragon.value)} / ${formatNumber(rep.paragon.max)}`}
          </span>
        </div>
      )}
    </div>
  )
}
