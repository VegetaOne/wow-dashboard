/**
 * Lockout-Längen je Instanz.
 *
 * Die API kennt sie nicht. Sie liefert Bosskills mit Zeitstempel, aber
 * nirgends, wie lange eine Instanz gebunden ist. Diese Tabelle ist deshalb
 * Handarbeit und muss gepflegt werden, wenn Blizzard etwas ändert.
 *
 * Erkannt wird über den **Namen**, nicht über die Instanz-ID: die IDs der
 * Journal-Einträge unterscheiden sich zwischen den Namespaces, die Namen
 * liegen in der Antwort ohnehin bei. Weil die App mit `de_DE` abfragt,
 * stehen deutsche und englische Schreibweisen nebeneinander – der spätere
 * Sprachumschalter kostet hier dann nichts mehr.
 *
 * **WoW Forever (seit 2026-11-11 der einzige Modus):** Forever baut auf dem
 * ersten Jahr des Originals auf, mit neuen 10er- und 20er-Schlachtzügen.
 * Welche Bindungsdauern dort gelten, ist **nicht belegt**. Die Tabelle unten
 * ist darum die Vanilla-Tabelle als beste Annahme, und jede Länge gilt als
 * angenommen (`known: false`) – die Wochenübersicht schreibt das dazu.
 * Bestätigte Längen hier eintragen und `known` für sie freigeben.
 */

import type { TranslationKey } from "./i18n"

export interface LockoutRule {
  /** Nennlänge in Tagen */
  days: number
  /** Namen, unter denen die Instanz auftauchen kann (DE und EN) */
  names: string[]
  /** Kurzer Hinweis, wenn an der Zahl etwas erklärungsbedürftig ist (Wörterbuchschlüssel) */
  noteKey?: TranslationKey
}

/** Standard, wenn die Instanz unten nicht steht: eine Woche, angenommen. */
const DEFAULT_DAYS = 7

/**
 * Vanilla-Schlachtzüge mit abweichender Bindung.
 *
 * Quelle: Wowhead „Classic WoW Raid Reset Days and Schedule". Die
 * 7-Tage-Instanzen stehen der Vollständigkeit halber mit dabei, damit die
 * Wochenübersicht weiss, welche Instanzen überhaupt Schlachtzüge sind, und
 * sie auch dann zeigt, wenn diese Woche noch kein Boss gefallen ist.
 *
 * Für Forever übernommen, aber ungeprüft – siehe oben.
 */
const RULES: LockoutRule[] = [
  { days: 7, names: ["Geschmolzener Kern", "Molten Core"] },
  { days: 7, names: ["Pechschwingenhort", "Blackwing Lair"] },
  { days: 7, names: ["Tempel von Ahn'Qiraj", "Temple of Ahn'Qiraj", "Ahn'Qiraj"] },
  { days: 7, names: ["Naxxramas"] },
  {
    days: 5,
    names: ["Onyxias Hort", "Onyxia's Lair", "Onyxia"],
    noteKey: "weekly.lockoutNote.onyxia",
  },
  { days: 3, names: ["Zul'Gurub"] },
  {
    days: 3,
    names: ["Ruinen von Ahn'Qiraj", "Ruins of Ahn'Qiraj"],
    noteKey: "weekly.lockoutNote.aq20",
  },
]

/**
 * Bestätigte Bindungsdauern für Forever. Leer, solange keine geprüft ist:
 * dann gilt jede Länge als angenommen.
 */
const CONFIRMED: string[] = []

/** Vergleich ohne Gross-/Kleinschreibung, Akzente und Sonderzeichen. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

export interface Lockout {
  days: number
  noteKey?: TranslationKey
  /**
   * false = die Länge ist eine Annahme. Für Forever derzeit immer: die
   * Bindungsdauern sind nicht belegt (siehe Dateikopf).
   */
  known: boolean
}

export function lockoutFor(instanceName: string): Lockout {
  const needle = normalize(instanceName)
  for (const rule of RULES) {
    if (rule.names.some((n) => normalize(n) === needle)) {
      const known = rule.names.some((n) => CONFIRMED.includes(normalize(n)))
      return { days: rule.days, noteKey: rule.noteKey, known }
    }
  }

  return { days: DEFAULT_DAYS, known: false }
}
