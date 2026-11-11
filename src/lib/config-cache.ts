/**
 * Zwischenspeicher der Konfiguration – bewusst ohne Datenbankzugriff.
 *
 * Warum eine eigene Datei: `battlenet.ts` braucht Region und Sprache, und
 * `battlenet.ts` wird auch von Client-Komponenten angefasst. Läge der
 * Zwischenspeicher in `config.ts`, zöge jeder solche Import Prisma mit in
 * das Bündel des Browsers – und der Build bräche. Hier steht deshalb nur
 * Zustand und reine Daten; gefüllt wird er von `config.ts` auf dem Server.
 */

export type Language = "en" | "de"

export const LANGUAGES: { id: Language; label: string; locale: string }[] = [
  { id: "en", label: "English", locale: "en_GB" },
  { id: "de", label: "Deutsch", locale: "de_DE" },
]

export const REGIONS = ["eu", "us", "kr", "tw"] as const

/** Was die Oberfläche sehen darf – ohne die Geheimnisse selbst. */
export interface AppConfigView {
  language: Language
  region: string
  bnetClientId: string | null
  hasClientSecret: boolean
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

/**
 * Der Speicher hängt an `globalThis`, nicht an einer Modulvariablen.
 *
 * Grund (gefunden 2026-11-11): Next.js bündelt dieses Modul in **jede** Seite
 * und **jede** API-Route einzeln – im Build steht es in `setup/page.js`,
 * `setup/schritt-2/page.js`, `api/setup/route.js`, `api/auth/…/route.js`
 * usw. je für sich. Eine Modulvariable gab es damit einmal pro Bündel. Der
 * Setup speicherte über `/api/setup` und aktualisierte nur dessen Kopie;
 * `/setup/schritt-2` las danach weiter seine alte („keine Zugangsdaten") und
 * schickte zurück zum Setup – eine Endlosschleife. `globalThis` gibt es
 * dagegen einmal pro Prozess.
 */
const STORE_KEY = Symbol.for("wow-dashboard.config-cache")

function store(): { cache: LoadedConfig | null } {
  const g = globalThis as unknown as Record<symbol, { cache: LoadedConfig | null } | undefined>
  return (g[STORE_KEY] ??= { cache: null })
}

/**
 * Zuletzt gelesener Stand, ohne zu warten.
 *
 * `null`, solange nie geladen wurde. Aufrufer, die damit nichts anfangen
 * können, müssen vorher `loadConfig()` aus `config.ts` abwarten – die
 * Einstiegspunkte tun das.
 */
export function configSnapshot(): LoadedConfig | null {
  return store().cache
}

export function setConfigCache(next: LoadedConfig): LoadedConfig {
  store().cache = next
  return next
}
