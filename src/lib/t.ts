/**
 * Übersetzungsfunktion für Server-Komponenten.
 *
 * Getrennt von `i18n.ts`, weil hier die Konfiguration gelesen wird und damit
 * Prisma im Spiel ist – das darf nicht ins Browser-Bündel geraten.
 */

import { loadConfig } from "./config"
import { translator, type Translate } from "./i18n"
import { createFormat, type Format } from "./format"

export async function getT(): Promise<Translate> {
  const config = await loadConfig()
  return translator(config.language)
}

export async function getFormat(): Promise<Format> {
  const config = await loadConfig()
  return createFormat(config.language)
}
