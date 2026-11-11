#!/usr/bin/env node
/**
 * Schlüsseldatei erneuern, ohne die gespeicherten Secrets zu verlieren.
 *
 * Anlass: `prisma/config.key` lag bis 2026-11-11 im öffentlichen Repo. Wer die
 * alte Datei hat, kann damit eine Datenbank entschlüsseln, die mit ihr
 * verschlüsselt wurde. Dieses Skript erzeugt einen neuen Schlüssel und
 * verschlüsselt das Battle.net Client Secret und das Warcraft-Logs-Secret
 * damit neu. Danach ist die alte Datei wertlos.
 *
 * Einfach die Schlüsseldatei zu löschen ginge nicht: die App erzeugt dann zwar
 * einen neuen Schlüssel, kann das gespeicherte Secret aber nicht mehr lesen –
 * und weil der Setup nach dem Abschluss gesperrt ist, käme man nicht mehr an
 * die Einstellungen heran.
 *
 * Aufruf, im Projektordner und bei **gestoppter** App (sie hält den Schlüssel
 * im Speicher und würde sonst mit dem alten weiterschreiben):
 *
 *   node tools/rotate-key.mjs
 *
 * Datenbank und Schlüssel werden wie in der App gefunden: über DATABASE_URL,
 * sonst `file:./dev.db` relativ zu `prisma/`. Vorher beides sichern.
 *
 * Ablauf, so gewählt, dass ein Abbruch nichts kaputt macht:
 * 1. alten Schlüssel lesen, beide Secrets damit entschlüsseln – scheitert
 *    eines, wird abgebrochen, bevor etwas geschrieben ist
 * 2. neuen Schlüssel als `config.key.new` ablegen
 * 3. Datenbank mit den neu verschlüsselten Werten aktualisieren
 * 4. `config.key.new` über `config.key` schieben
 * Bricht es zwischen 3 und 4 ab, liegt `config.key.new` noch da; das Skript
 * erkennt das beim nächsten Lauf und sagt, was zu tun ist.
 */

import { chmodSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { newKey, parseKey, reencrypt } from "./secret-format.mjs"

/** Wie `keyPath()` in `src/lib/secrets.ts` – beide müssen dieselbe Datei finden. */
function keyPath() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db"
  const raw = url.startsWith("file:") ? url.slice("file:".length) : url
  const abs = isAbsolute(raw) ? raw : resolve(join(process.cwd(), "prisma", raw))
  return join(dirname(abs), "config.key")
}

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

async function main() {
  const path = keyPath()
  const pending = `${path}.new`

  if (existsSync(pending)) {
    fail(
      `${pending} liegt noch da – ein früherer Lauf wurde unterbrochen.\n` +
        "  Ist die Datenbank schon umgeschlüsselt, gehört diese Datei an die Stelle von config.key.\n" +
        "  Im Zweifel beide Dateien und die Datenbank aus dem Backup zurückholen."
    )
  }
  if (!existsSync(path)) {
    fail(`Keine Schlüsseldatei unter ${path}. Nichts zu erneuern.`)
  }

  const oldKey = parseKey(readFileSync(path, "utf8"))

  // Erst hier laden: ohne generierten Client soll die Meldung oben verständlich bleiben
  const { PrismaClient } = await import("@prisma/client")
  const prisma = new PrismaClient()

  try {
    const row = await prisma.appConfig.findUnique({ where: { id: "singleton" } })
    if (!row) fail("Keine Konfiguration in der Datenbank – der Setup ist noch nicht gelaufen.")

    const key = newKey()

    // Schritt 1: alles umschlüsseln, bevor irgendetwas geschrieben wird
    const bnetClientSecret = reencrypt(row.bnetClientSecret, oldKey, key, "Battle.net Client Secret")
    const warcraftLogsSecret = reencrypt(row.warcraftLogsSecret, oldKey, key, "Warcraft-Logs-Secret")

    // Schritt 2
    writeFileSync(pending, key.toString("hex"), { encoding: "utf8", mode: 0o600 })
    try {
      chmodSync(pending, 0o600)
    } catch {
      // Auf Windows weitgehend wirkungslos – kein Grund abzubrechen
    }

    // Schritt 3
    try {
      await prisma.appConfig.update({
        where: { id: "singleton" },
        data: { bnetClientSecret, warcraftLogsSecret },
      })
    } catch (error) {
      rmSync(pending, { force: true })
      throw error
    }

    // Schritt 4
    renameSync(pending, path)

    console.log(`✓ Neuer Schlüssel in ${path}`)
    console.log("  Secrets neu verschlüsselt. Die alte Schlüsseldatei ist damit wertlos.")
    console.log("  Neues Backup von Datenbank und config.key anlegen – das alte passt nicht mehr zusammen.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)))
