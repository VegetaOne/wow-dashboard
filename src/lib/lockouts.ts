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
 */

import type { GameMode } from "./battlenet"

export interface LockoutRule {
  /** Nennlänge in Tagen */
  days: number
  /** Namen, unter denen die Instanz auftauchen kann (DE und EN) */
  names: string[]
  /** Kurzer Hinweis, wenn an der Zahl etwas erklärungsbedürftig ist */
  note?: string
}

/**
 * Standard je Spielmodus, wenn die Instanz unten nicht steht.
 *
 * Retail und das laufende Classic (derzeit Mists of Pandaria) binden
 * Schlachtzüge wöchentlich – dort ist sieben Tage die Regel und kein
 * geratener Wert. Nur das alte Vanilla-System kennt kürzere Lockouts.
 */
const MODE_DEFAULT_DAYS: Record<GameMode, number> = {
  retail: 7,
  classic: 7,
  "classic-era": 7,
}

/**
 * Vanilla-Schlachtzüge mit abweichender Bindung.
 *
 * Quelle: Wowhead „Classic WoW Raid Reset Days and Schedule". Die
 * 7-Tage-Instanzen stehen der Vollständigkeit halber mit dabei, damit die
 * Wochenübersicht weiss, welche Instanzen in Classic Era überhaupt
 * Schlachtzüge sind, und sie auch dann zeigt, wenn diese Woche noch kein
 * Boss gefallen ist.
 */
const CLASSIC_ERA_RULES: LockoutRule[] = [
  { days: 7, names: ["Geschmolzener Kern", "Molten Core"] },
  { days: 7, names: ["Pechschwingenhort", "Blackwing Lair"] },
  { days: 7, names: ["Tempel von Ahn'Qiraj", "Temple of Ahn'Qiraj", "Ahn'Qiraj"] },
  { days: 7, names: ["Naxxramas"] },
  {
    days: 5,
    names: ["Onyxias Hort", "Onyxia's Lair", "Onyxia"],
    note: "Fünf Tage wie im Original. In späteren Erweiterungen wurde daraus eine Woche – sollte deine Version das schon so handhaben, gehört hier eine 7 hin.",
  },
  { days: 3, names: ["Zul'Gurub"] },
  {
    days: 3,
    names: ["Ruinen von Ahn'Qiraj", "Ruins of Ahn'Qiraj"],
    note: "Drei Tage, verankert am Wochenreset – der letzte Abschnitt der Woche ist darum kürzer.",
  },
]

const RULES: Partial<Record<GameMode, LockoutRule[]>> = {
  "classic-era": CLASSIC_ERA_RULES,
}

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
  note?: string
  /**
   * false = die Länge steht nicht in der Tabelle, es gilt der Standard des
   * Spielmodus. Für Retail und Classic ist das richtig; für Classic Era
   * heisst es, dass die Instanz unbekannt ist und sieben Tage nur die
   * wahrscheinlichste Annahme sind.
   */
  known: boolean
}

export function lockoutFor(mode: GameMode, instanceName: string): Lockout {
  const rules = RULES[mode]
  if (rules) {
    const needle = normalize(instanceName)
    for (const rule of rules) {
      if (rule.names.some((n) => normalize(n) === needle)) {
        return { days: rule.days, note: rule.note, known: true }
      }
    }
  }

  return { days: MODE_DEFAULT_DAYS[mode] ?? 7, known: mode !== "classic-era" }
}
