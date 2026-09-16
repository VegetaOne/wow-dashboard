/**
 * Zwischenspeicher der Konfiguration – bewusst ohne Datenbankzugriff.
 *
 * Warum eine eigene Datei: `battlenet.ts` braucht Region und Sprache, und
 * `battlenet.ts` wird auch von Client-Komponenten angefasst. Läge der
 * Zwischenspeicher in `config.ts`, zöge jeder solche Import Prisma mit in
 * das Bündel des Browsers – und der Build bräche. Hier steht deshalb nur
 * Zustand und reine Daten; gefüllt wird er von `config.ts` auf dem Server.
 */

import type { GameMode } from "./battlenet"

export type Language = "en" | "de"

export const LANGUAGES: { id: Language; label: string; locale: string }[] = [
  { id: "en", label: "English", locale: "en_GB" },
  { id: "de", label: "Deutsch", locale: "de_DE" },
]

export const REGIONS = ["eu", "us", "kr", "tw"] as const

export const ALL_GAME_MODES: GameMode[] = ["retail", "classic", "classic-era"]

/** Was die Oberfläche sehen darf – ohne die Geheimnisse selbst. */
export interface AppConfigView {
  language: Language
  region: string
  bnetClientId: string | null
  hasClientSecret: boolean
  gameModes: GameMode[]
  defaultMode: GameMode
  pollSeconds: number
  warcraftLogsClientId: string | null
  hasWarcraftLogsSecret: boolean
  ownerBattleTag: string | null
  /** Stufe 1 ist durch: Zugangsdaten liegen vor, ein Login ist möglich */
  hasCredentials: boolean
  /** Stufe 2 ist durch: der Setup gilt als abgeschlossen */
  setupComplete: boolean
}

export interface LoadedConfig extends AppConfigView {
  clientSecret: string | null
  warcraftLogsSecret: string | null
  authSecret: string | null
}

export const CONFIG_DEFAULTS: LoadedConfig = {
  language: "en",
  region: "eu",
  bnetClientId: null,
  hasClientSecret: false,
  gameModes: ALL_GAME_MODES,
  defaultMode: "retail",
  pollSeconds: 60,
  warcraftLogsClientId: null,
  hasWarcraftLogsSecret: false,
  ownerBattleTag: null,
  hasCredentials: false,
  setupComplete: false,
  clientSecret: null,
  warcraftLogsSecret: null,
  authSecret: null,
}

let cache: LoadedConfig | null = null

/**
 * Zuletzt gelesener Stand, ohne zu warten.
 *
 * `null`, solange nie geladen wurde. Aufrufer, die damit nichts anfangen
 * können, müssen vorher `loadConfig()` aus `config.ts` abwarten – die
 * Einstiegspunkte tun das.
 */
export function configSnapshot(): LoadedConfig | null {
  return cache
}

export function setConfigCache(next: LoadedConfig): LoadedConfig {
  cache = next
  return next
}
