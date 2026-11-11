/**
 * Tests zum Format der verschlüsselten Secrets.
 *
 * Aufruf: npm test   (node --test, ohne Abhängigkeit)
 */

import { test } from "node:test"
import assert from "node:assert/strict"
import { decrypt, encrypt, newKey, parseKey, reencrypt } from "./secret-format.mjs"

const KEY_HEX = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"

/**
 * Mit `src/lib/secrets.ts` und dem Schlüssel oben erzeugt (2026-11-11).
 * Hält beide Seiten zusammen: ändert sich das Format in der App, schlägt
 * dieser Test fehl.
 */
const VECTOR = "v1:vPRuh2YU9Zs8dmVz:1ho1KrZ3P+U1NKIfafgCsQ==:sLDaElazR8B+PA=="

test("liest einen Wert, den die App verschlüsselt hat", () => {
  assert.equal(decrypt(VECTOR, parseKey(KEY_HEX)), "geheim-123")
})

test("Hin und zurück ergibt den Klartext", () => {
  const key = newKey()
  assert.equal(decrypt(encrypt("ä-ö-ü ✓", key), key), "ä-ö-ü ✓")
})

test("falscher Schlüssel ergibt null, keinen Müll", () => {
  assert.equal(decrypt(VECTOR, newKey()), null)
})

test("leere und fremde Werte ergeben null", () => {
  const key = parseKey(KEY_HEX)
  assert.equal(decrypt(null, key), null)
  assert.equal(decrypt("", key), null)
  assert.equal(decrypt("klartext", key), null)
  assert.equal(decrypt("v2:a:b:c", key), null)
})

test("parseKey lehnt Schlüssel falscher Länge ab", () => {
  assert.throws(() => parseKey("abcd"))
  assert.equal(parseKey(`${KEY_HEX}\n`).length, 32)
})

test("umschlüsseln: neuer Schlüssel liest, alter nicht mehr", () => {
  const oldKey = parseKey(KEY_HEX)
  const next = newKey()
  const moved = reencrypt(VECTOR, oldKey, next)
  assert.equal(decrypt(moved, next), "geheim-123")
  assert.equal(decrypt(moved, oldKey), null)
})

test("umschlüsseln lässt leere Werte leer", () => {
  assert.equal(reencrypt(null, newKey(), newKey()), null)
  assert.equal(reencrypt(undefined, newKey(), newKey()), null)
})

test("umschlüsseln bricht ab, statt ein Secret zu verlieren", () => {
  assert.throws(() => reencrypt(VECTOR, newKey(), newKey(), "Client Secret"), /Client Secret/)
})
