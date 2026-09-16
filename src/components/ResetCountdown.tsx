"use client"

import { useEffect, useState } from "react"
import { formatRemaining } from "@/lib/i18n"
import { useLanguage } from "./I18nProvider"

/**
 * Laufende Restzeit bis zu einem Reset.
 *
 * Als Server-Komponente stünde hier eine Zahl, die ab dem Seitenaufruf
 * altert – bei einer Seite, die man offen liegen lässt, wäre sie nach einer
 * Stunde schlicht falsch. Darum ein eigener Minutentakt.
 *
 * Der Zielzeitpunkt kommt als ISO-Zeichenkette: zwischen Server- und
 * Client-Komponente überlebt ein `Date` die Serialisierung nicht.
 */
export function ResetCountdown({
  targetIso,
  label,
}: {
  targetIso: string
  label: string
}) {
  const language = useLanguage()
  const target = new Date(targetIso).getTime()
  const [now, setNow] = useState<number | null>(null)

  // Erst nach dem Mounten rechnen: Server und Client hätten sonst
  // unterschiedliche Werte und React meldete eine Abweichung.
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <span className="eyebrow">{label}</span>
      <div className="font-heading text-[22px] font-extrabold leading-none tracking-[-0.02em]">
        {now === null ? "—" : formatRemaining(language, target - now)}
      </div>
    </div>
  )
}
