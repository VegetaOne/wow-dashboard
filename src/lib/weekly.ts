/**
 * Wochenübersicht: was ist im laufenden Lockout-Zeitraum erledigt.
 *
 * Woher der Status kommt: **nicht** aus einem Vergleich zweier Snapshots,
 * sondern aus `last_kill_timestamp`. Der Schlachtzug-Endpunkt liefert je
 * Boss den Zeitpunkt des letzten Kills; liegt er im laufenden Zeitraum, war
 * es dieser Lockout. Das ist genauer als ein Tagesvergleich, der mehrere
 * Kills am selben Tag nicht auseinanderhalten könnte.
 *
 * Eine Einschränkung bleibt und wird in der Oberfläche auch gesagt: die
 * Profil-API aktualisiert erst, wenn der Charakter ausloggt. Wer noch in der
 * Instanz steht, taucht hier noch nicht auf.
 */

import type { GameMode, WoWCharacter } from "./battlenet"
import { attempt, raids, type CharacterRef } from "./character"
import { parseProgress, type ExpansionProgress } from "./progress"
import { lockoutFor } from "./lockouts"
import {
  lockoutWindow,
  nextDailyReset,
  resetConfig,
  type LockoutWindow,
  type ResetConfig,
} from "./reset"

export interface DifficultyStatus {
  difficulty: string
  difficultyName: string
  /** Bosse mit Kill im laufenden Zeitraum */
  killed: number
  /** Bosse dieser Schwierigkeit insgesamt */
  total: number
  complete: boolean
}

export interface InstanceStatus {
  instanceId: number
  name: string
  expansionName: string
  lockoutDays: number
  /** false = Länge nicht belegt, sieben Tage sind nur die Annahme */
  lockoutKnown: boolean
  lockoutNote?: string
  window: LockoutWindow
  /** Nur Schwierigkeiten mit mindestens einem Kill im Zeitraum */
  cleared: DifficultyStatus[]
  /** true = in diesem Zeitraum ist hier noch nichts gefallen */
  open: boolean
}

export interface CharacterWeek {
  name: string
  realmSlug: string
  realmName: string
  level: number
  className: string
  faction: "ALLIANCE" | "HORDE"
  instances: InstanceStatus[]
  /** true = der Endpunkt hat nicht geantwortet und es lag nichts vor */
  failed: boolean
  /** true = letzter bekannter Stand, die API war nicht erreichbar */
  stale: boolean
  fetchedAt: Date | null
}

export interface WeeklyOverviewData {
  config: ResetConfig
  generatedAt: Date
  weekStart: Date
  weekEnd: Date
  dailyEnd: Date
  characters: CharacterWeek[]
}

/** Wie viele Charakterabrufe gleichzeitig laufen – wie in `battlenet.ts`. */
const CONCURRENCY = 6

async function pooled<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  limit = CONCURRENCY
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function run(): Promise<void> {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await worker(items[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  )
  return results
}

/**
 * Welche Instanzen gehören in die Übersicht?
 *
 * Alles zu zeigen wäre unlesbar – ein Charakter schleppt den Fortschritt
 * aller Erweiterungen mit sich. Aufgenommen wird darum, was dieser Woche
 * plausibel ansteht: die neueste Erweiterung, alles aus der gepflegten
 * Lockout-Tabelle, und jede Instanz, in der im laufenden Zeitraum etwas
 * gefallen ist – Letzteres fängt den Fall ab, dass jemand doch einen alten
 * Raid läuft.
 */
function relevantInstances(
  expansions: ExpansionProgress[],
  mode: GameMode,
  now: Date,
  cfg: ResetConfig
): InstanceStatus[] {
  if (expansions.length === 0) return []

  const newestExpansionId = expansions[0].expansionId
  const out: InstanceStatus[] = []

  for (const expansion of expansions) {
    for (const instance of expansion.instances) {
      const lockout = lockoutFor(mode, instance.name)
      const window = lockoutWindow(now, cfg, lockout.days)

      const cleared: DifficultyStatus[] = []
      for (const modeProgress of instance.modes) {
        const killed = modeProgress.encounters.filter(
          (e) =>
            typeof e.lastKillAt === "number" &&
            e.lastKillAt >= window.start.getTime()
        ).length

        if (killed === 0) continue

        const total = modeProgress.total || modeProgress.encounters.length
        cleared.push({
          difficulty: modeProgress.difficulty,
          difficultyName: modeProgress.difficultyName,
          killed,
          total,
          complete: total > 0 && killed >= total,
        })
      }

      const isNewest = expansion.expansionId === newestExpansionId
      const keep = cleared.length > 0 || lockout.known || isNewest
      if (!keep) continue

      out.push({
        instanceId: instance.instanceId,
        name: instance.name,
        expansionName: expansion.name,
        lockoutDays: lockout.days,
        lockoutKnown: lockout.known,
        lockoutNote: lockout.note,
        window,
        cleared,
        open: cleared.length === 0,
      })
    }
  }

  // Angefangenes zuerst, darin nach Name
  out.sort((a, b) => {
    if (a.open !== b.open) return a.open ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  return out
}

/**
 * Übersicht für alle übergebenen Charaktere.
 *
 * Jeder Abruf läuft durch die Snapshot-Schicht: der erste Aufruf kostet je
 * Charakter eine Anfrage, danach bedient sich die Seite eine Viertelstunde
 * lang aus dem Zwischenspeicher.
 */
export async function buildWeeklyOverview(
  characters: WoWCharacter[],
  token: string,
  mode: GameMode,
  now: Date = new Date()
): Promise<WeeklyOverviewData> {
  const cfg = resetConfig()
  const week = lockoutWindow(now, cfg, 7)

  const rows = await pooled(characters, async (character): Promise<CharacterWeek> => {
    const ref: CharacterRef = {
      realm: character.realm.slug,
      name: character.name,
      mode,
    }

    const result = await attempt(() => raids(ref, token))
    const expansions = parseProgress(result.value)

    return {
      name: character.name,
      realmSlug: character.realm.slug,
      realmName: character.realm.name,
      level: character.level,
      className: character.playable_class?.name ?? "—",
      faction: character.faction?.type ?? "ALLIANCE",
      instances: relevantInstances(expansions, mode, now, cfg),
      failed: result.failed,
      stale: result.stale,
      fetchedAt: result.fetchedAt,
    }
  })

  // Charaktere mit offener Arbeit nach oben, dann nach Stufe
  rows.sort((a, b) => {
    const aOpen = a.instances.some((i) => i.open)
    const bOpen = b.instances.some((i) => i.open)
    if (aOpen !== bOpen) return aOpen ? -1 : 1
    return b.level - a.level || a.name.localeCompare(b.name)
  })

  return {
    config: cfg,
    generatedAt: now,
    weekStart: week.start,
    weekEnd: week.end,
    dailyEnd: nextDailyReset(now, cfg),
    characters: rows,
  }
}
