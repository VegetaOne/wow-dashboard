/**
 * Verschlüsselung der Zugangsdaten in der Datenbank.
 *
 * Verfahren: AES-256-GCM. Der Schlüssel wird beim ersten Bedarf erzeugt und
 * als Datei neben der Datenbank abgelegt, mit möglichst engen Rechten.
 *
 * Was das leistet und was nicht – ehrlich gesagt: geschützt ist die
 * Datenbankdatei allein. Wer sie kopiert (ein Backup, ein weitergegebenes
 * Volume), hat ohne die Schlüsseldatei nichts. Wer dagegen Zugriff auf das
 * Dateisystem des Containers hat, kommt an beides. Eine Verschlüsselung,
 * deren Schlüssel danebenliegt, ist keine Festung, und sie wird hier auch
 * nicht als solche verkauft.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto"
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, isAbsolute, join, resolve } from "path"

const ALGORITHM = "aes-256-gcm"
const PREFIX = "v1"

/**
 * Wo die Schlüsseldatei liegt: neben der Datenbank.
 *
 * Prisma löst einen relativen `file:`-Pfad gegen das Schema-Verzeichnis auf,
 * also gegen `prisma/`. Das wird hier nachgebildet, damit Schlüssel und
 * Datenbank zusammen liegen – auch im Container, wo beides im Volume steht.
 */
function keyPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db"
  const raw = url.startsWith("file:") ? url.slice("file:".length) : url
  const abs = isAbsolute(raw) ? raw : resolve(join(process.cwd(), "prisma", raw))
  return join(dirname(abs), "config.key")
}

let cachedKey: Buffer | null = null

function loadKey(): Buffer {
  if (cachedKey) return cachedKey

  const path = keyPath()

  if (existsSync(path)) {
    const hex = readFileSync(path, "utf8").trim()
    const key = Buffer.from(hex, "hex")
    if (key.length !== 32) {
      throw new Error(
        `Schlüsseldatei ${path} ist unbrauchbar (${key.length} statt 32 Bytes). ` +
          "Entfernen führt dazu, dass gespeicherte Secrets neu eingegeben werden müssen."
      )
    }
    cachedKey = key
    return key
  }

  const key = randomBytes(32)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, key.toString("hex"), { encoding: "utf8", mode: 0o600 })

  // Auf Windows ist chmod weitgehend wirkungslos – kein Grund abzubrechen.
  try {
    chmodSync(path, 0o600)
  } catch {
    // bewusst still
  }

  cachedKey = key
  return key
}

/** Klartext → `v1:iv:tag:ciphertext`, alles base64. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, loadKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":")
}

/**
 * Zurück zum Klartext. `null`, wenn nichts gespeichert ist oder der Wert
 * nicht zum Schlüssel passt – Letzteres passiert, wenn die Schlüsseldatei
 * verloren ging. Dann ist das Secret neu einzugeben, und die Oberfläche
 * sagt das auch, statt mit einem leeren Wert weiterzumachen.
 */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null

  const parts = stored.split(":")
  if (parts.length !== 4 || parts[0] !== PREFIX) return null

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      loadKey(),
      Buffer.from(parts[1], "base64")
    )
    decipher.setAuthTag(Buffer.from(parts[2], "base64"))
    const plain = Buffer.concat([
      decipher.update(Buffer.from(parts[3], "base64")),
      decipher.final(),
    ])
    return plain.toString("utf8")
  } catch {
    return null
  }
}

/** Zufälliger Sitzungsschlüssel für NextAuth – ersetzt `NEXTAUTH_SECRET`. */
export function generateAuthSecret(): string {
  return randomBytes(32).toString("base64")
}

/** Für die Oberfläche: „gesetzt", ohne den Wert preiszugeben. */
export function maskSecret(plain: string | null): string {
  if (!plain) return ""
  if (plain.length <= 8) return "••••••••"
  return `${"•".repeat(8)}${plain.slice(-4)}`
}
