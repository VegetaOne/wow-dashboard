/**
 * Geldbeträge. Die API rechnet durchgehend in Kupfer.
 *
 * 1 Gold = 100 Silber = 10’000 Kupfer.
 *
 * Bewusst keine Dezimalzahl („1234.56g"): im Spiel sind Gold, Silber und
 * Kupfer getrennte Einheiten, und ein gerundeter Goldwert verwischt gerade
 * bei Reagenzien den Unterschied, auf den es ankommt – 50 Kupfer gegen
 * 50 Silber ist Faktor hundert.
 */

import { formatNumber } from "./format"

const COPPER_PER_SILVER = 100
const COPPER_PER_GOLD = 10_000

export interface Money {
  gold: number
  silver: number
  copper: number
}

export function splitMoney(totalCopper: number): Money {
  const total = Math.max(0, Math.trunc(totalCopper))
  return {
    gold: Math.floor(total / COPPER_PER_GOLD),
    silver: Math.floor((total % COPPER_PER_GOLD) / COPPER_PER_SILVER),
    copper: total % COPPER_PER_SILVER,
  }
}

/**
 * Betrag als Text, z. B. „1’234g 56s 78k".
 *
 * Führende Nulleinheiten fallen weg (aus 56 Silber wird „56s 00k", nicht
 * „0g 56s 00k"), nachfolgende bleiben zweistellig – so stehen die Ziffern
 * in einer Spalte untereinander.
 */
export function formatMoney(totalCopper: number | null | undefined): string {
  if (typeof totalCopper !== "number" || !Number.isFinite(totalCopper)) return "—"

  // Negative Beträge dürfen nicht stillschweigend zu 0 werden: ein Verlust
  // ist eine Aussage, „0k" wäre eine andere.
  if (totalCopper < 0) return `−${formatMoney(-totalCopper)}`

  const { gold, silver, copper } = splitMoney(totalCopper)
  const pad = (n: number) => String(n).padStart(2, "0")

  if (gold > 0) return `${formatNumber(gold)}g ${pad(silver)}s ${pad(copper)}k`
  if (silver > 0) return `${silver}s ${pad(copper)}k`
  return `${copper}k`
}

/** Nur die Goldstelle, für knappe Spalten. Rundet zur Null hin – nie auf. */
export function formatGold(totalCopper: number | null | undefined): string {
  if (typeof totalCopper !== "number" || !Number.isFinite(totalCopper)) return "—"
  if (totalCopper < 0) return `−${formatGold(-totalCopper)}`
  return `${formatNumber(Math.floor(totalCopper / COPPER_PER_GOLD))}g`
}
