// TypeScript-Module ohne Importe für node:test laden.
//
// Node 20 (das Image) kann TS nicht direkt; der Compiler aus den
// devDependencies übersetzt die Datei, das Ergebnis wird als Modul geladen.
// Funktioniert nur für Dateien ohne Laufzeit-Importe (`import type` ist ok).

import { readFileSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

export async function loadTs(relativeToRepo) {
  const source = readFileSync(new URL(`../${relativeToRepo}`, import.meta.url), "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  })
  const dir = mkdtempSync(join(tmpdir(), "ts-test-"))
  const file = join(dir, "module.mjs")
  writeFileSync(file, outputText)
  return import(pathToFileURL(file).href)
}
