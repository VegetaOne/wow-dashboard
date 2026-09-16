"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { GameMode } from "@/lib/battlenet"
import type { TranslationKey } from "@/lib/i18n"
import { useT } from "./I18nProvider"

export type { GameMode }

const MODES: { id: GameMode; labelKey: TranslationKey; noteKey: TranslationKey }[] = [
  { id: "retail", labelKey: "mode.retail", noteKey: "mode.retail.note" },
  { id: "classic", labelKey: "mode.classic", noteKey: "mode.classic.note" },
  { id: "classic-era", labelKey: "mode.classicEra", noteKey: "mode.classicEra.note" },
]

/**
 * Nur die Modi, die im Setup gewählt wurden. Ohne Angabe alle – so bleibt
 * die Komponente auch ohne Konfiguration brauchbar.
 */
export function GameModeTabs({
  modes,
  defaultMode = "retail",
}: {
  modes?: GameMode[]
  defaultMode?: GameMode
}) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const active = (params.get("mode") as GameMode) || defaultMode
  const visible = modes && modes.length > 0 ? MODES.filter((m) => modes.includes(m.id)) : MODES

  // Ein einzelner Tab ist kein Umschalter, sondern nur eine Überschrift –
  // dann lieber gar keine Leiste.
  if (visible.length < 2) return null

  return (
    <div className="flex items-stretch overflow-x-auto border-b-2 border-line">
      {visible.map((m) => {
        const isActive = active === m.id
        return (
          <button
            key={m.id}
            onClick={() => router.replace(`${pathname}?mode=${m.id}`)}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-none flex-col items-start gap-0.5 border-r border-line px-6 py-3.5 text-left hover:bg-ink/5"
            style={{
              borderBottom: `4px solid ${isActive ? "var(--color-accent)" : "transparent"}`,
              background: isActive ? "var(--color-surface)" : "transparent",
            }}
          >
            <span
              className="font-heading text-[17px] font-extrabold tracking-[-0.01em]"
              style={{ opacity: isActive ? 1 : 0.6 }}
            >
              {t(m.labelKey)}
            </span>
            <span className="eyebrow whitespace-nowrap">{t(m.noteKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
