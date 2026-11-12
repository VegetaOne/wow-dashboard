"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { visibleTabs, tabHref, characterBase, type CharacterTab } from "@/lib/characterTabs"
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

/** Dauer des Hereingleitens; bei „weniger Bewegung" entfällt sie. */
const SLIDE_MS = 240

/**
 * Bereichsmenü der Heldenakte: Knopf im Aktenkopf, Menü gleitet von links
 * herein, zeigt alle Bereiche mit Namen und Kurzhinweis und schliesst sich
 * nach der Wahl (Wunsch 2026-11-12). Ersetzt die römischen Reiter – an
 * Ziffern allein war nicht zu erkennen, wohin ein Reiter führt.
 *
 * Das Menü hängt per Portal an `body`: der Aktenkopf klebt beim Scrollen
 * oben und bildet damit eine eigene Ebene, unter der ein `fixed`-Kind sonst
 * hinter der Kopfzeile landen kann.
 *
 * Geschlossen bleibt es im DOM, aber `visibility: hidden` – so gleitet es
 * auch wieder hinaus, und nichts darin ist per Tab erreichbar.
 */
export function SectionMenu({
  slug,
  characterName,
  nameColor,
}: {
  slug: string
  characterName: string
  nameColor: string
}) {
  const t = useT()
  const tabs = visibleTabs()
  const active = useActiveIndex(slug, tabs)
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)
  const wasOpen = useRef(false)

  // Portal erst nach dem Hydrieren – auf dem Server gibt es kein document
  useEffect(() => setMounted(true), [])

  // Seitenwechsel schliesst das Menü, auch über Zurück im Browser
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      // Fokus auf den offenen Bereich, damit Pfeiltasten/Tab dort beginnen
      activeRef.current?.focus({ preventScroll: true })
      const before = document.body.style.overflow
      document.body.style.overflow = "hidden"
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false)
      }
      document.addEventListener("keydown", onKey)
      return () => {
        document.body.style.overflow = before
        document.removeEventListener("keydown", onKey)
      }
    }
    // Beim Schliessen den Fokus zurück an den Knopf, nicht beim ersten Rendern
    if (wasOpen.current) {
      wasOpen.current = false
      buttonRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  if (tabs.length < 2) return null

  const panelId = `section-menu-${slug}`

  const drawer = (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[60] motion-reduce:transition-none"
        style={{
          background: "var(--wb-scrim)",
          opacity: open ? 0.7 : 0,
          visibility: open ? "visible" : "hidden",
          transition: `opacity ${SLIDE_MS}ms ease, visibility 0s linear ${open ? "0s" : `${SLIDE_MS}ms`}`,
        }}
      />
      <nav
        id={panelId}
        aria-label={t("akte.sections")}
        className="fixed left-0 top-0 z-[61] flex h-full flex-col motion-reduce:transition-none"
        style={{
          width: "min(320px, 86vw)",
          background: "linear-gradient(180deg, var(--wb-panel) 0%, var(--wb-deep) 100%)",
          borderRight: "2px solid var(--wb-gold-faint)",
          boxShadow: open ? "14px 0 40px var(--wb-plate-2)" : "none",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          visibility: open ? "visible" : "hidden",
          transition: `transform ${SLIDE_MS}ms ease, visibility 0s linear ${open ? "0s" : `${SLIDE_MS}ms`}`,
        }}
      >
        {/* Kopf: wessen Akte, Schliessen */}
        <div
          className="flex items-start gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--wb-gold-faint)", background: "linear-gradient(180deg, rgba(201,161,75,0.12), transparent)" }}
        >
          <div className="mr-auto min-w-0">
            <span className="eyebrow">{t("akte.title")}</span>
            <p className="truncate font-heading text-[17px] font-bold" style={{ letterSpacing: "0.06em", color: nameColor }}>
              {characterName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="wb-tab"
            style={{ minWidth: 34, height: 34, padding: 0, fontSize: 16, letterSpacing: 0 }}
            aria-label={t("akte.menuClose")}
            title={t("akte.menuClose")}
          >
            ✕
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto py-2">
          {tabs.map((tab, i) => {
            const current = i === active
            return (
              <li key={tab.slug || "overview"}>
                <Link
                  ref={current ? activeRef : undefined}
                  href={tabHref(slug, tab.slug)}
                  aria-current={current ? "page" : undefined}
                  // Gleicher Bereich: kein Seitenwechsel, also selbst schliessen
                  onClick={() => setOpen(false)}
                  className="block border-l-2 px-5 py-2.5 no-underline transition-colors hover:bg-[rgba(201,161,75,0.08)]"
                  style={{
                    borderColor: current ? "var(--wb-gold)" : "transparent",
                    background: current ? "linear-gradient(90deg, rgba(201,161,75,0.22), transparent)" : undefined,
                  }}
                >
                  <span
                    className="block font-heading text-[13px] font-bold uppercase"
                    style={{ letterSpacing: "0.16em", color: current ? "var(--wb-gold-lit)" : "var(--wb-ink)" }}
                  >
                    {t(tab.labelKey)}
                  </span>
                  {tab.noteKey && (
                    <span className="block text-[12px] italic" style={{ color: "var(--wb-ink-dim)" }}>
                      {t(tab.noteKey)}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="wb-tab flex-none"
        style={{ height: 38, padding: "0 12px" }}
        aria-expanded={open}
        aria-controls={panelId}
        title={t("akte.menuOpen")}
      >
        <span aria-hidden style={{ fontSize: 16, letterSpacing: 0 }}>
          ☰
        </span>
        <span className="hidden sm:inline">{t("akte.sections")}</span>
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  )
}

/**
 * ‹ Aktueller Bereich › rechts im Aktenkopf. Die Pfeile laufen wie in der
 * Warband-Übergabe im Kreis.
 */
export function SectionStepper({ slug }: { slug: string }) {
  const t = useT()
  const tabs = visibleTabs()
  const active = useActiveIndex(slug, tabs)
  const tab = tabs[active]
  if (!tab) return null

  const label = (
    <span
      className="font-heading text-[12px] font-bold uppercase"
      style={{ letterSpacing: "0.22em", color: "var(--wb-gold)" }}
    >
      {t(tab.labelKey)}
    </span>
  )
  if (tabs.length < 2) return label

  const prev = tabs[(active - 1 + tabs.length) % tabs.length]
  const next = tabs[(active + 1) % tabs.length]
  const arrow = { minWidth: 34, height: 34, padding: 0, fontSize: 18, letterSpacing: 0 }

  return (
    <div className="flex items-center gap-3">
      <Link href={tabHref(slug, prev.slug)} className="wb-tab" style={arrow} aria-label={t("akte.prev")} title={`${t("akte.prev")}: ${t(prev.labelKey)}`}>
        ‹
      </Link>
      {label}
      <Link href={tabHref(slug, next.slug)} className="wb-tab" style={arrow} aria-label={t("akte.next")} title={`${t("akte.next")}: ${t(next.labelKey)}`}>
        ›
      </Link>
    </div>
  )
}

/** Unterzeile im Bandkopf: „Bereich 3 von 11 …" */
export function SectionCount({ slug }: { slug: string }) {
  const t = useT()
  const tabs = visibleTabs()
  const active = useActiveIndex(slug, tabs)
  return <>{t("akte.subtitle", { current: active + 1, total: tabs.length })}</>
}
