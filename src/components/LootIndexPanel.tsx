"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GameMode } from "@/lib/battlenet"

interface IndexStatus {
  gameMode: string
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED" | "EMPTY"
  totalInstances: number
  indexedInstances: number
  itemCount: number
  error: string | null
}

const STATUS_LABEL: Record<IndexStatus["status"], string> = {
  PENDING: "Nicht indexiert",
  RUNNING: "Läuft",
  DONE: "Fertig",
  FAILED: "Fehlgeschlagen",
  EMPTY: "Keine Daten",
}

/**
 * Steuert den Loot-Index. Der Durchlauf kostet hunderte API-Anfragen,
 * deshalb läuft er instanzweise und der Client treibt die Schleife –
 * so bleibt jede Anfrage kurz und der Fortschritt sichtbar.
 */
export function LootIndexPanel({ mode }: { mode: GameMode }) {
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
          Loot-Index
        </span>
        <span className="eyebrow">
          {STATUS_LABEL[status.status]}
          {status.itemCount > 0 ? ` · ${status.itemCount} Gegenstände` : ""}
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[13px] opacity-75">
          Die Loot-Tabellen kommen aus der Journal-API. Ein Durchlauf holt alle
          Instanzen, Bosse und Gegenstandsdaten und legt sie lokal ab — das
          kostet einige Minuten, danach sind die Abfragen sofort da.
        </p>

        {status.status === "EMPTY" && (
          <p className="mt-2 text-[13px]" style={{ color: "var(--color-accent)" }}>
            {status.error ??
              "Die Journal-API liefert für diesen Spielmodus keine Instanzen."}
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
                {status.indexedInstances} von {status.totalInstances} Instanzen
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
              Fortsetzen ({status.totalInstances - status.indexedInstances} offen)
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
              ? "Läuft…"
              : status.itemCount > 0 || status.status === "RUNNING"
                ? "Neu aufbauen"
                : "Index aufbauen"}
          </button>

          {busy && (
            <button
              onClick={() => {
                cancelRef.current = true
              }}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
