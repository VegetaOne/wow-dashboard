"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ThemeToggle } from "./ThemeToggle"
import { LanguageToggle } from "./LanguageToggle"
import { useT } from "./I18nProvider"

interface HeaderProps {
  battleTag?: string
  /** Zeitpunkt des letzten API-Abrufs (aus CharacterGrid hochgereicht) */
  lastSync?: Date | null
  pollSeconds?: number
  characterCount?: number
  /** Nur der Besitzer der Instanz sieht den Sprachumschalter. */
  canChangeLanguage?: boolean
}

/**
 * Kopfzeile im Warband-Stil: Sechseck-Wortmarke, Abrufstatus, Navigation
 * als Reiter, Sprache, Thema (☀ Pergament / ☾ Nacht), Abmelden.
 *
 * Abweichung von der Übergabe: keine Wappen-Uploads (Bilder kommen aus der
 * API, Entscheid 2026-11-12) und kein Spielmodus-Reiter (nur WoW Forever).
 * Der Abrufstatus erscheint nur, wo die Seite ihn kennt – auf der Übersicht.
 */
export function Header({
  battleTag,
  lastSync,
  pollSeconds = 60,
  characterCount,
  canChangeLanguage = false,
}: HeaderProps) {
  const t = useT()
  const pathname = usePathname()

  // Eigener Sekundentakt, damit "vor X Sek." mitläuft statt bis zum
  // nächsten Abruf stehenzubleiben. Bleibt auf den Header begrenzt.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (lastSync === undefined) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [lastSync])

  // Höhe der Kopfzeile als --wb-header-h: der Aktenkopf klebt darunter.
  // Gemessen statt fest, weil die Zeile je nach Breite umbricht. Auf
  // schmalen Bildschirmen klebt sie nicht (drei Zeilen hoch, zu viel vom
  // Bild) – dann 0, und nur der Aktenkopf bleibt oben.
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const root = document.documentElement
    const set = () => {
      const sticks = getComputedStyle(el).position === "sticky"
      root.style.setProperty("--wb-header-h", `${sticks ? el.offsetHeight : 0}px`)
    }
    set()
    const observer = new ResizeObserver(set)
    observer.observe(el)
    window.addEventListener("resize", set)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", set)
    }
  }, [])

  const ago = lastSync ? Math.max(0, Math.round((now - lastSync.getTime()) / 1000)) : null
  const showStatus = lastSync !== undefined

  const nav = [
    // Woche vorerst nicht in der Navigation (Wunsch 2026-11-12, Lockouts
    // zurückgestellt); die Seite bleibt unter /dashboard/woche erreichbar.
    { href: "/dashboard/talentplaner", label: t("header.talentPlanner") },
    { href: "/dashboard/account", label: t("header.collections") },
    { href: "/dashboard/einstellungen", label: t("header.settings") },
  ]

  return (
    <header
      ref={headerRef}
      className="relative top-0 z-40 sm:sticky flex flex-wrap items-center gap-x-4 gap-y-3 px-[26px] py-2.5"
      style={{
        // Deckender Grund darunter: der Aktenkopf und der Inhalt scrollen hinter der Zeile durch
        background: "linear-gradient(180deg, var(--wb-stone) 0%, var(--wb-scrim) 100%), var(--wb-stone)",
        borderBottom: "2px solid var(--wb-gold-faint)",
        boxShadow: "0 10px 26px var(--wb-plate)",
      }}
    >
      {/* Wortmarke */}
      <Link href="/dashboard" className="mr-auto flex items-center gap-3 no-underline">
        <span
          className="wb-hex grid flex-none place-items-center font-heading text-[15px] font-black"
          style={{
            width: 30,
            height: 34,
            background: "radial-gradient(circle at 50% 35%, var(--wb-gold) 0%, #7a5c1c 70%, #3a2a0c 100%)",
            color: "#1a1207",
          }}
          aria-hidden
        >
          W
        </span>
        <span className="flex flex-col leading-tight">
          <span
            className="font-heading text-[19px] font-black"
            style={{ letterSpacing: "0.13em", color: "var(--wb-gold-lit)", textShadow: "0 1px 0 var(--wb-emboss)" }}
          >
            {t("app.brand")}
          </span>
          <span className="text-[10px] uppercase" style={{ letterSpacing: "0.3em", color: "var(--wb-ink-dim)" }}>
            {t("app.tagline")}
          </span>
        </span>
      </Link>

      {/* Abrufstatus */}
      {showStatus && (
        <div
          className="hidden items-center gap-2.5 px-3 py-[5px] xl:flex"
          style={{ border: "1px solid var(--wb-gold-faint)", background: "var(--wb-plate-3)" }}
        >
          <span
            className="h-2 w-2 flex-none"
            style={{ background: "#6fd08a", boxShadow: "0 0 9px #6fd08a", animation: "wbEmber 2.6s ease-in-out infinite" }}
            aria-hidden
          />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-[11px] uppercase" style={{ letterSpacing: "0.16em" }}>
              {ago === null ? t("header.firstFetch") : t("header.updated", { seconds: ago })}
            </span>
            <span className="text-[10px] uppercase" style={{ letterSpacing: "0.08em", color: "var(--wb-ink-dim)" }}>
              {t("header.pollEvery", { seconds: pollSeconds })}
              {typeof characterCount === "number"
                ? ` · ${t("header.charactersFound", { count: characterCount })}`
                : ""}
            </span>
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex" aria-label={t("header.nav")}>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="wb-tab"
            aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {canChangeLanguage && <LanguageToggle />}

      <ThemeToggle />

      {battleTag && (
        <span className="hidden text-[12px] 2xl:block" style={{ color: "var(--wb-ink-dim)" }}>
          {battleTag}
        </span>
      )}

      <button onClick={() => signOut({ callbackUrl: "/login" })} className="wb-tab">
        {t("header.signOut")}
      </button>
    </header>
  )
}
