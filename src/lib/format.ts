/**
 * Zahlen- und Datumsformatierung, bewusst ohne `toLocaleString`.
 *
 * Grund: `toLocaleString` hängt davon ab, wie vollständig die ICU-Daten der
 * Laufzeit sind. Fehlt die Locale, fällt Node still auf en-US zurück – aus
 * `12'345` würde `12,345`, was auf Deutsch als Dezimalzahl gelesen wird.
 * Im Container kann die Ausstattung anders sein als in der Entwicklung,
 * und so ein Unterschied fällt erst auf, wenn jemand die Zahl falsch liest.
 *
 * Als Tausendertrennzeichen wird das typografische Apostroph (U+2019)
 * verwendet – Schweizer Konvention, und React maskiert es nicht.
 */

const THOUSANDS = "’"

/** 12345 → 12’345 */
export function formatNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"

  const negative = value < 0
  const digits = Math.trunc(Math.abs(value)).toString()

  let out = ""
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += THOUSANDS
    out += digits[i]
  }

  return negative ? `-${out}` : out
}

/** Datum als TT.MM.JJJJ, unabhängig von der Locale-Ausstattung. */
export function formatDate(timestamp: number | null | undefined): string {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return "—"

  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return "—"

  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}.${month}.${d.getFullYear()}`
}

/** Millisekunden als m:ss. */
export function formatDuration(ms: number | null | undefined): string {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—"
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

/** „1 Tag" / „6 Tagen" – der Dativ Plural ist bei Eins falsch. */
export function formatDays(count: number): string {
  return count === 1 ? "1 Tag" : `${formatNumber(count)} Tagen`
}
