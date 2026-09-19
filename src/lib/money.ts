/**
 * Geldbeträge. Die API rechnet durchgehend in Kupfer.
 *
 * 1 Gold = 100 Silber = 10’000 Kupfer.
 *
 * Bewusst keine Dezimalzahl („1234.56g"): im Spiel sind Gold, Silber und
 * Kupfer getrennte Einheiten, und ein gerundeter Goldwert verwischt gerade
 * bei Reagenzien den Unterschied, auf den es ankommt – 50 Kupfer gegen
 * 50 Silber ist Faktor hundert.
 *
 * Die Zahlenformatierung selbst liegt in `format.ts` und wird hier nur
 * hereingereicht (als Funktion, nicht per Import) – ein Import von dort
 * würde einen Kreis ergeben, weil `createFormat()` umgekehrt die
 * Münzsuffixe von hier braucht.
 *
 * Die Münzsuffixe bleiben ohne Wörterbucheintrag: sie sind Teil der
 * Zahlenformatierung, nicht Prosa, und so bleibt diese Datei ohne
 * Abhängigkeit zum Wörterbuch. Nur der Typ `Language` aus `config-cache`
 * wird gebraucht – nichts serverseitiges.
 */

import type { Language } from "./config-cache"

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

export interface MoneySuffixes {
  gold: string
  silver: string
  copper: string
}

/** de: Kupfer heisst „k", en: „copper" heisst „c". */
const SUFFIXES: Record<Language, MoneySuffixes> = {
  de: { gold: "g", silver: "s", copper: "k" },
  en: { gold: "g", silver: "s", copper: "c" },
}

export function moneySuffixes(language: Language): MoneySuffixes {
  return SUFFIXES[language] ?? SUFFIXES.en
}

/**
 * Betrag als Text, z. B. „1’234g 56s 78k".
 *
 * Führende Nulleinheiten fallen weg (aus 56 Silber wird „56s 00k", nicht
 * „0g 56s 00k"), nachfolgende bleiben zweistellig – so stehen die Ziffern
 * in einer Spalte untereinander.
 *
 * `formatGoldNumber` ist der Zahlenformatierer der eingestellten Sprache
 * (nur für die Goldstelle gebraucht, Silber/Kupfer sind immer zweistellig).
 */
export function formatMoneyText(
  totalCopper: number | null | undefined,
  suffixes: MoneySuffixes,
  formatGoldNumber: (n: number) => string
): string {
  if (typeof totalCopper !== "number" || !Number.isFinite(totalCopper)) return "—"

  // Negative Beträge dürfen nicht stillschweigend zu 0 werden: ein Verlust
  // ist eine Aussage, „0k" wäre eine andere.
  if (totalCopper < 0) {
    return `−${formatMoneyText(-totalCopper, suffixes, formatGoldNumber)}`
  }

  const { gold, silver, copper } = splitMoney(totalCopper)
  const pad = (n: number) => String(n).padStart(2, "0")

  if (gold > 0) {
    return `${formatGoldNumber(gold)}${suffixes.gold} ${pad(silver)}${suffixes.silver} ${pad(copper)}${suffixes.copper}`
  }
  if (silver > 0) return `${silver}${suffixes.silver} ${pad(copper)}${suffixes.copper}`
  return `${copper}${suffixes.copper}`
}

/** Nur die Goldstelle, für knappe Spalten. Rundet zur Null hin – nie auf. */
export function formatGoldText(
  totalCopper: number | null | undefined,
  suffixes: MoneySuffixes,
  formatGoldNumber: (n: number) => string
): string {
  if (typeof totalCopper !== "number" || !Number.isFinite(totalCopper)) return "—"
  if (totalCopper < 0) return `−${formatGoldText(-totalCopper, suffixes, formatGoldNumber)}`
  return `${formatGoldNumber(Math.floor(totalCopper / COPPER_PER_GOLD))}${suffixes.gold}`
}
