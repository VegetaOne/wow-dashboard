"use client"

import { useMemo, useState } from "react"
import type { ReputationView } from "@/lib/reputations"
import { tierProgress } from "@/lib/reputations"
import { formatNumber } from "@/lib/format"
import { useT } from "./I18nProvider"

const PAGE = 40

export function ReputationList({
  reputations,
}: {
  reputations: ReputationView[]
}) {
  const t = useT()
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
        {t("reputation.none")}
      </div>
    )
  }

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          {t("reputation.factions")}
        </span>
        <span className="eyebrow">
          {withParagon > 0
            ? t("reputation.factionCountParagon", {
                count: formatNumber(reputations.length),
                paragon: formatNumber(withParagon),
              })
            : t("reputation.factionCount", {
                count: formatNumber(reputations.length),
              })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <input
          className="input max-w-[220px]"
          placeholder={t("reputation.searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE)
          }}
        />
        <span className="ml-auto eyebrow">
          {filtered.length === reputations.length
            ? t("reputation.entryCount", { count: formatNumber(filtered.length) })
            : t("reputation.countOfTotal", {
                count: formatNumber(filtered.length),
                total: formatNumber(reputations.length),
              })}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="px-4 py-6 text-[13px] opacity-55">
          {t("reputation.noMatch")}
        </div>
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
                {t("reputation.showMore", {
                  count: formatNumber(
                    Math.min(PAGE, filtered.length - shown.length)
                  ),
                })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReputationRow({ rep }: { rep: ReputationView }) {
  const t = useT()
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
            {t("reputation.valueOfMax", {
              value: formatNumber(rep.value),
              max: formatNumber(rep.max),
            })}
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
          <span className="eyebrow flex-none">{t("reputation.paragon")}</span>
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
            {t("reputation.valueOfMax", {
              value: formatNumber(rep.paragon.value),
              max: formatNumber(rep.paragon.max),
            })}
          </span>
        </div>
      )}
    </div>
  )
}
