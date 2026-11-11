"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useT } from "./I18nProvider"

/**
 * Stufe 2 des Setups – alles, was einen angemeldeten Account voraussetzt.
 *
 * Warcraft Logs ist optional und bleibt es: ein Setup, der Zugangsdaten für
 * einen Dienst verlangt, den man vielleicht nie nutzt, hält nur auf.
 *
 * Die Auswahl der Spielmodi ist mit der Umstellung auf WoW Forever entfallen.
 */
export function SetupStep2Form({
  initialPollSeconds,
}: {
  initialPollSeconds: number
}) {
  const t = useT()
  const router = useRouter()
  const [pollSeconds, setPollSeconds] = useState(initialPollSeconds)
  const [wclId, setWclId] = useState("")
  const [wclSecret, setWclSecret] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function finish() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollSeconds,
          warcraftLogsClientId: wclId,
          warcraftLogsSecret: wclSecret,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t("setup.saveFailed"))
        setSaving(false)
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError(t("setup.saveFailed"))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h3>{t("setup2.pollHeading")}</h3>
        <p className="mt-1 max-w-[70ch] text-[13px] opacity-60">
          {t("setup2.pollHint")}
        </p>
        <label className="mt-3 block max-w-[200px]">
          <span className="eyebrow block">{t("setup2.seconds")}</span>
          <input
            className="input mt-1 w-full"
            type="number"
            min={15}
            max={3600}
            value={pollSeconds}
            onChange={(e) => setPollSeconds(Number(e.target.value))}
          />
        </label>
      </section>

      <section>
        <h3>{t("setup2.wclHeading")}</h3>
        <p className="mt-1 max-w-[70ch] text-[13px] opacity-60">
          {t("setup2.wclHint")}
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="eyebrow block">{t("setup2.wclClientId")}</span>
            <input
              className="input mt-1 w-full"
              value={wclId}
              onChange={(e) => setWclId(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="eyebrow block">{t("setup2.wclClientSecret")}</span>
            <input
              className="input mt-1 w-full"
              type="password"
              value={wclSecret}
              onChange={(e) => setWclSecret(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>
      </section>

      <hr className="rule-thin" />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={finish}
          disabled={saving}
        >
          {saving ? t("setup.saving") : t("setup2.finish")}
        </button>
        <span className="text-[12px] opacity-55">{t("setup2.finishHint")}</span>
      </div>

      {error && (
        <p className="border-2 border-accent px-3 py-2 text-[13px]">{error}</p>
      )}
    </div>
  )
}
