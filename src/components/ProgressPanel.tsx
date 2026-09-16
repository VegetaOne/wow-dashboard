"use client"

import { useState } from "react"
import type { ExpansionProgress, InstanceProgress, DifficultyProgress } from "@/lib/progress"
import { expansionTotals, formatDay } from "@/lib/progress"
import { useT } from "./I18nProvider"

/** Farbe je Schwierigkeit – Mythisch am kräftigsten. */
const DIFFICULTY_COLOR: Record<string, string> = {
  MYTHIC: "var(--color-accent)",
  LEGACY_MYTHIC: "var(--color-accent)",
  HEROIC: "var(--faction-alliance)",
  LEGACY_HEROIC: "var(--faction-alliance)",
  NORMAL: "var(--color-neutral-700)",
  LEGACY_NORMAL: "var(--color-neutral-700)",
  LFR: "var(--color-neutral-300)",
  LEGACY_LFR: "var(--color-neutral-300)",
}

function colorFor(difficulty: string): string {
  return DIFFICULTY_COLOR[difficulty] ?? "var(--color-neutral-700)"
}

export function ProgressPanel({
  expansions,
  emptyLabel,
}: {
  expansions: ExpansionProgress[]
  emptyLabel: string
}) {
  const t = useT()

  // Neueste Erweiterung offen, der Rest zugeklappt
  const [openExpansion, setOpenExpansion] = useState<number | null>(
    expansions[0]?.expansionId ?? null
  )

  if (expansions.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {expansions.map((exp) => {
        const isOpen = openExpansion === exp.expansionId
        const totals = expansionTotals(exp)

        return (
          <div key={exp.expansionId} className="border-2 border-line">
            <button
              onClick={() => setOpenExpansion(isOpen ? null : exp.expansionId)}
              aria-expanded={isOpen}
              className="w-full border-b border-line px-4 py-2.5 text-left hover:bg-ink/5"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
                  {exp.name}
                </span>

                {/* Summen je Schwierigkeit – der Überblick ohne Aufklappen */}
                <span className="flex flex-wrap items-baseline gap-x-3">
                  {totals.map((total) => (
                    <span key={total.difficulty} className="flex items-baseline gap-1.5">
                      <span
                        className="h-2 w-2 flex-none translate-y-[-1px]"
                        style={{ background: colorFor(total.difficulty) }}
                        aria-hidden
                      />
                      <span className="eyebrow">{total.difficultyName}</span>
                      <span className="font-heading text-[12px] font-extrabold">
                        {`${total.completed}/${total.total}`}
                      </span>
                    </span>
                  ))}
                </span>

                <span className="ml-auto w-4 flex-none text-center text-[12px] opacity-55">
                  {isOpen ? "−" : "+"}
                </span>
              </div>
            </button>

            {isOpen && (
              <div>
                {exp.instances.map((inst) => (
                  <InstanceRow key={inst.instanceId} instance={inst} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function InstanceRow({ instance }: { instance: InstanceProgress }) {
  const t = useT()
  const [showBosses, setShowBosses] = useState(false)
  const hasEncounters = instance.modes.some((m) => m.encounters.length > 0)

  return (
    <div className="border-b border-line last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 px-4 py-2.5">
        <span className="min-w-0 flex-1 basis-[180px] truncate text-[13px]">
          {instance.name}
        </span>

        <span className="flex flex-wrap gap-2">
          {instance.modes.map((mode) => (
            <ModeBadge key={mode.difficulty} mode={mode} />
          ))}
        </span>

        {hasEncounters && (
          <button
            onClick={() => setShowBosses((v) => !v)}
            aria-expanded={showBosses}
            className="btn btn-secondary text-[12px]"
          >
            {showBosses ? t("progress.bossesHide") : t("progress.bossesShow")}
          </button>
        )}
      </div>

      {showBosses && (
        <div className="border-t border-line bg-surface px-4 py-3">
          {instance.modes
            .filter((m) => m.encounters.length > 0)
            .map((mode) => (
              <div key={mode.difficulty} className="mb-4 last:mb-0">
                <div className="mb-1 flex items-baseline gap-2">
                  <span
                    className="h-2 w-2 flex-none"
                    style={{ background: colorFor(mode.difficulty) }}
                    aria-hidden
                  />
                  <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]">
                    {mode.difficultyName}
                  </span>
                </div>

                <ul className="m-0 list-none p-0">
                  {mode.encounters.map((enc) => (
                    <li
                      key={enc.encounterId}
                      className="flex flex-wrap items-baseline gap-x-3 border-b border-line py-1 text-[12px] last:border-0"
                    >
                      <span className="min-w-0 flex-1 truncate">{enc.name}</span>
                      <span className="opacity-70">
                        {`${enc.completedCount}×`}
                      </span>
                      <span className="w-20 flex-none text-right opacity-50">
                        {formatDay(enc.lastKillAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function ModeBadge({ mode }: { mode: DifficultyProgress }) {
  const t = useT()
  const isComplete = mode.total > 0 && mode.completed >= mode.total
  const color = colorFor(mode.difficulty)
  const pct = mode.total > 0 ? Math.round((mode.completed / mode.total) * 100) : 0

  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-0.5"
      style={{
        borderColor: color,
        background: isComplete ? color : "transparent",
        color: isComplete ? "var(--color-bg)" : "var(--color-text)",
      }}
      title={t("progress.modeProgress", {
        difficulty: mode.difficultyName,
        percent: pct,
      })}
    >
      <span className="font-heading text-[11px] font-extrabold uppercase tracking-[0.06em]">
        {mode.difficultyName}
      </span>
      <span className="font-heading text-[11px] font-extrabold">
        {`${mode.completed}/${mode.total}`}
      </span>
    </span>
  )
}
