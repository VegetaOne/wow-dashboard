/**
 * Konfiguration der Instanz.
 *
 * Alles, was früher in der `.env` stand, liegt in der Datenbank – bis auf
 * `DATABASE_URL`, ohne die sie nicht zu finden wäre. Geändert wird über den
 * Setup und die Einstellungsseite, nicht mehr im Dateisystem.
 *
 * Zwei Zugänge, mit Absicht getrennt:
 *
 * - `loadConfig()` liest aus der Datenbank und ist asynchron.
 * - `configSnapshot()` gibt den zuletzt gelesenen Stand ohne Warten zurück.
 *   Nötig für Stellen, die synchron sein müssen – allen voran die
 *   NextAuth-Provider-Definition. Wer ihn nutzt, muss vorher einmal
 *   `loadConfig()` abgewartet haben; die Einstiegspunkte tun das.
 */

import { prisma } from "./db"
import { decryptSecret, encryptSecret, generateAuthSecret } from "./secrets"
import type { GameMode } from "./battlenet"
import {
  ALL_GAME_MODES,
  CONFIG_DEFAULTS,
  configSnapshot,
  setConfigCache,
  type AppConfigView,
  type Language,
  type LoadedConfig,
} from "./config-cache"

export {
  ALL_GAME_MODES,
  LANGUAGES,
  REGIONS,
  configSnapshot,
  type AppConfigView,
  type Language,
} from "./config-cache"

function parseModes(raw: string): GameMode[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return ALL_GAME_MODES
    const modes = parsed.filter((m): m is GameMode =>
      ALL_GAME_MODES.includes(m as GameMode)
    )
    return modes.length > 0 ? modes : ALL_GAME_MODES
  } catch {
    return ALL_GAME_MODES
  }
}

/**
 * Konfiguration aus der Datenbank lesen.
 *
 * Fehler werden hier bewusst geschluckt: vor der ersten Migration gibt es
 * die Tabelle noch nicht, und dann sollen die Vorgaben gelten, statt dass
 * die ganze App nicht startet. Der Setup übernimmt dann.
 */
export async function loadConfig(force = false): Promise<LoadedConfig> {
  const cached = configSnapshot()
  if (cached && !force) return cached

  try {
    const row = await prisma.appConfig.findUnique({ where: { id: "singleton" } })

    if (!row) {
      return setConfigCache({ ...CONFIG_DEFAULTS })
    }

    const clientSecret = decryptSecret(row.bnetClientSecret)

    return setConfigCache({
      language: row.language === "de" ? "de" : "en",
      region: row.region || "eu",
      bnetClientId: row.bnetClientId || null,
      hasClientSecret: !!row.bnetClientSecret,
      gameModes: parseModes(row.gameModes),
      defaultMode: (row.defaultMode as GameMode) || "retail",
      pollSeconds: row.pollSeconds || 60,
      warcraftLogsClientId: row.warcraftLogsClientId || null,
      hasWarcraftLogsSecret: !!row.warcraftLogsSecret,
      ownerBattleTag: row.ownerBattleTag || null,
      hasCredentials: !!row.bnetClientId && !!clientSecret,
      setupComplete: !!row.setupCompletedAt,
      clientSecret,
      warcraftLogsSecret: decryptSecret(row.warcraftLogsSecret),
      authSecret: row.authSecret || null,
    })
  } catch (error) {
    console.warn("[config] Konfiguration nicht lesbar:", error)
    return setConfigCache({ ...CONFIG_DEFAULTS })
  }
}

/** Nur die Sicht für die Oberfläche – ohne Geheimnisse. */
export function toView(config: LoadedConfig): AppConfigView {
  const { clientSecret, warcraftLogsSecret, authSecret, ...view } = config
  return view
}

export async function getConfigView(): Promise<AppConfigView> {
  return toView(await loadConfig())
}

// ─── Schreiben ────────────────────────────────────────────────────────────────

export interface ConfigUpdate {
  language?: Language
  region?: string
  bnetClientId?: string
  /** Klartext; wird verschlüsselt abgelegt. Leerer String = unverändert. */
  bnetClientSecret?: string
  gameModes?: GameMode[]
  defaultMode?: GameMode
  pollSeconds?: number
  warcraftLogsClientId?: string
  warcraftLogsSecret?: string
  ownerBattleTag?: string
  markComplete?: boolean
}

/**
 * Konfiguration schreiben und den Zwischenspeicher sofort auffrischen.
 *
 * Ein leeres Secret bedeutet „nicht angefasst", nicht „löschen" – sonst
 * würde die Einstellungsseite bei jedem Speichern das Secret verlieren,
 * weil sie es nie im Klartext anzeigt und damit auch nicht zurücksenden kann.
 */
export async function saveConfig(update: ConfigUpdate): Promise<LoadedConfig> {
  const data: Record<string, unknown> = {}

  if (update.language) data.language = update.language
  if (update.region) data.region = update.region
  if (update.bnetClientId !== undefined) data.bnetClientId = update.bnetClientId.trim()
  if (update.bnetClientSecret) {
    data.bnetClientSecret = encryptSecret(update.bnetClientSecret.trim())
  }
  if (update.gameModes) data.gameModes = JSON.stringify(update.gameModes)
  if (update.defaultMode) data.defaultMode = update.defaultMode
  if (typeof update.pollSeconds === "number") {
    // Unter 15 Sekunden bringt nichts: die Profil-API aktualisiert ohnehin
    // erst beim Ausloggen des Charakters.
    data.pollSeconds = Math.min(3600, Math.max(15, Math.round(update.pollSeconds)))
  }
  if (update.warcraftLogsClientId !== undefined) {
    data.warcraftLogsClientId = update.warcraftLogsClientId.trim() || null
  }
  if (update.warcraftLogsSecret) {
    data.warcraftLogsSecret = encryptSecret(update.warcraftLogsSecret.trim())
  }
  if (update.ownerBattleTag) data.ownerBattleTag = update.ownerBattleTag
  if (update.markComplete) data.setupCompletedAt = new Date()

  const existing = await prisma.appConfig.findUnique({ where: { id: "singleton" } })

  // Der Sitzungsschlüssel wird einmal erzeugt und danach nie ersetzt –
  // ein Wechsel würde alle bestehenden Anmeldungen ungültig machen.
  if (!existing?.authSecret && !data.authSecret) {
    data.authSecret = generateAuthSecret()
  }

  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  })

  return loadConfig(true)
}

/**
 * Darf dieser Account die Instanz konfigurieren?
 *
 * Die App läuft je Nutzer in einem eigenen Container, es gibt also genau
 * einen Besitzer: den Account, der den Setup abgeschlossen hat. Steht noch
 * keiner fest, wird der erste Angemeldete zum Besitzer.
 */
export function isOwner(config: AppConfigView, battleTag?: string | null): boolean {
  if (!battleTag) return false
  if (!config.ownerBattleTag) return true
  return config.ownerBattleTag === battleTag
}
