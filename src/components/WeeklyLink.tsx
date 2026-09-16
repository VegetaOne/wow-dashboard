"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { GameMode } from "@/lib/battlenet"
import { useT } from "./I18nProvider"

/**
 * Verweis auf die Wochenübersicht des gerade gewählten Spielmodus.
 *
 * Eigene Komponente, weil `useSearchParams` die Seite sonst aus dem
 * statischen Rendern nehmen würde – so bleibt die Grenze klein und liegt
 * in einer eigenen Suspense-Hülle.
 */
export function WeeklyLink() {
  const t = useT()
  const params = useSearchParams()
  const mode = ((params.get("mode") as GameMode) || "retail") as GameMode

  return (
    <Link href={`/dashboard/${mode}/woche`} className="btn btn-secondary no-underline">
      {t("weekly.link")}
    </Link>
  )
}
