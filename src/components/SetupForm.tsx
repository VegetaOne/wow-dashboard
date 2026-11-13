"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { LANGUAGES, REGIONS, type Language } from "@/lib/config-cache"
import { useT } from "./I18nProvider"

/**
 * Stufe 1 des Setups – ohne Anmeldung erreichbar.
 *
 * Hier stehen nur die Werte, die der Login selbst braucht. Alles Weitere
 * kommt in Stufe 2, nach der Anmeldung.
 *
 * Die Zugangsdaten werden vor dem Speichern gegen Battle.net geprüft.
 * Schlägt die Prüfung fehl, weil der Dienst nicht erreichbar war, lässt
 * sich trotzdem fortfahren – ein Netzausfall sagt nichts über die Daten.
 */
export function SetupForm({
  initialLanguage,
  initialRegion,
  initialClientId,
}: {
  initialLanguage: Language
  initialRegion: string
  initialClientId: string
}) {
  const t = useT()
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [region, setRegion] = useState(initialRegion)
  const [clientId, setClientId] = useState(initialClientId)
  const [clientSecret, setClientSecret] = useState("")

  const [origin, setOrigin] = useState("")
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState<null | { ok: boolean; message: string }>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Die Redirect-URI muss exakt stimmen; darum zeigen, was dieser Browser
  // tatsächlich sieht, statt eine Adresse zu raten.
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const redirectUri = origin
    ? `${origin}/api/auth/callback/battlenet`
    : "…"

  async function verify() {
    setChecking(true)
    setChecked(null)
    setError(null)
    try {
      const res = await fetch("/api/setup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, region }),
      })
      const data = await res.json()
      setChecked({
        ok: !!data.ok,
        message: data.ok
          ? t("setup.verifyOk")
          : data.error || t("setup.verifyFailed"),
      })
    } catch {
      setChecked({
        ok: false,
        message: t("setup.verifyUnavailable"),
      })
    } finally {
      setChecking(false)
    }
  }

  async function saveAndSignIn() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, region, language }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t("setup.saveFailed"))
        setSaving(false)
        return
      }
      // Erst ab hier ist ein Login überhaupt möglich.
      await signIn("battlenet", { callbackUrl: "/setup/schritt-2" })
    } catch {
      setError(t("setup.saveFailed"))
      setSaving(false)
    }
  }

  const ready = clientId.trim().length > 0 && clientSecret.trim().length > 0

  return (
    <div className="space-y-8">
      <section>
        <span className="eyebrow">{t("setup.step", { current: 1, total: 4 })}</span>
        <h3 className="mt-0.5">{t("setup.language")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("setup.languageHint")}</p>
        <div className="mt-3 flex gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLanguage(l.id)}
              className={`btn ${language === l.id ? "btn-primary" : "btn-secondary"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <hr className="rule-thin" />

      <section>
        <span className="eyebrow">{t("setup.step", { current: 2, total: 4 })}</span>
        <h3 className="mt-0.5">{t("setup.region")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("setup.regionHint")}</p>
        <div className="mt-3 flex gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`btn ${region === r ? "btn-primary" : "btn-secondary"}`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <hr className="rule-thin" />

      <section>
        <span className="eyebrow">{t("setup.step", { current: 3, total: 4 })}</span>
        <h3 className="mt-0.5">{t("setup.bnetApp")}</h3>
        <p className="mt-1 max-w-[70ch] text-[13px] opacity-60">
          {t("setup.bnetAppHintBefore")}{" "}
          <a href="https://develop.battle.net" target="_blank" rel="noreferrer">
            develop.battle.net
          </a>{" "}
          {t("setup.bnetAppHintAfter")}
        </p>

        <code className="mt-3 block border-2 border-line px-3 py-2 text-[13px] break-all">
          {redirectUri}
        </code>

        <p className="mt-2 text-[12px] opacity-55">{t("setup.redirectHint")}</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="eyebrow block">{t("setup.clientId")}</span>
            <input
              className="input mt-1 w-full"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                setChecked(null)
              }}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="block">
            <span className="eyebrow block">{t("setup.clientSecret")}</span>
            <input
              className="input mt-1 w-full"
              type="password"
              value={clientSecret}
              onChange={(e) => {
                setClientSecret(e.target.value)
                setChecked(null)
              }}
              autoComplete="new-password"
              spellCheck={false}
            />
            <span className="mt-1 block text-[12px] opacity-55">
              {t("setup.secretHint")}
            </span>
          </label>
        </div>
      </section>

      <hr className="rule-thin" />

      <section>
        <span className="eyebrow">{t("setup.step", { current: 4, total: 4 })}</span>
        <h3 className="mt-0.5">{t("setup.verifyHeading")}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={verify}
            disabled={!ready || checking}
          >
            {checking ? t("setup.verifying") : t("setup.verify")}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={saveAndSignIn}
            disabled={!ready || saving}
          >
            {saving
              ? t("setup.saving")
              : checked && !checked.ok
                ? t("setup.saveAnyway")
                : t("setup.saveAndSignIn")}
          </button>
        </div>

        {checked && (
          <p
            className="mt-3 border-2 px-3 py-2 text-[13px]"
            style={{
              borderColor: checked.ok ? "var(--color-divider)" : "var(--color-accent)",
            }}
          >
            {checked.message}
          </p>
        )}

        {error && (
          <p className="mt-3 border-2 border-accent px-3 py-2 text-[13px]">{error}</p>
        )}
      </section>
    </div>
  )
}
