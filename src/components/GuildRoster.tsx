"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { GuildMember } from "@/lib/guild"
import { rankLabel } from "@/lib/guild"
import type { CharacterDetails, GameMode } from "@/lib/battlenet"
import { CLASS_COLORS, detailKey } from "@/lib/battlenet"
import { characterBase } from "@/lib/characterTabs"
import { useT, useFormat } from "./I18nProvider"

const PAGE = 40
/** Obergrenze der API-Route – mehr nimmt sie pro Anfrage nicht an. */
const BATCH = 40

export function GuildRoster({
  members,
  mode,
  /**
   * Die Classic-APIs führen keine Gegenstandsstufen. Dann gibt es den
   * Knopf gar nicht, statt ihn ins Leere laufen zu lassen.
   */
  canLoadItemLevels,
}: {
  members: GuildMember[]
  mode: GameMode
  canLoadItemLevels: boolean
}) {
  const t = useT()
  const f = useFormat()
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(PAGE)
  const [details, setDetails] = useState<Record<string, CharacterDetails>>({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.className ?? "").toLowerCase().includes(q) ||
        (m.raceName ?? "").toLowerCase().includes(q) ||
        rankLabel(m.rank).toLowerCase().includes(q)
    )
  }, [members, query])

  const shown = filtered.slice(0, limit)

  // Zeilen, die sichtbar sind und noch keine Gegenstandsstufe haben
  const pending = shown.filter((m) => !(detailKey(m.realmSlug, m.name) in details))

  async function loadItemLevels() {
    const batch = pending.slice(0, BATCH)
    if (batch.length === 0) return

    setLoading(true)
    setLoadError(null)

    try {
      const res = await fetch("/api/wow/character-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          characters: batch.map((m) => ({ realm: m.realmSlug, name: m.name })),
        }),
      })

      if (!res.ok) throw new Error(`Status ${res.status}`)

      const data = (await res.json()) as {
        details?: Record<string, CharacterDetails>
      }

      // Auch Mitglieder ohne Antwort merken – sonst fragt der Knopf sie
      // bei jedem Klick erneut an, obwohl ihr Profil nicht abrufbar ist.
      const merged: Record<string, CharacterDetails> = {}
      for (const m of batch) merged[detailKey(m.realmSlug, m.name)] = {}
      Object.assign(merged, data.details ?? {})

      setDetails((prev) => ({ ...prev, ...merged }))
    } catch {
      setLoadError(t("guild.itemLevelsFailed"))
    } finally {
      setLoading(false)
    }
  }

  if (members.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        {t("guild.noRoster")}
      </div>
    )
  }

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          {t("guild.members")}
        </span>
        <span className="eyebrow">
          {t("guild.entryCount", { count: f.number(members.length) })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <input
          className="input max-w-[220px]"
          placeholder={t("guild.searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE)
          }}
        />

        {canLoadItemLevels && pending.length > 0 && (
          <button
            onClick={loadItemLevels}
            disabled={loading}
            className="btn btn-secondary text-[12px]"
            title={t("guild.itemLevelsNote")}
          >
            {loading
              ? t("core.loading")
              : t("guild.loadItemLevels", {
                  count: f.number(Math.min(BATCH, pending.length)),
                })}
          </button>
        )}

        <span className="ml-auto eyebrow">
          {filtered.length === members.length
            ? t("guild.shownOfTotal", {
                shown: f.number(shown.length),
                total: f.number(members.length),
              })
            : t("guild.matchCount", { count: f.number(filtered.length) })}
        </span>
      </div>

      {loadError && (
        <div className="border-b border-line px-4 py-2 text-[12px]">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            {loadError}
          </span>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="px-4 py-6 text-[13px] opacity-55">{t("guild.noMatch")}</div>
      ) : (
        <>
          {shown.map((member) => {
            const detail = details[detailKey(member.realmSlug, member.name)]
            const ilvl = detail?.equippedItemLevel

            return (
              <div
                key={`${member.realmSlug}-${member.name}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line px-4 py-2 last:border-0"
              >
                <span className="w-24 flex-none">
                  <span className="eyebrow">{rankLabel(member.rank)}</span>
                </span>

                <Link
                  href={characterBase(mode, member.realmSlug, member.name)}
                  className="min-w-0 flex-1 basis-[140px] truncate text-[13px] no-underline"
                  style={{
                    color:
                      member.classId !== null
                        ? CLASS_COLORS[member.classId]
                        : undefined,
                  }}
                >
                  {member.name}
                </Link>

                <span className="hidden w-32 flex-none truncate text-[12px] opacity-70 sm:block">
                  {member.className ?? "—"}
                </span>

                <span className="hidden w-24 flex-none truncate text-[12px] opacity-50 lg:block">
                  {member.raceName ?? "—"}
                </span>

                <span
                  className="w-10 flex-none text-right text-[12px] opacity-70"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {member.level !== null ? f.number(member.level) : "—"}
                </span>

                {canLoadItemLevels && (
                  <span
                    className="w-12 flex-none text-right"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                    title={
                      detail === undefined
                        ? t("guild.notLoaded")
                        : ilvl === undefined
                          ? t("guild.profileUnavailable")
                          : t("guild.itemLevelEquipped")
                    }
                  >
                    {ilvl !== undefined ? (
                      <span className="font-heading text-[13px] font-extrabold">
                        {f.number(Math.round(ilvl))}
                      </span>
                    ) : (
                      <span className="text-[12px] opacity-30">—</span>
                    )}
                  </span>
                )}
              </div>
            )
          })}

          {filtered.length > shown.length && (
            <div className="border-t border-line px-4 py-2.5">
              <button
                onClick={() => setLimit((l) => l + PAGE)}
                className="btn btn-secondary text-[12px]"
              >
                {t("guild.showMore", {
                  count: f.number(Math.min(PAGE, filtered.length - shown.length)),
                })}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
