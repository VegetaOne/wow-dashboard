"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { GameMode } from "@/lib/battlenet"

export type { GameMode }

const MODES: { id: GameMode; label: string; note: string }[] = [
  { id: "retail", label: "Retail", note: "The War Within · Stufe 80" },
  { id: "classic", label: "Classic", note: "Anniversary · Stufe 60" },
  { id: "classic-era", label: "Classic Era", note: "Hardcore · Stufe 60" },
]

export function GameModeTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const active = (params.get("mode") as GameMode) || "retail"

  return (
    <div className="flex items-stretch overflow-x-auto border-b-2 border-line">
      {MODES.map((m) => {
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
              {m.label}
            </span>
            <span className="eyebrow whitespace-nowrap">{m.note}</span>
          </button>
        )
      })}
    </div>
  )
}
