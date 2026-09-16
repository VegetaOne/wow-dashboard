"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { useEffect, useState } from "react"
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

export function Header({
  battleTag,
  lastSync,
  pollSeconds = 60,
  characterCount,
  canChangeLanguage = false,
}: HeaderProps) {
  const t = useT()

  // Eigener Sekundentakt, damit "vor X Sek." mitläuft statt bis zum
  // nächsten Abruf stehenzubleiben. Bleibt auf den Header begrenzt.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const ago = lastSync
    ? Math.max(0, Math.round((now - lastSync.getTime()) / 1000))
    : null

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center gap-6 border-b-2 border-line bg-ground px-6 py-3.5">
      <Link href="/dashboard" className="mr-auto flex items-baseline gap-2.5 no-underline">
        <span className="font-heading text-[19px] font-extrabold tracking-[-0.02em] text-ink">
          {t("app.brand")}
        </span>
        <span className="eyebrow">{t("app.tagline")}</span>
      </Link>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] opacity-60">
        <span className="h-2 w-2 bg-accent" aria-hidden />
        <span>{t("header.apiConnected")}</span>
      </div>

      <div className="flex flex-col items-start gap-0.5 border-l-2 border-line pl-4">
        <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]">
          {ago === null
            ? t("header.firstFetch")
            : t("header.updated", { seconds: ago })}
        </span>
        <span className="eyebrow">
          {t("header.pollEvery", { seconds: pollSeconds })}
          {typeof characterCount === "number"
            ? ` · ${t("header.charactersFound", { count: characterCount })}`
            : ""}
        </span>
      </div>

      <Link href="/dashboard/account" className="btn btn-secondary no-underline">
        {t("header.collections")}
      </Link>

      <Link href="/dashboard/einstellungen" className="btn btn-secondary no-underline">
        {t("header.settings")}
      </Link>

      {canChangeLanguage && <LanguageToggle />}

      <ThemeToggle />

      {battleTag && (
        <span className="hidden text-[13px] opacity-60 sm:block">{battleTag}</span>
      )}

      <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn btn-secondary">
        {t("header.signOut")}
      </button>
    </header>
  )
}
