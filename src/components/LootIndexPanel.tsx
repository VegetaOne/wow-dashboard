"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GameMode } from "@/lib/battlenet"
import { useT } from "./I18nProvider"
import type { TranslationKey } from "@/lib/i18n"

interface IndexStatus {
  gameMode: string
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED" | "EMPTY"
  totalInstances: number
  indexedInstances: number
  itemCount: number
  error: string | null
}

const STATUS_LABEL_KEY: Record<IndexStatus["status"], TranslationKey> = {
  PENDING: "loot.index.pending",
  RUNNING: "loot.index.running",
  DONE: "loot.index.done",
  FAILED: "loot.index.failed",
  EMPTY: "loot.index.empty",
}

/**
 * Steuert den Loot-Index. Der Durchlauf kostet hunderte API-Anfragen,
 * deshalb läuft er instanzweise und der Client treibt die Schleife –
 * so bleibt jede Anfrage kurz und der Fortschritt sichtbar.
 */
export function LootIndexPanel({ mode }: { mode: GameMode }) {
  const t = useT()
  const [status, setStatus] = useState<IndexStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/wow/loot-index?mode=${mode}`)
      const data = await res.json()
      if (data.status) setStatus(data.status)
    } catch {
      // Stiller Fehlschlag: der Knopf bleibt bedienbar
    }
  }, [mode])

  useEffect(() => {
    cancelRef.current = true // laufende Schleife eines anderen Modus stoppen
    setBusy(false)
    setCurrent(null)
    setError(null)
    fetchStatus()
  }, [mode, fetchStatus])

  async function step(action: "start" | "step") {
    const res = await fetch(`/api/wow/loot-index?mode=${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.status as IndexStatus & { justIndexed?: string }
  }

  /** fresh = von vorn aufbauen, sonst an der offenen Warteschlange weiter */
  async function run(fresh: boolean) {
    setBusy(true)
    setError(null)
    cancelRef.current = false

    try {
      let s = fresh ? await step("start") : await step("step")
      setStatus(s)
      setCurrent(s.justIndexed ?? null)

      // Schleife über alle Instanzen – jede Anfrage bleibt kurz
      let guard = 0
      while (s.status === "RUNNING" && !cancelRef.current && guard < 500) {
        guard++
        s = await step("step")
        setStatus(s)
        setCurrent(s.justIndexed ?? null)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setCurrent(null)
    }
  }

  if (!status) return null

  const pct =
    status.totalInstances > 0
      ? Math.round((status.indexedInstances / status.totalInstances) * 100)
      : 0

  return (
    <div className="mb-8 border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.08em]">
          {t("loot.index.title")}
        </span>
        <span className="eyebrow">
          {t(STATUS_LABEL_KEY[status.status])}
          {status.itemCount > 0
            ? ` · ${t("loot.index.itemCount", { count: status.itemCount })}`
            : ""}
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[13px] opacity-75">{t("loot.index.hint")}</p>

        {status.status === "EMPTY" && (
          <p className="mt-2 text-[13px]" style={{ color: "var(--color-accent)" }}>
            {status.error ?? t("loot.index.noInstances")}
          </p>
        )}

        {error && (
          <p className="mt-2 text-[13px]" style={{ color: "var(--color-accent)" }}>
            {error}
          </p>
        )}

        {(busy || status.status === "RUNNING") && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="eyebrow">
                {t("loot.index.instancesProgress", {
                  indexed: status.indexedInstances,
                  total: status.totalInstances,
                })}
              </span>
              <span className="eyebrow">{pct}%</span>
            </div>
            <div className="mt-1 h-2 bg-neutral-300">
              <div
                className="h-2 transition-[width] duration-300"
                style={{ width: `${pct}%`, background: "var(--color-accent)" }}
              />
            </div>
            {current && (
              <span className="mt-1 block text-[11px] opacity-55">{current}</span>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {/* Angefangener Lauf: weitermachen statt alles neu holen */}
          {!busy && status.status === "RUNNING" && (
            <button onClick={() => run(false)} className="btn btn-primary">
              {t("loot.index.resume", {
                count: status.totalInstances - status.indexedInstances,
              })}
            </button>
          )}

          <button
            onClick={() => run(true)}
            disabled={busy}
            className={
              status.status === "RUNNING" && !busy
                ? "btn btn-secondary"
                : "btn btn-primary"
            }
          >
            {busy
              ? t("loot.index.runningEllipsis")
              : status.itemCount > 0 || status.status === "RUNNING"
                ? t("loot.index.rebuild")
                : t("loot.index.build")}
          </button>

          {busy && (
            <button
              onClick={() => {
                cancelRef.current = true
              }}
              className="btn btn-secondary"
            >
              {t("loot.index.cancel")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
