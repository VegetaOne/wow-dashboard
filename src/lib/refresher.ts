/**
 * Hintergrund-Auffrischung: einmal täglich, kurz nach dem Tagesreset,
 * frische Stände für die Charaktere des Besitzers holen.
 *
 * Wozu: Der Verlauf entsteht aus einem Schnappschuss je Tag – aber nur an
 * Tagen, an denen jemand die Seite öffnet. Ohne Auffrischung hat er Lücken.
 *
 * Wie, und warum so:
 *
 * - **Timer im Server-Prozess**, gestartet aus `src/instrumentation.ts`.
 *   Kein Cron auf dem Host, kein zweiter Container.
 * - **Nur der Besitzer.** Seine Charakterliste merkt sich die App, wenn er
 *   die Startseite öffnet (`owner-characters`). Andere Accounts an derselben
 *   Instanz frischt niemand auf.
 * - **App-Token statt Nutzertoken.** Battle.net stellt keine Refresh-Tokens
 *   aus; ein gespeichertes Nutzertoken wäre nach 24 Stunden tot. Siehe
 *   `client-token.ts` – und die offene Frage, ob Forever Charakterdaten mit
 *   einem App-Token herausgibt. Wenn nicht, hält der erste Abruf das fest
 *   (`unauthorized`) und der Lauf endet, statt jeden Charakter zu probieren.
 * - **Über die Snapshot-Schicht**, mit denselben Ladern wie die Seiten.
 *   Damit gilt „ein Stand je Tag" auch hier, und ein Seitenaufruf kurz danach
 *   bekommt den frischen Stand aus dem Zwischenspeicher.
 *
 * Abschalten: `WOW_REFRESH=off` in der Umgebung des Containers.
 */

import { prisma } from "./db"
import { loadConfig } from "./config"
import { BnetError, getCharacterProfile, isCharacterSlug, isNotFound } from "./battlenet"
import { clientCredentialsToken } from "./client-token"
import { accountKey, latestSnapshot, type SnapshotResult } from "./snapshot"
import { nextRefreshAt, resetConfig } from "./reset"
import {
  achievements,
  equipment,
  professions,
  profile,
  raids,
  type CharacterRef,
} from "./character"

const JOB = "characters"

/**
 * Was je Charakter aufgefrischt wird: genau die Datensätze, aus denen der
 * Verlauf seine Reihen baut (`history.ts`), plus die Ausrüstung.
 */
const LOADERS: ((ref: CharacterRef, token: string) => Promise<SnapshotResult<unknown>>)[] = [
  profile,
  equipment,
  professions,
  raids,
  achievements,
]

/** Pause zwischen Charakteren – die Ratenbegrenzung gilt je Client. */
const PAUSE_MS = 250

/**
 * Warum ein Lauf ausfiel oder abbrach. Als Schlüssel gespeichert, übersetzt
 * wird in der Anzeige (`settings.refresh.reason.*`).
 */
export type RefreshReason =
  | "setupIncomplete"
  | "noOwnerList"
  | "noToken"
  | "unauthorized"

export interface RefreshStatus {
  startedAt: Date
  finishedAt: Date | null
  total: number
  refreshed: number
  failed: number
  reason: RefreshReason | null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function record(status: RefreshStatus): Promise<void> {
  const data = { ...status }
  await prisma.refreshRun
    .upsert({ where: { job: JOB }, update: data, create: { job: JOB, ...data } })
    .catch((error) => console.warn("[auffrischer] Stand nicht gespeichert:", error))
}

export async function lastRefresh(): Promise<RefreshStatus | null> {
  try {
    const row = await prisma.refreshRun.findUnique({ where: { job: JOB } })
    if (!row) return null
    return { ...row, reason: (row.reason as RefreshReason | null) ?? null }
  } catch {
    return null
  }
}

/** Ein Charakter: alle Datensätze. true = nichts davon kam aus dem alten Stand. */
async function refreshCharacter(slug: string, token: string): Promise<boolean> {
  let ok = true
  for (const load of LOADERS) {
    try {
      const result = await load({ slug }, token)
      // stale = der Abruf schlug fehl und es kam der letzte bekannte Stand
      if (result.stale) ok = false
    } catch (error) {
      // 404 heisst „noch keine Daten" – kein Fehler des Laufs
      if (!isNotFound(error)) ok = false
    }
  }
  return ok
}

/** Ein Lauf. Wirft nicht; das Ergebnis steht in `RefreshRun` und im Log. */
export async function runRefresh(): Promise<RefreshStatus> {
  const status: RefreshStatus = {
    startedAt: new Date(),
    finishedAt: null,
    total: 0,
    refreshed: 0,
    failed: 0,
    reason: null,
  }
  const finish = async (reason: RefreshReason | null = null) => {
    status.reason = reason
    status.finishedAt = new Date()
    await record(status)
    console.log(
      `[auffrischer] ${status.refreshed} von ${status.total} Charakteren aufgefrischt` +
        (status.failed ? `, ${status.failed} mit Fehlern` : "") +
        (reason ? ` – ${reason}` : "")
    )
    return status
  }

  // force: Region oder Zugangsdaten könnten sich seit dem letzten Lauf geändert haben
  const config = await loadConfig(true)
  if (!config.setupComplete || !config.ownerBattleTag || !config.hasCredentials) {
    return finish("setupIncomplete")
  }

  const list = await latestSnapshot<unknown>(accountKey("owner-characters")).catch(() => null)
  const slugs = Array.isArray(list?.data)
    ? list.data.filter((s): s is string => typeof s === "string" && isCharacterSlug(s))
    : []
  status.total = slugs.length
  if (slugs.length === 0) return finish("noOwnerList")

  let token: string
  try {
    token = await clientCredentialsToken()
  } catch (error) {
    console.warn("[auffrischer] Kein App-Token:", error instanceof Error ? error.message : error)
    return finish("noToken")
  }

  // Probe am ersten Charakter, an der Snapshot-Schicht vorbei: die würde
  // einen 401/403 mit dem alten Stand überdecken, und dann liefe der Lauf
  // durch alle Charaktere, ohne dass je etwas Neues ankommt.
  try {
    await getCharacterProfile(slugs[0], token)
  } catch (error) {
    if (error instanceof BnetError && (error.status === 401 || error.status === 403)) {
      status.failed = slugs.length
      return finish("unauthorized")
    }
    // Andere Fehler (404, Netz) entscheidet der Lauf je Charakter
  }

  for (const slug of slugs) {
    if (await refreshCharacter(slug, token)) status.refreshed++
    else status.failed++
    await sleep(PAUSE_MS)
  }

  return finish()
}

// ─── Zeitplan ─────────────────────────────────────────────────────────────────

// An globalThis: instrumentation und Routen sind getrennte Bündel, und ein
// zweiter Start hiesse zwei Timer
const STARTED = Symbol.for("wow-dashboard.refresher-started")
const flags = globalThis as unknown as { [STARTED]?: boolean }

async function scheduleNext(): Promise<void> {
  const config = await loadConfig()
  const at = nextRefreshAt(new Date(), resetConfig(config.region))
  console.log(`[auffrischer] Nächster Lauf: ${at.toISOString()}`)

  const timer = setTimeout(async () => {
    try {
      await runRefresh()
    } catch (error) {
      console.error("[auffrischer] Lauf abgebrochen:", error)
    } finally {
      scheduleNext().catch((error) =>
        console.error("[auffrischer] Kein neuer Termin:", error)
      )
    }
  }, Math.max(0, at.getTime() - Date.now()))
  // Der Timer allein soll den Prozess nicht am Beenden hindern
  timer.unref?.()
}

export function startRefresher(): void {
  if (process.env.WOW_REFRESH === "off") {
    console.log("[auffrischer] abgeschaltet (WOW_REFRESH=off)")
    return
  }
  if (flags[STARTED]) return
  flags[STARTED] = true
  scheduleNext().catch((error) => console.error("[auffrischer] Start fehlgeschlagen:", error))
}
