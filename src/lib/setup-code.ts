/**
 * Einrichtungscode: schützt Stufe 1 des Setups.
 *
 * Stufe 1 ist ohne Anmeldung erreichbar – anders geht es nicht, siehe
 * `docs/setup-modus.md`. Ohne Schutz könnte jeder im Heimnetz, der die
 * Seite vor dem Besitzer öffnet, eigene Zugangsdaten eintragen und sich mit
 * Stufe 2 zum Besitzer machen. Der Code beweist, dass man an die Logs des
 * Containers kommt, also an die Maschine.
 *
 * - Erzeugt beim Start (aus `instrumentation.ts`) oder beim ersten Bedarf,
 *   nur solange der Setup offen ist. Gilt bis zum Neustart.
 * - Steht **bewusst im Log** – die einzige Ausnahme von „nichts Geheimes ins
 *   Log": er ist einmalig, wertlos nach dem Setup und genau dafür gemacht.
 * - Stufe 1 setzt nach richtigem Code ein Cookie mit dessen Hash; Stufe 2
 *   (`/api/setup/complete`) verlangt es. Sonst könnte sich zwischen Stufe 1
 *   und dem Abschluss ein anderer Account als Besitzer eintragen.
 */

import { createHash, randomInt, timingSafeEqual } from "crypto"

/** Ohne 0/O, 1/I/L – der Code wird abgetippt. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const LENGTH = 8

export const SETUP_PROOF_COOKIE = "wow-dashboard.setup-proof"

// An globalThis: instrumentation, Seite und Routen sind getrennte Bündel
const KEY = Symbol.for("wow-dashboard.setup-code")
const store = globalThis as unknown as { [KEY]?: string }

function generate(): string {
  let code = ""
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)]
  return code
}

/** Anzeigeform: `ABCD-EFGH`. */
function pretty(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/** Eingabe vereinheitlichen: Gross, ohne Leer- und Bindestriche. */
function normalize(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "")
}

function hash(code: string): Buffer {
  return createHash("sha256").update(`setup:${code}`).digest()
}

/**
 * Den laufenden Code holen, beim ersten Aufruf erzeugen und ins Log
 * schreiben. Wer den Setup offen sieht, ruft das auf – so steht der Code im
 * Log, auch wenn der Start ihn nicht erzeugen konnte.
 */
export function ensureSetupCode(): void {
  if (store[KEY]) return
  const code = generate()
  store[KEY] = code
  console.log(
    [
      "[setup] ─────────────────────────────────────────────",
      `[setup] Einrichtungscode: ${pretty(code)}`,
      "[setup] Auf der Setup-Seite eingeben. Gilt bis zum nächsten Neustart.",
      "[setup] ─────────────────────────────────────────────",
    ].join("\n")
  )
}

/** Nach dem Abschluss: der Code hat ausgedient. */
export function clearSetupCode(): void {
  delete store[KEY]
}

/** Stimmt die Eingabe? Vergleich in konstanter Zeit, über die Hashes. */
export function checkSetupCode(input: unknown): boolean {
  const code = store[KEY]
  if (!code || typeof input !== "string") return false
  return timingSafeEqual(hash(normalize(input)), hash(code))
}

/** Cookie-Wert nach richtigem Code – der Hash, nie der Code selbst. */
export function setupProof(): string | null {
  const code = store[KEY]
  return code ? hash(code).toString("hex") : null
}

/** Trägt die Anfrage den Nachweis aus Stufe 1? */
export function checkSetupProof(cookie: string | undefined): boolean {
  const expected = setupProof()
  if (!expected || !cookie || cookie.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(expected))
}
