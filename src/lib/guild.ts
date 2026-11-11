/**
 * Gilde: Profil, Mitgliederliste, Gildenerfolge und Aktivität.
 *
 * Zwei Dinge prägen den Aufbau hier:
 *
 * 1. **Die Mitgliederliste kann sehr lang sein.** Grosse Gilden haben mehrere
 *    hundert Einträge; die Rohantwort wird schnell mehrere hundert Kilobyte
 *    gross. Sie wird darum verdichtet, *bevor* sie in den Snapshot geht –
 *    gespeichert wird `GuildRosterView`, nicht die Rohantwort.
 *
 * 2. **Die Liste führt keine Gegenstandsstufen.** Sie liefert Name, Level,
 *    Klasse, Volk und Rang. Für die Gegenstandsstufe bräuchte es einen
 *    Profilaufruf je Mitglied – bei 400 Mitgliedern 400 Anfragen. Deshalb
 *    wird sie nicht hier geholt, sondern im Client für die Zeilen, die
 *    tatsächlich sichtbar sind (über `/api/wow/character-details`).
 *
 * WoW Forever: Gilden haben **keinen Realm**, sondern ein Ruleset. Der Pfad
 * ist `/data/wow/guild/{guild-slug}` im Profil-Namespace; Mitglieder führen
 * Vor- und Nachnamen und einen eigenen Slug (laut Community-Tests,
 * Stand 2026-11-11 – tolerant gelesen).
 *
 * Was die API ebenfalls nicht hergibt: **die Namen der Ränge.** Sie liefert
 * nur die Rangnummer. Rang 0 ist der Gildenmeister, alles darunter wird als
 * „Rang N" geführt – eine erfundene Bezeichnung wäre schlimmer als eine Zahl.
 */

import { bnetGet, characterPath, characterSlug } from "./battlenet"


// ─── Sichten ──────────────────────────────────────────────────────────────────

export interface GuildRef {
  /** Für den API-Pfad: klein, Leerzeichen als Bindestrich */
  slug: string
  /** Für die Anzeige, mit Gross-/Kleinschreibung und Leerzeichen */
  name: string
}

export interface GuildView {
  name: string
  /** Ruleset der Gilde (PvP, Normal, Rollenspiel …), wenn die API es nennt */
  rulesetName: string | null
  faction: string | null
  memberCount: number | null
  createdAt: number | null
  achievementPoints: number | null
}

export interface GuildMember {
  name: string
  surname: string | null
  /** `{name}-{surname}` – Adresse des Mitglieds */
  slug: string
  level: number | null
  className: string | null
  classId: number | null
  raceName: string | null
  /** Rangnummer, 0 = Gildenmeister */
  rank: number
}

export interface GuildRosterView {
  members: GuildMember[]
  /** Wie viele Einträge die Antwort führte, auch wenn welche unbrauchbar waren */
  reported: number | null
}

export interface GuildActivityEntry {
  /** Stabile Kennung für React, aus Zeitstempel und Inhalt gebaut */
  id: string
  timestamp: number | null
  kind: "achievement" | "encounter"
  /** „Gildenmeister hat X erreicht" – wer, wenn die API es nennt */
  characterName: string | null
  /** Erfolg oder Bossbegegnung */
  subject: string
  /** Bei Bossbegegnungen die Schwierigkeit, sonst null */
  detail: string | null
}

export interface GuildAchievementsView {
  totalQuantity: number | null
  totalPoints: number | null
  recent: { id: number; name: string; completedAt: number | null }[]
}

// ─── Rohformen ────────────────────────────────────────────────────────────────

export interface RawGuild {
  name?: string
  faction?: { name?: string }
  ruleset?: { name?: string; type?: string }
  member_count?: number
  created_timestamp?: number
  achievement_points?: number
}

export interface RawGuildRoster {
  members?: {
    character?: {
      name?: string
      surname?: string
      slug?: string
      key?: { href?: string }
      level?: number
      playable_class?: { id?: number; name?: string }
      playable_race?: { name?: string }
    }
    rank?: number
  }[]
}

export interface RawGuildActivity {
  activities?: {
    timestamp?: number
    activity?: { type?: string }
    character_achievement?: {
      character?: { name?: string }
      achievement?: { id?: number; name?: string }
    }
    encounter_completed?: {
      encounter?: { id?: number; name?: string }
      mode?: { name?: string }
    }
  }[]
}

export interface RawGuildAchievements {
  total_quantity?: number
  total_points?: number
  achievements?: {
    id?: number
    achievement?: { id?: number; name?: string }
    completed_timestamp?: number
  }[]
}

// ─── Pfad-Hilfen ──────────────────────────────────────────────────────────────

/**
 * Gildennamen in die Form bringen, die die API im Pfad erwartet:
 * klein geschrieben, Leerzeichen als Bindestrich. Umlaute bleiben – die
 * URL-Kodierung übernimmt `URL`.
 */
export function guildSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-")
}

// ─── Auswertung ───────────────────────────────────────────────────────────────

export function parseGuild(raw: RawGuild | null): GuildView | null {
  if (!raw?.name) return null

  return {
    name: raw.name,
    rulesetName: raw.ruleset?.name ?? raw.ruleset?.type ?? null,
    faction: raw.faction?.name ?? null,
    memberCount: typeof raw.member_count === "number" ? raw.member_count : null,
    createdAt:
      typeof raw.created_timestamp === "number" ? raw.created_timestamp : null,
    achievementPoints:
      typeof raw.achievement_points === "number" ? raw.achievement_points : null,
  }
}

export function parseRoster(raw: RawGuildRoster | null): GuildRosterView {
  const entries = raw?.members ?? []

  const members = entries
    .map((m): GuildMember | null => {
      const name = m.character?.name
      const surname = m.character?.surname ?? null
      // Zuerst der Slug, den die API selbst nennt; sonst aus den Namen gebaut
      const slug =
        m.character?.slug?.toLowerCase() ??
        (surname ? characterSlug(name ?? "", surname) : null)
      if (!name || !slug) return null

      return {
        name,
        surname,
        slug,
        level: typeof m.character?.level === "number" ? m.character.level : null,
        className: m.character?.playable_class?.name ?? null,
        classId:
          typeof m.character?.playable_class?.id === "number"
            ? m.character.playable_class.id
            : null,
        raceName: m.character?.playable_race?.name ?? null,
        rank: typeof m.rank === "number" ? m.rank : 99,
      }
    })
    .filter((m): m is GuildMember => m !== null)
    // Rang zuerst, darin nach Level absteigend, dann alphabetisch
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        (b.level ?? 0) - (a.level ?? 0) ||
        a.name.localeCompare(b.name)
    )

  return {
    members,
    reported: entries.length > 0 ? entries.length : null,
  }
}

/** Rang als Text. Nur Rang 0 hat einen von der API gedeckten Namen. */
export function rankLabel(rank: number): string {
  return rank === 0 ? "Gildenmeister" : `Rang ${rank}`
}

export function parseActivity(
  raw: RawGuildActivity | null
): GuildActivityEntry[] {
  return (raw?.activities ?? [])
    .map((a, index): GuildActivityEntry | null => {
      const timestamp = typeof a.timestamp === "number" ? a.timestamp : null

      const achievement = a.character_achievement?.achievement?.name
      if (achievement) {
        return {
          id: `a-${timestamp ?? index}-${achievement}`,
          timestamp,
          kind: "achievement",
          characterName: a.character_achievement?.character?.name ?? null,
          subject: achievement,
          detail: null,
        }
      }

      const encounter = a.encounter_completed?.encounter?.name
      if (encounter) {
        return {
          id: `e-${timestamp ?? index}-${encounter}`,
          timestamp,
          kind: "encounter",
          characterName: null,
          subject: encounter,
          detail: a.encounter_completed?.mode?.name ?? null,
        }
      }

      // Unbekannte Art: nicht mit einer erfundenen Beschriftung zeigen
      return null
    })
    .filter((a): a is GuildActivityEntry => a !== null)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
}

/** Wie viele der letzten Gildenerfolge die Übersicht zeigt. */
const RECENT_ACHIEVEMENTS = 12

export function parseGuildAchievements(
  raw: RawGuildAchievements | null
): GuildAchievementsView {
  const recent = (raw?.achievements ?? [])
    .map((a) => {
      const id = a.achievement?.id ?? a.id
      const name = a.achievement?.name
      if (typeof id !== "number" || !name) return null
      return {
        id,
        name,
        completedAt:
          typeof a.completed_timestamp === "number"
            ? a.completed_timestamp
            : null,
      }
    })
    .filter((a): a is { id: number; name: string; completedAt: number | null } =>
      a !== null
    )
    // Nur abgeschlossene mit Datum sind als „zuletzt" belegbar
    .filter((a) => a.completedAt !== null)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, RECENT_ACHIEVEMENTS)

  return {
    totalQuantity:
      typeof raw?.total_quantity === "number" ? raw.total_quantity : null,
    totalPoints: typeof raw?.total_points === "number" ? raw.total_points : null,
    recent,
  }
}

// ─── Abrufe ───────────────────────────────────────────────────────────────────

/** Gildenabrufe laufen im Profil-Namespace, wie Charaktere. */
function guildFetch<T>(path: string, token: string): Promise<T> {
  return bnetGet<T>(path, token, "profile", 900)
}

/**
 * Die Gilde eines Charakters – steht im Charakterprofil.
 * Gibt null zurück, wenn der Charakter in keiner Gilde ist; das ist
 * kein Fehler, sondern ein möglicher Zustand.
 */
export async function fetchCharacterGuild(
  slug: string,
  token: string
): Promise<GuildRef | null> {
  const data = await guildFetch<{
    guild?: { name?: string; slug?: string }
  }>(characterPath(slug), token)

  const guildName = data.guild?.name
  if (!guildName) return null

  return {
    slug: data.guild?.slug?.toLowerCase() ?? guildSlug(guildName),
    name: guildName,
  }
}

/** Forever-Gilden haben keinen Realm im Pfad. */
function guildPath(ref: GuildRef, suffix = ""): string {
  return `/data/wow/guild/${encodeURIComponent(ref.slug)}${suffix}`
}

export function fetchGuild(
  ref: GuildRef,
  token: string
): Promise<RawGuild> {
  return guildFetch<RawGuild>(guildPath(ref), token)
}

/** Mitgliederliste, gleich verdichtet – die Rohantwort ist zu gross zum Aufbewahren. */
export async function fetchRoster(
  ref: GuildRef,
  token: string
): Promise<GuildRosterView> {
  const raw = await guildFetch<RawGuildRoster>(
    guildPath(ref, "/roster"),
    token
  )
  return parseRoster(raw)
}

export function fetchGuildActivity(
  ref: GuildRef,
  token: string
): Promise<RawGuildActivity> {
  return guildFetch<RawGuildActivity>(guildPath(ref, "/activity"), token)
}

export function fetchGuildAchievements(
  ref: GuildRef,
  token: string
): Promise<RawGuildAchievements> {
  return guildFetch<RawGuildAchievements>(
    guildPath(ref, "/achievements"),
    token
  )
}
