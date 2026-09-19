/**
 * Zahlen- und Datumsformatierung, bewusst ohne `toLocaleString`.
 *
 * Grund: `toLocaleString` hängt davon ab, wie vollständig die ICU-Daten der
 * Laufzeit sind. Fehlt die Locale, fällt Node still auf en-US zurück – aus
 * `12'345` würde `12,345`, was auf Deutsch als Dezimalzahl gelesen wird.
 * Im Container kann die Ausstattung anders sein als in der Entwicklung,
 * und so ein Unterschied fällt erst auf, wenn jemand die Zahl falsch liest.
 *
 * Die Formatierer sind an die Sprache gebunden (`createFormat`), nach
 * demselben Muster wie `t()`/`useT()`: eine Komponente bekommt `f` herein,
 * statt die Sprache durch jeden einzelnen Aufruf zu schleifen. Ein optionaler
 * Sprachparameter mit Standardwert ist ausdrücklich nicht vorgesehen – das
 * wäre derselbe stille Rückfall, den diese Datei gerade vermeiden soll.
 *
 * Darf nichts serverseitiges importieren: landet über die Client-Komponenten
 * auch im Bündel des Browsers.
 */

import type { Language } from "./config-cache"
import { moneySuffixes, formatMoneyText, formatGoldText } from "./money"

export interface Format {
  /** 12345 → 12’345 (de) / 12,345 (en) */
  number(value: number | null | undefined): string
  /** TT.MM.JJJJ (de) / DD/MM/YYYY (en) */
  date(timestamp: number | null | undefined): string
  /** m:ss – sprachunabhängig */
  duration(ms: number | null | undefined): string
  /** 1’234g 56s 78k (de) / 1,234g 56s 78c (en) */
  money(totalCopper: number | null | undefined): string
  /** nur die Goldstelle */
  gold(totalCopper: number | null | undefined): string
}

const THOUSANDS: Record<Language, string> = {
  de: "’",
  en: ",",
}

function formatNumberFor(language: Language, value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"

  const thousands = THOUSANDS[language] ?? THOUSANDS.en
  const negative = value < 0
  const digits = Math.trunc(Math.abs(value)).toString()

  let out = ""
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += thousands
    out += digits[i]
  }

  return negative ? `-${out}` : out
}

/** Datum, unabhängig von der Locale-Ausstattung der Laufzeit. */
function formatDateFor(language: Language, timestamp: number | null | undefined): string {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return "—"

  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return "—"

  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()

  return language === "de" ? `${day}.${month}.${year}` : `${day}/${month}/${year}`
}

/** Millisekunden als m:ss. Bleibt frei exportiert, weil sprachunabhängig. */
export function formatDuration(ms: number | null | undefined): string {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—"
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

/** Formatierer für eine Sprache – für `useFormat()` und `getFormat()`. */
export function createFormat(language: Language): Format {
  const number = (value: number | null | undefined) => formatNumberFor(language, value)
  const suffixes = moneySuffixes(language)

  return {
    number,
    date: (timestamp) => formatDateFor(language, timestamp),
    duration: formatDuration,
    money: (totalCopper) => formatMoneyText(totalCopper, suffixes, number),
    gold: (totalCopper) => formatGoldText(totalCopper, suffixes, number),
  }
}
