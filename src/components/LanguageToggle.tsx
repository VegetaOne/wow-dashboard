"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LANGUAGES, type Language } from "@/lib/config-cache"
import { useLanguage, useT } from "./I18nProvider"

/**
 * Sprachumschalter.
 *
 * Die Sprache gilt für die ganze Instanz, nicht je Account – sie steuert
 * neben diesen Texten auch den `locale` der Blizzard-Abfragen, und der wird
 * serverseitig einmal gelesen. Deshalb steht der Umschalter nur dort, wo er
 * auch etwas bewirken darf: vor Abschluss des Setups für jeden, danach nur
 * für den Besitzer der Instanz.
 *
 * Nach dem Speichern wird die Ansicht neu geholt statt nur neu gerendert:
 * die Server-Komponenten haben ihre Texte bereits in der alten Sprache
 * gerendert, und die Blizzard-Daten hängen ebenfalls daran.
 */
export function LanguageToggle() {
  const t = useT()
  const current = useLanguage()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState<Language | null>(null)

  async function pick(next: Language) {
    if (next === current || saving) return
    setSaving(next)

    try {
      const res = await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: next }),
      })
      if (!res.ok) return
      startTransition(() => router.refresh())
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex" role="group" aria-label={t("language.label")}>
      {LANGUAGES.map((item) => {
        const active = item.id === current
        return (
          <button
            key={item.id}
            onClick={() => pick(item.id)}
            aria-pressed={active}
            disabled={pending || saving !== null}
            className="-ml-px border border-line px-3 py-2 font-heading text-[11px] font-extrabold uppercase tracking-[0.08em] disabled:opacity-50"
            style={{
              background: active ? "var(--color-text)" : "transparent",
              color: active ? "var(--color-bg)" : "var(--color-text)",
            }}
          >
            {item.id}
          </button>
        )
      })}
    </div>
  )
}
