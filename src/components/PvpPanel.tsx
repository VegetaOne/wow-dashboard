"use client"

import { useState } from "react"
import type { BracketView, PvpSummaryView, MatchRecord } from "@/lib/pvp"
import { winRate } from "@/lib/pvp"
import { useFormat } from "./I18nProvider"

const MAP_PAGE = 12

export function PvpPanel({
  summary,
  brackets,
}: {
  summary: PvpSummaryView
  brackets: BracketView[]
}) {
  return (
    <div className="space-y-10">
      <section>
        <Honor summary={summary} />
      </section>

      <section>
        <h4 className="mb-3">Gewertete Klassen</h4>
        <Brackets brackets={brackets} />
      </section>

      <section>
        <h4 className="mb-3">Schlachtfelder</h4>
        <MapStats maps={summary.maps} />
      </section>
    </div>
  )
}

// ─── Ehre ─────────────────────────────────────────────────────────────────────

function Honor({ summary }: { summary: PvpSummaryView }) {
  const f = useFormat()
  const hasAny =
    summary.honorLevel !== null || summary.honorableKills !== null

  if (!hasAny) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        Die API liefert für diesen Charakter keine Ehre-Werte.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {summary.honorLevel !== null && (
        <Stat label="Ehrestufe" value={f.number(summary.honorLevel)} />
      )}
      {summary.honorableKills !== null && (
        <Stat
          label="Ehrenhafte Siege"
          value={f.number(summary.honorableKills)}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-line px-4 py-3">
      <span className="eyebrow block">{label}</span>
      <span
        className="font-heading text-[26px] font-extrabold leading-tight tracking-[-0.02em]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Wertungen ────────────────────────────────────────────────────────────────

function Brackets({ brackets }: { brackets: BracketView[] }) {
  const f = useFormat()
  if (brackets.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        Keine gewertete Klasse gespielt. Die API antwortet für ungespielte
        Klassen mit 404 — das ist kein Fehler, sondern heisst „nie angetreten".
      </div>
    )
  }

  return (
    <div className="border-2 border-line">
      {brackets.map((b) => (
        <div
          key={b.slug}
          className="border-b border-line px-4 py-3 last:border-0"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="min-w-0 flex-1 basis-[180px] text-[13px]">
              {b.label}
            </span>

            <span className="flex flex-none items-baseline gap-2">
              <span className="eyebrow">Wertung</span>
              {b.rating !== null ? (
                <span
                  className="font-heading text-[18px] font-extrabold tracking-[-0.01em]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {f.number(b.rating)}
                </span>
              ) : (
                <span className="text-[13px] opacity-40">—</span>
              )}
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            <RecordRow label="Saison" record={b.season} />
            <RecordRow label="Diese Woche" record={b.weekly} />
          </div>
        </div>
      ))}
    </div>
  )
}

function RecordRow({
  label,
  record,
}: {
  label: string
  record: MatchRecord | null
}) {
  const f = useFormat()
  if (!record) {
    return (
      <div className="flex items-baseline gap-2 text-[12px]">
        <span className="eyebrow w-24 flex-none">{label}</span>
        <span className="opacity-40">keine Angabe</span>
      </div>
    )
  }

  const rate = winRate(record)

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px]">
      <span className="eyebrow w-24 flex-none">{label}</span>

      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {`${f.number(record.won)} Siege · ${f.number(record.lost)} Niederlagen`}
      </span>

      {/* Quote nur bei mindestens einem Spiel – 0 von 0 ist keine 0 % */}
      {rate !== null ? (
        <span className="ml-auto flex flex-none items-center gap-2">
          <span className="h-1.5 w-24 bg-neutral-300">
            <span
              className="block h-1.5"
              style={{
                width: `${rate}%`,
                background: "var(--faction-alliance)",
              }}
            />
          </span>
          <span
            className="w-10 text-right opacity-70"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {`${rate} %`}
          </span>
        </span>
      ) : (
        <span className="ml-auto flex-none opacity-40">
          {`${f.number(record.played)} Spiele`}
        </span>
      )}
    </div>
  )
}

// ─── Schlachtfelder ───────────────────────────────────────────────────────────

function MapStats({ maps }: { maps: PvpSummaryView["maps"] }) {
  const f = useFormat()
  const [limit, setLimit] = useState(MAP_PAGE)
  const shown = maps.slice(0, limit)

  if (maps.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        Keine Schlachtfeld-Statistik vorhanden.
      </div>
    )
  }

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          Nach Schlachtfeld
        </span>
        <span className="eyebrow">
          {`${f.number(maps.length)} Schlachtfelder · meistgespielte zuerst`}
        </span>
      </div>

      {shown.map((m) => {
        const rate = winRate(m)
        return (
          <div
            key={m.name}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 last:border-0"
          >
            <span className="min-w-0 flex-1 basis-[160px] truncate text-[13px]">
              {m.name}
            </span>

            <span
              className="flex-none text-[12px] opacity-70"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {`${f.number(m.won)} / ${f.number(m.played)}`}
            </span>

            {rate !== null ? (
              <span className="flex flex-none items-center gap-2">
                <span className="h-1.5 w-24 bg-neutral-300">
                  <span
                    className="block h-1.5"
                    style={{
                      width: `${rate}%`,
                      background: "var(--faction-alliance)",
                    }}
                  />
                </span>
                <span
                  className="w-10 text-right text-[12px] opacity-70"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {`${rate} %`}
                </span>
              </span>
            ) : (
              <span className="flex-none text-[12px] opacity-40">
                noch nicht betreten
              </span>
            )}
          </div>
        )
      })}

      {maps.length > shown.length && (
        <div className="border-t border-line px-4 py-2.5">
          <button
            onClick={() => setLimit((l) => l + MAP_PAGE)}
            className="btn btn-secondary text-[12px]"
          >
            {`Weitere ${f.number(Math.min(MAP_PAGE, maps.length - shown.length))} anzeigen`}
          </button>
        </div>
      )}
    </div>
  )
}
