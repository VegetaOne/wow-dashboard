/**
 * Reset-Arithmetik.
 *
 * Blizzard veröffentlicht keine Reset-Zeiten über die API – weder die
 * Uhrzeit noch die Lockout-Längen der Instanzen. Beides steht deshalb hier
 * als gepflegte Tabelle. Was nicht belegt ist, ist als solches markiert und
 * wird in der Oberfläche auch so gesagt, statt eine Zahl zu erfinden.
 *
 * Gerechnet wird durchgehend in UTC. Das Spiel selbst resettet nach
 * Serverzeit, also nach lokaler Zeit mit Sommerzeit-Umstellung. Solange
 * Europa und Amerika ihre Uhren nicht am selben Tag umstellen, verschiebt
 * sich die UTC-Stunde für ein paar Wochen im Jahr um eine Stunde. Für einen
 * Lockout-Zähler ist das verkraftbar; wer es genauer braucht, überschreibt
 * die Werte per Umgebungsvariable (siehe unten).
 */

export type Region = "eu" | "us" | "kr" | "tw" | "cn"

export interface ResetConfig {
  region: Region
  /** Wochentag des Wochenresets, 0 = Sonntag – wie `Date.getUTCDay()` */
  weeklyWeekday: number
  /** Stunde des Wochenresets in UTC */
  weeklyHourUtc: number
  /** Stunde des Tagesresets in UTC */
  dailyHourUtc: number
  /** true = für diese Region nicht belegt, aus der EU-Tabelle übernommen */
  assumed: boolean
  /** true = die Tageszeit ist quellenmässig strittig, siehe Kommentar */
  dailyUncertain: boolean
}

/**
 * Belegte Werte:
 *
 * - **EU:** Wochenreset Mittwoch 04:00 UTC. Zwei unabhängige Reset-Seiten
 *   nennen dieselbe Zeit.
 * - **US:** Wochenreset Dienstag 15:00 UTC (8:00 Pazifik während der
 *   Sommerzeit; im Winter wäre es 16:00 UTC – siehe Hinweis oben).
 *
 * Strittig ist die **Tageszeit für EU**: eine Quelle nennt 04:00 UTC, eine
 * andere 07:00 UTC. Hier steht 04:00, gleich dem Wochenreset, und der Wert
 * ist als unsicher markiert; die Oberfläche kennzeichnet ihn entsprechend.
 * Sobald du es aus dem Spiel bestätigst, kann die Markierung weg.
 */
const CONFIGS: Record<Region, Omit<ResetConfig, "assumed">> = {
  eu: { region: "eu", weeklyWeekday: 3, weeklyHourUtc: 4, dailyHourUtc: 4, dailyUncertain: true },
  us: { region: "us", weeklyWeekday: 2, weeklyHourUtc: 15, dailyHourUtc: 15, dailyUncertain: false },
  // Nicht belegt – bewusst als Kopie der EU-Werte markiert, damit die
  // Oberfläche sagen kann, dass hier geraten wird.
  kr: { region: "kr", weeklyWeekday: 3, weeklyHourUtc: 4, dailyHourUtc: 4, dailyUncertain: true },
  tw: { region: "tw", weeklyWeekday: 3, weeklyHourUtc: 4, dailyHourUtc: 4, dailyUncertain: true },
  cn: { region: "cn", weeklyWeekday: 3, weeklyHourUtc: 4, dailyHourUtc: 4, dailyUncertain: true },
}

function readOverride(name: string): number | null {
  const raw = process.env[name]
  if (!raw) return null
  const value = Number(raw)
  return Number.isInteger(value) ? value : null
}

/**
 * Konfiguration der Region. `BNET_REGION` bestimmt sie, wie im Rest der App.
 *
 * Überschreibbar mit `WOW_RESET_WEEKDAY`, `WOW_RESET_HOUR_UTC` und
 * `WOW_DAILY_RESET_HOUR_UTC` – gedacht für den Fall, dass die Tabelle oben
 * irgendwann nicht mehr stimmt und niemand gleich neu bauen will.
 */
export function resetConfig(region?: string): ResetConfig {
  const key = (region || process.env.BNET_REGION || "eu").toLowerCase()
  const known = (Object.keys(CONFIGS) as Region[]).includes(key as Region)
  const base = CONFIGS[(known ? key : "eu") as Region]
  const assumed = !known || key === "kr" || key === "tw" || key === "cn"

  const weekday = readOverride("WOW_RESET_WEEKDAY")
  const weeklyHour = readOverride("WOW_RESET_HOUR_UTC")
  const dailyHour = readOverride("WOW_DAILY_RESET_HOUR_UTC")

  return {
    ...base,
    assumed,
    weeklyWeekday: weekday ?? base.weeklyWeekday,
    weeklyHourUtc: weeklyHour ?? base.weeklyHourUtc,
    dailyHourUtc: dailyHour ?? base.dailyHourUtc,
    // Ein gesetzter Wert gilt als bewusst gesetzt
    dailyUncertain: dailyHour === null && base.dailyUncertain,
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Letzter Wochenreset vor oder auf `now`. */
export function lastWeeklyReset(now: Date, cfg: ResetConfig): Date {
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      cfg.weeklyHourUtc
    )
  )
  const back = (d.getUTCDay() - cfg.weeklyWeekday + 7) % 7
  d.setUTCDate(d.getUTCDate() - back)
  if (d.getTime() > now.getTime()) d.setUTCDate(d.getUTCDate() - 7)
  return d
}

export function nextWeeklyReset(now: Date, cfg: ResetConfig): Date {
  return addDays(lastWeeklyReset(now, cfg), 7)
}

export function lastDailyReset(now: Date, cfg: ResetConfig): Date {
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      cfg.dailyHourUtc
    )
  )
  if (d.getTime() > now.getTime()) d.setUTCDate(d.getUTCDate() - 1)
  return d
}

export function nextDailyReset(now: Date, cfg: ResetConfig): Date {
  return addDays(lastDailyReset(now, cfg), 1)
}

export interface LockoutWindow {
  /** Beginn des laufenden Zeitraums */
  start: Date
  /** Ende – zugleich der nächste Reset dieser Instanz */
  end: Date
  /** Nennlänge in Tagen, wie in der Lockout-Tabelle hinterlegt */
  days: number
  /**
   * true = der Zeitraum endet vorzeitig am Wochenreset.
   *
   * Kürzere Lockouts (3 und 5 Tage) gehen nicht glatt in sieben Tage auf.
   * Im Spiel hängen sie am Wochenreset und beginnen dort neu, der letzte
   * Abschnitt einer Woche ist also kürzer als die Nennlänge. Genau das
   * bildet diese Rechnung ab – und sagt es, statt eine falsche Restzeit
   * anzuzeigen.
   */
  shortened: boolean
}

/**
 * Laufender Lockout-Zeitraum einer Instanz.
 *
 * Verankert am Wochenreset: von dort in Schritten der Lockout-Länge nach
 * vorn, bis der nächste Schritt hinter `now` liegt. Die Zwischenresets
 * werden dabei zur selben Uhrzeit wie der Wochenreset angenommen; liegt der
 * Tagesreset auf einer anderen Stunde, kann das um diese Differenz abweichen.
 */
export function lockoutWindow(
  now: Date,
  cfg: ResetConfig,
  days: number
): LockoutWindow {
  const weekStart = lastWeeklyReset(now, cfg)
  const weekEnd = addDays(weekStart, 7)

  if (!Number.isFinite(days) || days >= 7 || days <= 0) {
    return { start: weekStart, end: weekEnd, days: 7, shortened: false }
  }

  let start = weekStart
  while (addDays(start, days).getTime() <= now.getTime()) {
    start = addDays(start, days)
  }

  const nominalEnd = addDays(start, days)
  const shortened = nominalEnd.getTime() > weekEnd.getTime()

  return {
    start,
    end: shortened ? weekEnd : nominalEnd,
    days,
    shortened,
  }
}
