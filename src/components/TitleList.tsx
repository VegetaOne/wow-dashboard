"use client"

import { useMemo, useState } from "react"
import type { TitleView } from "@/lib/collections"
import { useT } from "./I18nProvider"

/**
 * Freigeschaltete Titel. Eine Fehlliste gibt es hier absichtlich nicht:
 * der Titel-Index enthält auch Titel, die für diese Klasse oder Fraktion
 * nie erreichbar sind – eine Quote daraus wäre irreführend.
 */
export function TitleList({ view }: { view: TitleView }) {
  const t = useT()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return view.titles
    return view.titles.filter((title) => title.name.toLowerCase().includes(q))
  }, [view.titles, query])

  const active = view.titles.find((title) => title.id === view.activeTitleId)

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          {t("collections.titles")}
        </span>
        <span className="font-heading text-[13px] font-extrabold">
          {t("collections.titlesUnlocked", { count: view.titles.length })}
        </span>
      </div>

      {active && (
        <div className="border-b border-line px-4 py-2.5">
          <span className="eyebrow block">{t("collections.titleActive")}</span>
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
          {t("collections.titlesEmpty")}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
            <input
              className="input max-w-[200px]"
              placeholder={t("collections.titleSearchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="ml-auto eyebrow">
              {filtered.length === view.titles.length
                ? t("collections.titleCount", { count: filtered.length })
                : t("collections.countOfTotal", {
                    count: filtered.length,
                    total: view.titles.length,
                  })}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-4 text-[13px] opacity-55">
              {t("collections.noMatch")}
            </div>
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-x-4 px-4 py-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((title) => {
                const isActive = title.id === view.activeTitleId
                return (
                  <li
                    key={title.id}
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
                    <span className="truncate" title={title.name}>
                      {title.name}
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
