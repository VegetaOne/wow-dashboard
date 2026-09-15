/**
 * Adapter-Factory
 * Gibt den richtigen Adapter anhand des Game-Mode zurück.
 */

import { BlizzardAdapter } from "./blizzard"
import { WoWForeverAdapter } from "./wow-forever"
import type { WoWDataAdapter, GameMode } from "./interface"

const adapters: Record<GameMode, WoWDataAdapter> = {
  "retail":      new BlizzardAdapter(),
  "wow-forever": new WoWForeverAdapter(),
}

/**
 * Aktiven Adapter holen.
 * Game-Mode kommt aus der Env-Variable WOW_GAME_MODE (default: retail).
 */
export function getAdapter(mode?: GameMode): WoWDataAdapter {
  const activeMode = (mode ?? process.env.WOW_GAME_MODE ?? "retail") as GameMode
  const adapter = adapters[activeMode]
  if (!adapter) throw new Error(`Unbekannter Game-Mode: ${activeMode}`)
  return adapter
}

export type { WoWDataAdapter, GameMode } from "./interface"
export { BlizzardAdapter } from "./blizzard"
export { WoWForeverAdapter } from "./wow-forever"
