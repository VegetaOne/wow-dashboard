"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ThemeToggle } from "./ThemeToggle"

interface HeaderProps {
  battleTag?: string
  /** Zeitpunkt des letzten API-Abrufs (aus CharacterGrid hochgereicht) */
  lastSync?: Date | null
  pollSeconds?: number
  characterCount?: number
}

export function Header({ battleTag, lastSync, pollSeconds = 60, characterCount }: HeaderProps) {
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
          WOW&nbsp;DASHBOARD
        </span>
        <span className="eyebrow">Kaderliste&nbsp;/&nbsp;lokal</span>
      </Link>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] opacity-60">
        <span className="h-2 w-2 bg-accent" aria-hidden />
        <span>Dev-API verbunden</span>
      </div>

      <div className="flex flex-col items-start gap-0.5 border-l-2 border-line pl-4">
        <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]">
          {ago === null ? "Erster Abruf läuft…" : `Aktualisiert vor ${ago} Sek.`}
        </span>
        <span className="eyebrow">
          Abruf alle {pollSeconds} Sek.
          {typeof characterCount === "number" ? ` · ${characterCount} Charaktere erkannt` : ""}
        </span>
      </div>

      <Link href="/dashboard/account" className="btn btn-secondary no-underline">
        Sammlungen
      </Link>

      <ThemeToggle />

      {battleTag && (
        <span className="hidden text-[13px] opacity-60 sm:block">{battleTag}</span>
      )}

      <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn btn-secondary">
        Abmelden
      </button>
    </header>
  )
}
