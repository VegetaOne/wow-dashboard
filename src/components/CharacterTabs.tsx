"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { visibleTabs, tabHref, characterBase } from "@/lib/characterTabs"
import { useT } from "./I18nProvider"

/**
 * Tab-Leiste unter dem Charakterkopf. Nur freigeschaltete Tabs erscheinen,
 * damit kein Reiter auf eine leere Seite führt.
 */
export function CharacterTabs({
  realm,
  name,
  mode,
}: {
  realm: string
  name: string
  mode: string
}) {
  const t = useT()
  const pathname = usePathname()
  const base = characterBase(mode, realm, name)
  const tabs = visibleTabs()

  // Ein einzelner Tab ist keine Navigation – dann gar nichts anzeigen
  if (tabs.length < 2) return null

  return (
    <nav className="flex items-stretch overflow-x-auto border-b-2 border-line">
      {tabs.map((tab) => {
        const href = tabHref(mode, realm, name, tab.slug)
        const target = tab.slug ? `${base}/${tab.slug}` : base
        const isActive = pathname === target

        return (
          <Link
            key={tab.slug || "overview"}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className="flex-none border-r border-line px-5 py-3 font-heading text-[13px] font-extrabold uppercase tracking-[0.06em] no-underline hover:bg-ink/5"
            style={{
              borderBottom: `4px solid ${isActive ? "var(--color-accent)" : "transparent"}`,
              background: isActive ? "var(--color-surface)" : "transparent",
              color: "var(--color-text)",
              opacity: isActive ? 1 : 0.6,
            }}
          >
            {t(tab.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
