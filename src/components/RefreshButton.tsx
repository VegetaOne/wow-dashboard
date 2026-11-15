"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useT } from "./I18nProvider"

/**
 * Knopf „neu laden" im Aktenkopf: lässt den Server die gespeicherten Stände
 * dieses Charakters verwerfen und rendert dann den offenen Bereich neu.
 *
 * Der Hinweis im Titel ist ernst gemeint: Battle.net aktualisiert das Profil
 * erst beim Ausloggen. Wer im Spiel eingeloggt ist, bekommt auch frisch
 * geholt den alten Stand.
 */
export function RefreshButton({ slug }: { slug: string }) {
  const t = useT()
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [rendering, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)
  const busy = sending || rendering

  async function reload() {
    if (busy) return
    setSending(true)
    setFailed(false)
    try {
      const res = await fetch("/api/wow/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      })
      if (!res.ok) throw new Error(String(res.status))
      startTransition(() => router.refresh())
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  const label = busy ? t("refresh.busy") : failed ? t("refresh.failed") : t("refresh.label")

  return (
    <button
      type="button"
      onClick={reload}
      disabled={busy}
      title={t("refresh.hint")}
      aria-label={label}
      className="btn btn-secondary flex-none"
      style={failed ? { color: "var(--wb-horde-lit)" } : undefined}
    >
      <span aria-hidden className={busy ? "inline-block animate-spin" : "inline-block"}>
        ↻
      </span>
      <span className="ml-1.5">{label}</span>
    </button>
  )
}
