"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ALL_GAME_MODES,
  LANGUAGES,
  REGIONS,
  type AppConfigView,
  type Language,
} from "@/lib/config-cache"
import type { GameMode } from "@/lib/battlenet"
import type { TranslationKey } from "@/lib/i18n"
import { useT } from "./I18nProvider"

const MODE_LABELS: Record<GameMode, TranslationKey> = {
  retail: "mode.retail",
  classic: "mode.classic",
  "classic-era": "mode.classicEra",
}

/**
 * Einstellungen nach dem Setup.
 *
 * Das Secret wird nie angezeigt – auch nicht maskiert mit echten Zeichen.
 * Das Feld ist leer und bedeutet „unverändert"; nur wer etwas einträgt,
 * ersetzt es. Ein Formular, das ein Geheimnis zurücksendet, um es
 * unverändert zu speichern, hat es einmal zu oft durch den Browser
 * geschickt.
 */
export function SettingsForm({ config }: { config: AppConfigView }) {
  const t = useT()
  const router = useRouter()

  const [language, setLanguage] = useState<Language>(config.language)
  const [region, setRegion] = useState(config.region)
  const [clientId, setClientId] = useState(config.bnetClientId ?? "")
  const [clientSecret, setClientSecret] = useState("")
  const [modes, setModes] = useState<GameMode[]>(config.gameModes)
  const [defaultMode, setDefaultMode] = useState<GameMode>(config.defaultMode)
  const [pollSeconds, setPollSeconds] = useState(config.pollSeconds)
  const [wclId, setWclId] = useState(config.warcraftLogsClientId ?? "")
  const [wclSecret, setWclSecret] = useState("")

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const effectiveDefault = modes.includes(defaultMode) ? defaultMode : modes[0]

  function toggleMode(mode: GameMode) {
    setModes((current) =>
      current.includes(mode)
        ? current.filter((m) => m !== mode)
        : [...current, mode]
    )
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          region,
          bnetClientId: clientId,
          bnetClientSecret: clientSecret,
          gameModes: modes,
          defaultMode: effectiveDefault,
          pollSeconds,
          warcraftLogsClientId: wclId,
          warcraftLogsSecret: wclSecret,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || t("setup.saveFailed") })
      } else {
        setClientSecret("")
        setWclSecret("")
        setMessage({ ok: true, text: t("settings.saved") })
        router.refresh()
      }
    } catch {
      setMessage({ ok: false, text: t("setup.saveFailed") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h3>{t("setup.language")}</h3>
        <p className="mt-1 max-w-[70ch] text-[13px] opacity-60">
          {t("settings.languageHint")}
        </p>
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

      <section>
        <h3>{t("setup.region")}</h3>
        <p className="mt-1 max-w-[70ch] text-[13px] opacity-60">
          {t("settings.regionHint")}
        </p>
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

      <section>
        <h3>{t("settings.bnetCredentials")}</h3>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="eyebrow block">{t("setup.clientId")}</span>
            <input
              className="input mt-1 w-full"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="block">
            <span className="eyebrow block">
              {t("setup.clientSecret")}{" "}
              {config.hasClientSecret
                ? t("settings.secretSet")
                : t("settings.secretMissing")}
            </span>
            <input
              className="input mt-1 w-full"
              type="password"
              placeholder={
                config.hasClientSecret
                  ? t("settings.leaveEmpty")
                  : t("settings.enterSecret")
              }
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              autoComplete="new-password"
            />
            <span className="mt-1 block text-[12px] opacity-55">
              {t("settings.secretNeverReturned")}
            </span>
          </label>
        </div>
      </section>

      <section>
        <h3>{t("settings.gameModes")}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_GAME_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => toggleMode(mode)}
              className={`btn ${modes.includes(mode) ? "btn-primary" : "btn-secondary"}`}
            >
              {t(MODE_LABELS[mode])}
            </button>
          ))}
        </div>

        <h4 className="mt-6">{t("settings.startView")}</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDefaultMode(mode)}
              className={`btn ${effectiveDefault === mode ? "btn-primary" : "btn-secondary"}`}
            >
              {t(MODE_LABELS[mode])}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>{t("settings.pollInterval")}</h3>
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
          {t("settings.wclHint")}
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="eyebrow block">{t("setup.clientId")}</span>
            <input
              className="input mt-1 w-full"
              value={wclId}
              onChange={(e) => setWclId(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="eyebrow block">
              {t("setup.clientSecret")}{" "}
              {config.hasWarcraftLogsSecret ? t("settings.secretSet") : ""}
            </span>
            <input
              className="input mt-1 w-full"
              type="password"
              placeholder={
                config.hasWarcraftLogsSecret ? t("settings.leaveEmpty") : ""
              }
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
          onClick={save}
          disabled={saving || modes.length === 0 || !clientId.trim()}
        >
          {saving ? t("setup.saving") : t("settings.save")}
        </button>

        {message && (
          <span
            className="text-[13px]"
            style={{ color: message.ok ? "inherit" : "var(--color-accent)" }}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  )
}
