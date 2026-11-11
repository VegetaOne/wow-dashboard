"use client"

import Link from "next/link"
import { useT } from "./I18nProvider"

/**
 * Verweis auf die Wochenübersicht. Seit WoW Forever gibt es nur noch einen
 * Spielmodus – der Verweis braucht keinen mehr.
 */
export function WeeklyLink() {
  const t = useT()
  return (
    <Link href="/dashboard/woche" className="btn btn-secondary no-underline">
      {t("weekly.link")}
    </Link>
  )
}
