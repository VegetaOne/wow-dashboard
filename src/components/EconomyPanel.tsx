"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { GameMode } from "@/lib/battlenet"
import type { AuctionHouse, HouseStatus } from "@/lib/auction"
import type { MarginRow } from "@/lib/economy"
import type { ProfessionView } from "@/lib/professions"
import { useFormat } from "./I18nProvider"

/** Rezepte pro Berechnung – dieselbe Obergrenze wie in der Route. */
const BATCH = 30

interface IndexResponse {
  connectedRealmId: number
  houses: AuctionHouse[]
  housesError: string | null
  statuses: HouseStatus[]
}

export function EconomyPanel({
  mode,
  realm,
  professions,
}: {
  mode: GameMode
  realm: string
  professions: ProfessionView[]
}) {
  const f = useFormat()
  const [index, setIndex] = useState<IndexResponse | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [houseId, setHouseId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [tierKey, setTierKey] = useState<string>("")
  const [rows, setRows] = useState<MarginRow[]>([])
  const [computed, setComputed] = useState(0)
  const [computing, setComputing] = useState(false)
  const [computeError, setComputeError] = useState<string | null>(null)
  const [unresolved, setUnresolved] = useState(0)

  // Nur einmal laden – ein zweiter Lauf würde den Zustand zurücksetzen
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    let cancelled = false

    async function load() {
      try {
        const res = await fetch(
          `/api/wow/auction-index?mode=${encodeURIComponent(mode)}&realm=${encodeURIComponent(realm)}`
        )
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = (await res.json()) as IndexResponse
        if (cancelled) return

        setIndex(data)
        if (data.houses.length > 0) setHouseId(data.houses[0].id)
      } catch {
        if (!cancelled) {
          setIndexError("Die Auktionshäuser dieses Realms sind nicht abrufbar.")
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [mode, realm])

  /** Alle Stufen mit bekannten Rezepten, flach für die Auswahl. */
  const tiers = useMemo(
    () =>
      professions.flatMap((p) =>
        p.tiers
          .filter((t) => t.knownRecipes.length > 0)
          .map((t) => ({
            key: `${p.professionId}-${t.tierId}`,
            label: `${p.professionName} · ${t.tierName}`,
            recipeIds: t.knownRecipes.map((r) => r.id),
          }))
      ),
    [professions]
  )

  const selectedTier = tiers.find((t) => t.key === tierKey) ?? tiers[0] ?? null
  const status = index?.statuses.find((s) => s.houseId === houseId) ?? null
  const house = index?.houses.find((h) => h.id === houseId) ?? null
  const hasPrices = (status?.itemCount ?? 0) > 0

  const resetRows = useCallback(() => {
    setRows([])
    setComputed(0)
    setUnresolved(0)
    setComputeError(null)
  }, [])

  async function refreshPrices() {
    if (!index || houseId === null) return

    setRefreshing(true)
    setComputeError(null)

    try {
      const res = await fetch("/api/wow/auction-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          connectedRealmId: index.connectedRealmId,
          houseId,
          houseName: house?.name,
        }),
      })

      const data = (await res.json()) as { status?: HouseStatus; error?: string }
      if (!res.ok || !data.status) {
        throw new Error(data.error ?? `Status ${res.status}`)
      }

      setIndex((prev) =>
        prev
          ? {
              ...prev,
              statuses: [
                ...prev.statuses.filter((s) => s.houseId !== houseId),
                data.status!,
              ],
            }
          : prev
      )
      resetRows()
    } catch (error) {
      setComputeError(
        error instanceof Error
          ? `Preise nicht eingelesen: ${error.message}`
          : "Preise nicht eingelesen."
      )
    } finally {
      setRefreshing(false)
    }
  }

  async function computeNext() {
    if (!index || houseId === null || !selectedTier) return

    const next = selectedTier.recipeIds.slice(computed, computed + BATCH)
    if (next.length === 0) return

    setComputing(true)
    setComputeError(null)

    try {
      const res = await fetch("/api/wow/economy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          connectedRealmId: index.connectedRealmId,
          houseId,
          recipeIds: next,
        }),
      })

      const data = (await res.json()) as {
        rows?: MarginRow[]
        unresolved?: number
        error?: string
      }
      if (!res.ok || !data.rows) {
        throw new Error(data.error ?? `Status ${res.status}`)
      }

      setRows((prev) => [...prev, ...data.rows!])
      setComputed((c) => c + next.length)
      setUnresolved((u) => u + (data.unresolved ?? 0))
    } catch {
      setComputeError("Die Berechnung ist fehlgeschlagen.")
    } finally {
      setComputing(false)
    }
  }

  // ─── Fälle, in denen es nichts zu rechnen gibt ─────────────────────────────

  if (indexError) {
    return (
      <div className="border-2 border-accent px-4 py-3 text-[13px]">
        <span className="eyebrow block">Auktionshaus nicht erreichbar</span>
        {indexError}
      </div>
    )
  }

  if (!index) {
    return (
      <div className="border-2 border-line px-4 py-3 text-[13px] opacity-60">
        Auktionshäuser werden geladen…
      </div>
    )
  }

  if (index.houses.length === 0) {
    return (
      <div className="border-2 border-accent px-4 py-3 text-[13px]">
        <span className="eyebrow block">Keine Auktionsdaten für diesen Modus</span>
        Die API führt für diesen Realm kein Auktionshaus.
        {index.housesError && (
          <span className="mt-1 block opacity-60">{index.housesError}</span>
        )}
        <span className="mt-2 block opacity-75">
          In Classic Era antworten die Auktionsendpunkte laut Blizzards eigenem
          Forum seit Ende 2024 mit 404. Sobald sie wieder liefern, erscheinen die
          Häuser hier ohne Änderung an der App.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Haus und Preisstand ─────────────────────────────────────────── */}
      <div className="border-2 border-line">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
          <span className="eyebrow">Haus</span>

          {index.houses.length > 1 ? (
            <select
              className="input max-w-[220px]"
              value={houseId ?? ""}
              onChange={(e) => {
                setHouseId(Number(e.target.value))
                resetRows()
              }}
            >
              {index.houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[13px]">{index.houses[0].name}</span>
          )}

          <button
            onClick={refreshPrices}
            disabled={refreshing}
            className="btn btn-secondary ml-auto text-[12px]"
            title="Lädt alle Angebote dieses Hauses und verdichtet sie zu Preisen. Das ist die grösste Anfrage der App."
          >
            {refreshing ? "Liest ein…" : hasPrices ? "Preise erneuern" : "Preise einlesen"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 lg:grid-cols-4">
          <Fact
            label="Preisstand"
            value={
              status?.updatedAt
                ? new Date(status.updatedAt).toLocaleString("de-CH")
                : "noch nicht eingelesen"
            }
          />
          <Fact
            label="Gegenstände mit Preis"
            value={status ? f.number(status.itemCount) : "—"}
          />
          <Fact
            label="Angebote gelesen"
            value={status ? f.number(status.auctionCount) : "—"}
          />
          <Fact
            label="Ohne Sofortkauf"
            value={status ? f.number(status.skippedCount) : "—"}
            note="ergeben keinen Preis"
          />
        </div>

        {status?.status === "FAILED" && status.error && (
          <div className="border-t border-line px-4 py-2 text-[12px]">
            <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
              Letzter Versuch fehlgeschlagen
            </span>
            <span className="ml-2 opacity-70">{status.error}</span>
          </div>
        )}
      </div>

      {/* ── Rezepte ─────────────────────────────────────────────────────── */}
      {tiers.length === 0 ? (
        <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
          Für diesen Charakter sind keine Rezepte bekannt. Ohne Rezepte gibt es
          nichts zu rechnen.
        </div>
      ) : !hasPrices ? (
        <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
          Noch keine Preise für dieses Haus. Ohne Preise wären Kosten und Erlös
          erfunden — lies die Preise zuerst ein.
        </div>
      ) : (
        <div className="border-2 border-line">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
            <span className="eyebrow">Beruf</span>
            <select
              className="input max-w-[280px]"
              value={selectedTier?.key ?? ""}
              onChange={(e) => {
                setTierKey(e.target.value)
                resetRows()
              }}
            >
              {tiers.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>

            <span className="ml-auto eyebrow">
              {selectedTier
                ? `${f.number(computed)} von ${f.number(selectedTier.recipeIds.length)} Rezepten gerechnet`
                : ""}
            </span>
          </div>

          {computeError && (
            <div className="border-b border-line px-4 py-2 text-[12px]">
              <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
                {computeError}
              </span>
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="hidden border-b border-line px-4 py-1.5 lg:flex">
                <span className="eyebrow flex-1">Rezept</span>
                <span className="eyebrow w-28 text-right">Kosten</span>
                <span className="eyebrow w-28 text-right">Erlös</span>
                <span className="eyebrow w-28 text-right">Gewinn</span>
              </div>

              {rows.map((row) => (
                <MarginLine key={row.recipeId} row={row} />
              ))}
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5">
            {selectedTier && computed < selectedTier.recipeIds.length ? (
              <button
                onClick={computeNext}
                disabled={computing}
                className="btn btn-secondary text-[12px]"
              >
                {computing
                  ? "Rechnet…"
                  : rows.length === 0
                    ? `Erste ${f.number(Math.min(BATCH, selectedTier.recipeIds.length))} rechnen`
                    : `Weitere ${f.number(Math.min(BATCH, selectedTier.recipeIds.length - computed))} rechnen`}
              </button>
            ) : (
              <span className="text-[12px] opacity-55">
                Alle Rezepte dieser Stufe gerechnet.
              </span>
            )}

            {unresolved > 0 && (
              <span className="text-[12px] opacity-55">
                {`${f.number(unresolved)} Rezepte ohne Details in der API — nicht gerechnet.`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Fact({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div>
      <span className="eyebrow block">{label}</span>
      <span className="text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      {note && <span className="ml-1 text-[11px] opacity-50">{note}</span>}
    </div>
  )
}

export function MarginLine({ row }: { row: MarginRow }) {
  const f = useFormat()
  const positive = row.margin !== null && row.margin > 0

  return (
    <div className="border-b border-line px-4 py-2.5 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="min-w-0 flex-1 basis-[200px] truncate text-[13px]">
          {row.recipeName}
          {row.craftedQuantity > 1 && (
            <span className="ml-1 opacity-50">{`×${row.craftedQuantity}`}</span>
          )}
        </span>

        <span
          className="w-28 flex-none text-right text-[12px] opacity-75"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {f.money(row.totalCost)}
        </span>

        <span
          className="w-28 flex-none text-right text-[12px] opacity-75"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {f.money(row.revenue)}
        </span>

        <span
          className="w-28 flex-none text-right font-heading text-[13px] font-extrabold"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {/* Vorzeichen statt Farbe allein – lesbar auch ohne Farbwahrnehmung */}
          {row.margin === null
            ? "—"
            : `${positive ? "+" : "−"}${f.money(Math.abs(row.margin))}`}
        </span>
      </div>

      {(row.missingReagents.length > 0 || row.saleUnknown) && (
        <div className="mt-1 text-[11px] opacity-55">
          {row.missingReagents.length > 0 && (
            <span>
              {`Kein Angebot für: ${row.missingReagents.slice(0, 3).join(", ")}`}
              {row.missingReagents.length > 3 &&
                ` und ${f.number(row.missingReagents.length - 3)} weitere`}
              {" — darum keine Kostensumme."}
            </span>
          )}
          {row.missingReagents.length > 0 && row.saleUnknown && " "}
          {row.saleUnknown && (
            <span>
              {row.craftedItemName
                ? `„${row.craftedItemName}" wird gerade nicht angeboten — kein Erlös bekannt.`
                : "Das Ergebnis wird gerade nicht angeboten — kein Erlös bekannt."}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
