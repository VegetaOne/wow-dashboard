/**
 * Format der verschlüsselten Secrets, als reine Funktionen.
 *
 * Gegenstück zu `src/lib/secrets.ts` für Werkzeuge ausserhalb der App
 * (`tools/rotate-key.mjs`). Die App selbst bleibt bei `secrets.ts`; hier steht
 * dasselbe Verfahren ohne Dateizugriff, damit es sich ohne Datenbank testen
 * lässt. Dass beide Seiten zusammenpassen, prüft ein fester Testvektor in
 * `secret-format.test.mjs`, erzeugt mit `secrets.ts` – ändert sich dort das
 * Format, schlägt der Test fehl, statt dass ein Schlüsseltausch Secrets
 * unlesbar macht.
 *
 * Format: `v1:iv:tag:ciphertext`, alles base64, AES-256-GCM, 12 Byte IV.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const PREFIX = "v1"

/** Schlüssel aus dem Inhalt der Schlüsseldatei (hex). Wirft bei falscher Länge. */
export function parseKey(hex) {
  const key = Buffer.from(String(hex).trim(), "hex")
  if (key.length !== 32) {
    throw new Error(`Schlüssel ist unbrauchbar (${key.length} statt 32 Bytes)`)
  }
  return key
}

export function newKey() {
  return randomBytes(32)
}

/** Klartext → `v1:iv:tag:ciphertext`. */
export function encrypt(plain, key) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":")
}

/**
 * Gespeicherter Wert → Klartext. `null` bei leerem Wert, fremdem Format oder
 * falschem Schlüssel – wie `decryptSecret` in der App.
 */
export function decrypt(stored, key) {
  if (!stored) return null
  const parts = String(stored).split(":")
  if (parts.length !== 4 || parts[0] !== PREFIX) return null
  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(parts[1], "base64"))
    decipher.setAuthTag(Buffer.from(parts[2], "base64"))
    return Buffer.concat([
      decipher.update(Buffer.from(parts[3], "base64")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    return null
  }
}

/**
 * Einen gespeicherten Wert vom alten auf den neuen Schlüssel umschlüsseln.
 *
 * Leere Werte bleiben leer. Ein vorhandener Wert, der sich mit dem alten
 * Schlüssel **nicht** entschlüsseln lässt, wirft – lieber abbrechen, als ein
 * Secret stillschweigend zu verlieren.
 */
export function reencrypt(stored, oldKey, newKeyBuffer, label = "Wert") {
  if (!stored) return stored ?? null
  const plain = decrypt(stored, oldKey)
  if (plain === null) {
    throw new Error(
      `${label} lässt sich mit dem aktuellen Schlüssel nicht entschlüsseln – Abbruch, nichts geändert`
    )
  }
  return encrypt(plain, newKeyBuffer)
}
