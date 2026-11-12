"use client"

import Link from "next/link"
import { useState } from "react"
import { useFormat, useT } from "./I18nProvider"
import { TalentTrees } from "./TalentTrees"
import type { Allocation, ClassTalents } from "@/lib/talent-tree"

export interface CharacterGroupView {
  index: number
  active: boolean
  allocation: Allocation
  unmatched: number
}

export interface BuildOption {
  id: string
  name: string
  allocation: Allocation
}

/**
 * Talente eines Charakters mit Dualspec und Ziel-Build.
 *
 * Je Talentverteilung lässt sich ein gespeicherter Build der Klasse
 * aktivieren (Wunsch 2026-11-12); dann zeigen die Bäume, was noch zu setzen
 * ist und was anders sitzt. Ohne Ziel bleibt es die reine Anzeige.
 * Die Wahl wird sofort gespeichert – sie ist eine Einstellung, kein Entwurf.
 */
export function CharacterTalents({
  slug,
  classId,
  talents,
  groups,
  builds,
  initialTargets,
}: {
  slug: string
  classId: number | null
  talents: ClassTalents
  groups: CharacterGroupView[]
  builds: BuildOption[]
  initialTargets: Record<number, string>
}) {
  const t = useT()
  const f = useFormat()
  const [current, setCurrent] = useState(groups.find((g) => g.active)?.index ?? groups[0]?.index ?? 1)
  const [targets, setTargets] = useState(initialTargets)
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  // Ohne Verteilung aus der API: eine leere erste, damit ein Ziel trotzdem geht
  const group = groups.find((g) => g.index === current) ?? { index: 1, active: true, allocation: {}, unmatched: 0 }
  const targetId = targets[group.index] ?? null
  const target = builds.find((b) => b.id === targetId) ?? null

  const activate = async (buildId: string | null) => {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch("/api/talent-targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, group: group.index, buildId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setStatus({ text: data?.error ?? t("planner.saveFailed"), error: true })
        return
      }
      setTargets((all) => {
        const next = { ...all }
        if (buildId) next[group.index] = buildId
        else delete next[group.index]
        return next
      })
      setStatus({ text: buildId ? t("planner.targetSet") : t("planner.targetCleared"), error: false })
    } finally {
      setBusy(false)
    }
  }

  const plannerBase = classId !== null ? `/dashboard/talentplaner?class=${classId}` : "/dashboard/talentplaner"

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3 border-b pb-4" style={{ borderColor: "var(--wb-gold-faint)" }}>
        {groups.length > 1 && (
          <div className="flex flex-col gap-1">
            <span className="eyebrow">{t("planner.groups")}</span>
            <div className="flex">
              {groups.map((g) => (
                <button
                  key={g.index}
                  type="button"
                  className="wb-tab"
                  aria-pressed={g.index === current}
                  onClick={() => {
                    setCurrent(g.index)
                    setStatus(null)
                  }}
                >
                  {g.active ? t("planner.groupActive", { n: g.index }) : t("planner.group", { n: g.index })}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex min-w-[14rem] flex-col gap-1">
          <span className="eyebrow">{t("planner.target")}</span>
          <select
            className="input"
            value={targetId ?? ""}
            disabled={busy || builds.length === 0}
            onChange={(e) => void activate(e.target.value || null)}
          >
            <option value="">{t("planner.targetNone")}</option>
            {builds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2 text-[13px]">
          {target && (
            <Link className="btn btn-secondary" href={`${plannerBase}&build=${encodeURIComponent(target.id)}`}>
              {t("planner.editTarget")}
            </Link>
          )}
          <Link
            className="btn btn-secondary"
            href={`${plannerBase}&from=${encodeURIComponent(slug)}&group=${group.index}`}
          >
            {t("planner.saveAsBuild")}
          </Link>
        </div>

        {status && (
          <span role="status" className="text-[12px]" style={{ color: status.error ? "var(--color-loss)" : "var(--color-gain)" }}>
            {status.text}
          </span>
        )}
      </div>

      {builds.length === 0 && (
        <p className="mb-4 text-center text-[12px] italic opacity-70">
          {t("planner.noBuildsYet")}{" "}
          <Link href={plannerBase} className="not-italic underline">
            {t("planner.title")}
          </Link>
        </p>
      )}

      {target && (
        <p className="mb-3 text-center text-[12px] opacity-70">
          {t("planner.comparing", { name: target.name, n: f.number(group.index) })}
        </p>
      )}

      <TalentTrees
        talents={talents}
        allocation={group.allocation}
        unmatched={group.unmatched}
        target={target?.allocation ?? null}
      />
    </div>
  )
}
