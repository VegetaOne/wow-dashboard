/**
 * Unterseiten eines Charakters.
 *
 * `enabled` steuert, ob der Tab erscheint. Ein neues Feature schaltet hier
 * sein Flag um – so gibt es nie einen Tab, der auf eine leere Seite führt.
 *
 * Beschriftung und Hinweis stehen als Wörterbuchschlüssel, nicht als Text:
 * die Leiste wird in der eingestellten Sprache gerendert, und ein fester
 * String hier wäre der eine Ort, an dem Deutsch überlebt.
 */

import type { TranslationKey } from "./i18n"

export interface CharacterTab {
  /** Pfadsegment; leer = Übersichtsseite */
  slug: string
  labelKey: TranslationKey
  enabled: boolean
  /** Kurzer Hinweis, was der Tab zeigt – für die Titelzeile */
  noteKey?: TranslationKey
}

export const CHARACTER_TABS: CharacterTab[] = [
  { slug: "", labelKey: "tab.equipment", enabled: true, noteKey: "tab.equipment.note" },
  { slug: "berufe", labelKey: "tab.professions", enabled: true, noteKey: "tab.professions.note" },
  { slug: "fortschritt", labelKey: "tab.progress", enabled: true, noteKey: "tab.progress.note" },
  { slug: "sammlungen", labelKey: "tab.collections", enabled: true, noteKey: "tab.collections.note" },
  { slug: "erfolge", labelKey: "tab.achievements", enabled: true, noteKey: "tab.achievements.note" },
  { slug: "ansehen", labelKey: "tab.reputation", enabled: true, noteKey: "tab.reputation.note" },
  { slug: "talente", labelKey: "tab.talents", enabled: true, noteKey: "tab.talents.note" },
  { slug: "pvp", labelKey: "tab.pvp", enabled: true, noteKey: "tab.pvp.note" },
  { slug: "gilde", labelKey: "tab.guild", enabled: true, noteKey: "tab.guild.note" },
  { slug: "wirtschaft", labelKey: "tab.economy", enabled: true, noteKey: "tab.economy.note" },
  { slug: "logs", labelKey: "tab.logs", enabled: false, noteKey: "tab.logs.note" },
  { slug: "verlauf", labelKey: "tab.history", enabled: true, noteKey: "tab.history.note" },
]

/** Römische Ziffer für die Reiter der Heldenakte (1–39 genügt). */
export function roman(n: number): string {
  const parts: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]
  let out = ""
  for (const [value, sign] of parts) {
    while (n >= value) {
      out += sign
      n -= value
    }
  }
  return out
}

export function visibleTabs(): CharacterTab[] {
  return CHARACTER_TABS.filter((t) => t.enabled)
}

/**
 * Basis-Pfad eines Charakters: `/dashboard/{name}-{surname}`.
 *
 * Seit WoW Forever gibt es weder Spielmodus noch Realm in der Adresse. Die
 * statischen Geschwister (`account`, `woche`, `einstellungen`) kollidieren
 * nicht: ein Charakter-Slug enthält immer einen Bindestrich.
 */
export function characterBase(characterSlug: string): string {
  return `/dashboard/${encodeURIComponent(characterSlug)}`
}

export function tabHref(characterSlug: string, tabSlug: string): string {
  const base = characterBase(characterSlug)
  return tabSlug ? `${base}/${tabSlug}` : base
}
