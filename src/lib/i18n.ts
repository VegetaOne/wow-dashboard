/**
 * Übersetzung der Oberfläche.
 *
 * Die Texte selbst liegen in `dict/`, nach Bereichen getrennt; hier steht
 * nur die Mechanik. Englisch ist die Leitsprache: `en` definiert die
 * Schlüssel, `de` muss sie vollständig bedienen – ein vergessener Eintrag
 * ist ein Übersetzungsfehler beim Bauen und kein leerer Text zur Laufzeit.
 *
 * Die Sprache gilt für die ganze Instanz und steht in der Konfiguration.
 * Sie steuert zweierlei: diese Texte, und den `locale`-Parameter der
 * Blizzard-Abfragen (siehe `runtime.ts`) – Gegenstands-, Boss- und
 * Fraktionsnamen kommen also ebenfalls in der eingestellten Sprache.
 *
 * Diese Datei darf nichts serverseitiges importieren: sie landet über die
 * Client-Komponenten auch im Bündel des Browsers.
 */

import type { Language } from "./config-cache"
import { DE, EN, type TranslationKey } from "./dict"

export type { TranslationKey }

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = {
  en: EN,
  de: DE,
}

export type TranslateVars = Record<string, string | number>

/** Die Übersetzungsfunktion, wie sie Komponenten benutzen. */
export type Translate = (key: TranslationKey, vars?: TranslateVars) => string

/**
 * Einen Schlüssel auflösen.
 *
 * Fehlt der Eintrag – etwa weil ein Schlüssel zur Laufzeit hereingereicht
 * wurde und nicht vom Typ geprüft werden konnte –, wird der Schlüssel selbst
 * zurückgegeben. Sichtbar, aber nicht kaputt.
 */
export function translate(
  language: Language,
  key: TranslationKey,
  vars?: TranslateVars
): string {
  const template = DICTIONARIES[language]?.[key] ?? EN[key] ?? key
  if (!vars) return template

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  )
}

/** Gebundene Übersetzungsfunktion für eine Sprache. */
export function translator(language: Language): Translate {
  return (key, vars) => translate(language, key, vars)
}

/** HTML-`lang`-Attribut zur eingestellten Sprache. */
export function htmlLang(language: Language): string {
  return language === "de" ? "de" : "en"
}

/**
 * Datums-Locale zur eingestellten Sprache – für `toLocaleDateString`.
 *
 * Deutsch heisst hier Schweizer Schreibweise (TT.MM.JJJJ), weil die App
 * für den Heimgebrauch gebaut ist und vorher überall `de-CH` stand.
 */
export function dateLocale(language: Language): string {
  return language === "de" ? "de-CH" : "en-GB"
}

/**
 * Klassenkürzel für das Kästchen in der Charakterzeile.
 *
 * Keine Wörterbucheinträge, sondern eine eigene Tabelle: die Schlüssel sind
 * die Klassen-IDs der API, und als dreizehn Einzelschlüssel je Sprache wäre
 * das Wörterbuch nur unübersichtlicher.
 */
const CLASS_CODES: Record<Language, Record<number, string>> = {
  en: {
    1: "WAR", 2: "PAL", 3: "HUN", 4: "ROG", 5: "PRI", 6: "DK", 7: "SHA",
    8: "MAG", 9: "WLK", 10: "MNK", 11: "DRU", 12: "DH", 13: "EVO",
  },
  de: {
    1: "KRI", 2: "PAL", 3: "JÄG", 4: "SRK", 5: "PRI", 6: "TOD", 7: "SCH",
    8: "MAG", 9: "HEX", 10: "MÖN", 11: "DRU", 12: "DÄJ", 13: "RUF",
  },
}

export function classCode(language: Language, classId: number): string {
  return CLASS_CODES[language]?.[classId] ?? CLASS_CODES.en[classId] ?? "—"
}

/**
 * Verbleibende Zeit als Text.
 *
 * Steht hier und nicht in `reset.ts`, weil dort die Reset-Arithmetik liegt
 * und diese Funktion nur formatiert – und weil sie damit ohne Umweg an das
 * Wörterbuch kommt.
 */
export function formatRemaining(language: Language, ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return translate(language, "time.now")

  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return translate(language, "time.daysHours", { days, hours })
  if (hours > 0) return translate(language, "time.hoursMinutes", { hours, minutes })
  return translate(language, "time.minutes", { minutes })
}
