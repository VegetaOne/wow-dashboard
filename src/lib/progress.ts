/**
 * Fortschritt: Raids, Dungeons und Mythisch+.
 *
 * Alle drei Endpunkte sind tief geschachtelt (Erweiterung → Instanz →
 * Schwierigkeit → Boss) und liefern je nach Modus unterschiedlich viel.
 * Mythisch+ gibt es nur in Retail; in den Classic-Namespaces antwortet
 * der Endpunkt mit 404, was hier kein Fehler ist.
 *
 * Zeitstempel bleiben Zahlen, keine Date-Objekte: die Rohantwort wandert
 * durch die Snapshot-Schicht als JSON, und daraus käme ein String zurück.
 */

// ─── Gemeinsame Form ──────────────────────────────────────────────────────────

export interface EncounterKill {
  encounterId: number
  name: string
  completedCount: number
  /** Millisekunden seit Epoch, wie die API sie liefert */
  lastKillAt: number | null
}

export interface DifficultyProgress {
  difficulty: string
  difficultyName: string
  completed: number
  total: number
  encounters: EncounterKill[]
}

export interface InstanceProgress {
  instanceId: number
  name: string
  modes: DifficultyProgress[]
  /** Bester Fortschritt über alle Schwierigkeiten – für die Sortierung */
  bestCompleted: number
}

export interface ExpansionProgress {
  expansionId: number
  name: string
  instances: InstanceProgress[]
}

/** Absteigende Anzeigereihenfolge der Schwierigkeiten. */
const DIFFICULTY_ORDER = [
  "MYTHIC",
  "HEROIC",
  "NORMAL",
  "LFR",
  "LEGACY_MYTHIC",
  "LEGACY_HEROIC",
  "LEGACY_NORMAL",
  "LEGACY_LFR",
]

export function difficultyRank(type: string): number {
  const index = DIFFICULTY_ORDER.indexOf(type)
  return index === -1 ? DIFFICULTY_ORDER.length : index
}

// ─── Rohform, durchgehend optional ───────────────────────────────────────────

interface RawEncounter {
  encounter?: { id?: number; name?: string }
  completed_count?: number
  last_kill_timestamp?: number
}

interface RawMode {
  difficulty?: { type?: string; name?: string }
  status?: { type?: string; name?: string }
  progress?: {
    completed_count?: number
    total_count?: number
    encounters?: RawEncounter[]
  }
}

interface RawInstance {
  instance?: { id?: number; name?: string }
  modes?: RawMode[]
}

interface RawExpansion {
  expansion?: { id?: number; name?: string }
  instances?: RawInstance[]
}

export interface RawEncounters {
  expansions?: RawExpansion[]
}

// ─── Auswertung ───────────────────────────────────────────────────────────────

function parseEncounters(raw: RawEncounter[] | undefined): EncounterKill[] {
  return (raw ?? [])
    .map((e): EncounterKill | null => {
      const id = e.encounter?.id
      if (typeof id !== "number") return null
      return {
        encounterId: id,
        name: e.encounter?.name ?? `Boss ${id}`,
        completedCount:
          typeof e.completed_count === "number" ? e.completed_count : 0,
        lastKillAt:
          typeof e.last_kill_timestamp === "number"
            ? e.last_kill_timestamp
            : null,
      }
    })
    .filter((e): e is EncounterKill => e !== null)
}

function parseMode(raw: RawMode): DifficultyProgress | null {
  const type = raw.difficulty?.type
  if (!type) return null

  const encounters = parseEncounters(raw.progress?.encounters)
  const completed =
    typeof raw.progress?.completed_count === "number"
      ? raw.progress.completed_count
      : encounters.filter((e) => e.completedCount > 0).length
  const total =
    typeof raw.progress?.total_count === "number"
      ? raw.progress.total_count
      : encounters.length

  return {
    difficulty: type,
    difficultyName: raw.difficulty?.name ?? type,
    completed,
    total,
    encounters,
  }
}

function parseInstance(raw: RawInstance): InstanceProgress | null {
  const id = raw.instance?.id
  if (typeof id !== "number") return null

  const modes = (raw.modes ?? [])
    .map(parseMode)
    .filter((m): m is DifficultyProgress => m !== null)
    .sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty))

  return {
    instanceId: id,
    name: raw.instance?.name ?? `Instanz ${id}`,
    modes,
    bestCompleted: modes.reduce((max, m) => Math.max(max, m.completed), 0),
  }
}

/**
 * Rohantwort von `encounters/raids` oder `encounters/dungeons`
 * auf die gemeinsame Form bringen. Neueste Erweiterung zuerst.
 */
export function parseProgress(raw: RawEncounters | null): ExpansionProgress[] {
  if (!raw?.expansions) return []

  return raw.expansions
    .map((exp): ExpansionProgress | null => {
      const id = exp.expansion?.id
      if (typeof id !== "number") return null

      const instances = (exp.instances ?? [])
        .map(parseInstance)
        .filter((i): i is InstanceProgress => i !== null)
        .sort((a, b) => a.name.localeCompare(b.name))

      if (instances.length === 0) return null

      return {
        expansionId: id,
        name: exp.expansion?.name ?? `Erweiterung ${id}`,
        instances,
      }
    })
    .filter((e): e is ExpansionProgress => e !== null)
    .sort((a, b) => b.expansionId - a.expansionId)
}

// ─── Mythisch+ ────────────────────────────────────────────────────────────────

export interface MythicRun {
  dungeonId: number
  dungeonName: string
  keystoneLevel: number
  inTime: boolean
  durationMs: number | null
  completedAt: number | null
  rating: number | null
  affixes: string[]
}

export interface MythicProfileView {
  currentRating: number | null
  /** Läufe der laufenden Woche */
  currentWeek: MythicRun[]
  /** Beste Läufe der Saison */
  bestRuns: MythicRun[]
}

interface RawRun {
  dungeon?: { id?: number; name?: string }
  keystone_level?: number
  is_completed_within_time?: boolean
  duration?: number
  completed_timestamp?: number
  mythic_rating?: { rating?: number }
  keystone_affixes?: { name?: string }[]
}

export interface RawMythicProfile {
  current_mythic_rating?: { rating?: number }
  current_period?: { best_runs?: RawRun[] }
  seasons?: unknown[]
  best_runs?: RawRun[]
}

function parseRun(raw: RawRun): MythicRun | null {
  const id = raw.dungeon?.id
  const level = raw.keystone_level
  if (typeof id !== "number" || typeof level !== "number") return null

  return {
    dungeonId: id,
    dungeonName: raw.dungeon?.name ?? `Dungeon ${id}`,
    keystoneLevel: level,
    inTime: raw.is_completed_within_time === true,
    durationMs: typeof raw.duration === "number" ? raw.duration : null,
    completedAt:
      typeof raw.completed_timestamp === "number"
        ? raw.completed_timestamp
        : null,
    rating:
      typeof raw.mythic_rating?.rating === "number"
        ? raw.mythic_rating.rating
        : null,
    affixes: (raw.keystone_affixes ?? [])
      .map((a) => a.name)
      .filter((n): n is string => !!n),
  }
}

export function parseMythicProfile(
  raw: RawMythicProfile | null
): MythicProfileView | null {
  if (!raw) return null

  const currentWeek = (raw.current_period?.best_runs ?? [])
    .map(parseRun)
    .filter((r): r is MythicRun => r !== null)
    .sort((a, b) => b.keystoneLevel - a.keystoneLevel)

  const bestRuns = (raw.best_runs ?? [])
    .map(parseRun)
    .filter((r): r is MythicRun => r !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))

  const currentRating =
    typeof raw.current_mythic_rating?.rating === "number"
      ? raw.current_mythic_rating.rating
      : null

  // Nichts Verwertbares: null statt eines leeren Kastens
  if (currentRating === null && currentWeek.length === 0 && bestRuns.length === 0) {
    return null
  }

  return { currentRating, currentWeek, bestRuns }
}

// ─── Darstellungs-Helfer ──────────────────────────────────────────────────────

// formatDuration ist sprachunabhängig und bleibt frei exportiert; ein Datum
// braucht dagegen die Sprache – das holen sich die Komponenten jetzt selbst
// über useFormat()/getFormat() statt über einen Re-Export von hier.
export { formatDuration } from "./format"

/** Summe über alle Instanzen einer Erweiterung, je Schwierigkeit. */
export function expansionTotals(
  expansion: ExpansionProgress
): { difficulty: string; difficultyName: string; completed: number; total: number }[] {
  const byDifficulty = new Map<
    string,
    { difficultyName: string; completed: number; total: number }
  >()

  for (const instance of expansion.instances) {
    for (const mode of instance.modes) {
      const existing = byDifficulty.get(mode.difficulty)
      if (existing) {
        existing.completed += mode.completed
        existing.total += mode.total
      } else {
        byDifficulty.set(mode.difficulty, {
          difficultyName: mode.difficultyName,
          completed: mode.completed,
          total: mode.total,
        })
      }
    }
  }

  return Array.from(byDifficulty.entries())
    .map(([difficulty, v]) => ({ difficulty, ...v }))
    .sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty))
}
