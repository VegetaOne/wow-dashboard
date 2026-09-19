"use client"

import type { MythicProfileView, MythicRun } from "@/lib/progress"
import { formatDuration } from "@/lib/progress"
import { useFormat } from "./I18nProvider"

export function MythicPanel({ profile }: { profile: MythicProfileView }) {
  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          Mythisch+
        </span>
        {profile.currentRating !== null && (
          <span className="flex items-baseline gap-2">
            <span className="eyebrow">Wertung</span>
            <span className="font-heading text-[18px] font-extrabold tracking-[-0.01em]">
              {Math.round(profile.currentRating)}
            </span>
          </span>
        )}
      </div>

      <RunSection
        title="Diese Woche"
        runs={profile.currentWeek}
        empty="Noch keine Läufe in dieser Woche."
        showAffixes
      />

      <RunSection
        title="Beste Läufe der Saison"
        runs={profile.bestRuns}
        empty="Noch keine gewerteten Läufe."
      />
    </div>
  )
}

function RunSection({
  title,
  runs,
  empty,
  showAffixes = false,
}: {
  title: string
  runs: MythicRun[]
  empty: string
  showAffixes?: boolean
}) {
  const f = useFormat()
  return (
    <div className="border-b border-line last:border-0">
      <div className="border-b border-line px-4 py-1.5">
        <span className="eyebrow">{title}</span>
      </div>

      {runs.length === 0 ? (
        <div className="px-4 py-2.5 text-[13px] opacity-55">{empty}</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {runs.map((run) => (
            <li
              key={`${run.dungeonId}-${run.completedAt ?? run.keystoneLevel}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line px-4 py-2 last:border-0"
            >
              {/* Schlüsselstufe, gefüllt wenn in der Zeit geschafft */}
              <span
                className="flex h-7 w-9 flex-none items-center justify-center border-2 font-heading text-[13px] font-extrabold"
                style={{
                  borderColor: run.inTime
                    ? "var(--faction-alliance)"
                    : "var(--color-divider)",
                  background: run.inTime ? "var(--faction-alliance)" : "transparent",
                  color: run.inTime ? "var(--color-bg)" : "var(--color-text)",
                }}
                title={run.inTime ? "In der Zeit" : "Über der Zeit"}
              >
                {`+${run.keystoneLevel}`}
              </span>

              <span className="min-w-0 flex-1 basis-[140px] truncate text-[13px]">
                {run.dungeonName}
              </span>

              {showAffixes && run.affixes.length > 0 && (
                <span className="hidden flex-wrap gap-1 lg:flex">
                  {run.affixes.map((a) => (
                    <span key={a} className="tag tag-neutral">
                      {a}
                    </span>
                  ))}
                </span>
              )}

              <span className="w-14 flex-none text-right text-[12px] opacity-70">
                {formatDuration(run.durationMs)}
              </span>

              <span className="w-14 flex-none text-right">
                {run.rating !== null ? (
                  <span className="font-heading text-[13px] font-extrabold">
                    {Math.round(run.rating)}
                  </span>
                ) : (
                  <span className="text-[12px] opacity-40">—</span>
                )}
              </span>

              <span className="w-20 flex-none text-right text-[11px] opacity-50">
                {f.date(run.completedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
