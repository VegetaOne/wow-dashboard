"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { visibleTabs, tabHref, characterBase, roman, type CharacterTab } from "@/lib/characterTabs"
import { useT } from "./I18nProvider"

/**
 * Welcher Bereich gerade offen ist. usePathname liefert den Pfad kodiert wie
 * in der Adresszeile – Umlaute im Namen kämen sonst ungleich an.
 */
function useActiveIndex(slug: string, tabs: CharacterTab[]): number {
  const pathname = usePathname() ?? ""
  const base = characterBase(slug)
  const current = decodeURIComponent(pathname)
  const index = tabs.findIndex((tab) => decodeURIComponent(tab.slug ? `${base}/${tab.slug}` : base) === current)
  return index < 0 ? 0 : index
}

/**
 * Navigation der Heldenakte (Warband-Übergabe, Band 3): ‹ / › und je Bereich
 * ein Reiter mit römischer Ziffer, der Name als Titel. Nur freigeschaltete
 * Bereiche erscheinen, damit kein Reiter auf eine leere Seite führt.
 *
 * Abweichung: kein Schieberegler über alle Tafeln. Jeder Bereich ist eine
 * eigene Seite und lädt seine Daten erst, wenn er offen ist – elf Bereiche
 * auf einmal zu laden, vervielfachte die Abfragen an Battle.net.
 * Die Pfeile laufen wie in der Übergabe im Kreis.
 */
export function CharacterTabs({ slug }: { slug: string }) {
  const t = useT()
  const tabs = visibleTabs()
  const active = useActiveIndex(slug, tabs)

  // Ein einzelner Bereich ist keine Navigation – dann gar nichts anzeigen
  if (tabs.length < 2) return null

  const prev = tabs[(active - 1 + tabs.length) % tabs.length]
  const next = tabs[(active + 1) % tabs.length]
  const square = { minWidth: 38, height: 38, padding: "0 8px", letterSpacing: "0.06em" }
  const arrow = { ...square, fontSize: 18, letterSpacing: 0 }

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label={t("akte.sections")}>
      <Link href={tabHref(slug, prev.slug)} className="wb-tab" style={arrow} aria-label={t("akte.prev")} title={t("akte.prev")}>
        ‹
      </Link>
      <div className="flex flex-wrap">
        {tabs.map((tab, i) => (
          <Link
            key={tab.slug || "overview"}
            href={tabHref(slug, tab.slug)}
            aria-current={i === active ? "page" : undefined}
            className="wb-tab"
            style={square}
            title={t(tab.labelKey)}
            aria-label={t(tab.labelKey)}
          >
            {roman(i + 1)}
          </Link>
        ))}
      </div>
      <Link href={tabHref(slug, next.slug)} className="wb-tab" style={arrow} aria-label={t("akte.next")} title={t("akte.next")}>
        ›
      </Link>
    </nav>
  )
}

/** „III · Berufe" rechts im Aktenkopf. */
export function ActiveSectionLabel({ slug }: { slug: string }) {
  const t = useT()
  const tabs = visibleTabs()
  const active = useActiveIndex(slug, tabs)
  const tab = tabs[active]
  if (!tab) return null
  return (
    <span className="font-heading text-[12px] font-bold uppercase" style={{ letterSpacing: "0.22em", color: "var(--wb-gold)" }}>
      {roman(active + 1)} · {t(tab.labelKey)}
    </span>
  )
}

/** Unterzeile im Bandkopf: „Bereich 3 von 11 …" */
export function SectionCount({ slug }: { slug: string }) {
  const t = useT()
  const tabs = visibleTabs()
  const active = useActiveIndex(slug, tabs)
  return <>{t("akte.subtitle", { current: active + 1, total: tabs.length })}</>
}
