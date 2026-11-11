/**
 * Charakterdaten mit Zwischenspeicher.
 *
 * `battlenet.ts` bleibt die rohe API-Schicht. Hier liegt die Ebene darüber:
 * jeder Abruf geht durch `withSnapshot`, bekommt damit einen Verlauf und
 * fällt bei API-Ausfall auf den letzten bekannten Stand zurück.
 *
 * Neue Datensätze gehören hierhin, nicht direkt in die Seiten.
 */

import { notFound } from "next/navigation"
import {
  bnetGet,
  characterPath,
  isCharacterSlug,
  isNotFound,
  getCharacterEquipment,
  getCharacterProfile,
  getCharacterMedia,
  getCharacterProfessions,
  getCharacterRaids,
  getCharacterDungeons,
  type CharacterEquipment,
  type CharacterMedia,
  type CharacterProfileData,
} from "./battlenet"
import {
  withSnapshot,
  accountKey,
  characterKey,
  guildKey,
  type SnapshotResult,
} from "./snapshot"
import type { RawSpecializations } from "./talent-tree"
import {
  fetchCharacterGuild,
  fetchGuild,
  fetchRoster,
  fetchGuildActivity,
  fetchGuildAchievements,
  type GuildRef,
  type GuildRosterView,
  type RawGuild,
  type RawGuildActivity,
  type RawGuildAchievements,
} from "./guild"
import type { RawProfessions } from "./professions"
import type { RawEncounters } from "./progress"
import { fetchReputations, type RawReputations } from "./reputations"
import {
  fetchPvpSummary,
  fetchBracket,
  PVP_BRACKETS,
  type RawPvpSummary,
  type RawBracket,
} from "./pvp"
import {
  fetchCharacterAchievements,
  type AchievementSummary,
} from "./achievements"
import {
  fetchAccountMounts,
  fetchAccountPets,
  fetchCharacterToys,
  fetchCharacterTitles,
  type RawMountCollection,
  type RawPetCollection,
  type RawToyCollection,
  type RawTitleCollection,
} from "./collections"

/**
 * Ein Forever-Charakter. Nur der Slug `{name}-{surname}` – es gibt keinen
 * Realm und keinen Spielmodus mehr. Die Region kommt aus der Konfiguration.
 */
export interface CharacterRef {
  slug: string
}

export type { CharacterProfileData }

/**
 * Slug aus dem Pfadsegment `[character]` lesen.
 *
 * Next reicht das Segment URL-kodiert durch; Umlaute im Namen kämen sonst
 * als `%C3%B6` an. Ein Segment ohne Bindestrich ist kein Forever-Charakter
 * (etwa ein alter Lesezeichen-Link aus Retail-Zeiten) – dann 404 statt eines
 * Abrufs, der ohnehin scheitert.
 */
export function characterFromParam(raw: string): CharacterRef {
  let slug = raw
  try {
    slug = decodeURIComponent(raw)
  } catch {
    // Kaputte Kodierung: so lassen, die Prüfung unten fängt es ab
  }
  slug = slug.toLowerCase()
  if (!isCharacterSlug(slug)) notFound()
  return { slug }
}

export function equipment(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<CharacterEquipment>> {
  return withSnapshot(
    characterKey(ref.slug, "equipment"),
    () => getCharacterEquipment(ref.slug, token)
  )
}

export function profile(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<CharacterProfileData>> {
  return withSnapshot(
    characterKey(ref.slug, "profile"),
    () => getCharacterProfile(ref.slug, token)
  )
}

/** Gesetzte Talente je Spezialisierung (Rohform – gelesen in talent-tree.ts). */
export function specializations(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawSpecializations>> {
  return withSnapshot(
    characterKey(ref.slug, "specializations"),
    () => bnetGet<RawSpecializations>(characterPath(ref.slug, "specializations"), token, "profile")
  )
}

export function media(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<CharacterMedia>> {
  return withSnapshot(
    characterKey(ref.slug, "media"),
    // Bilder ändern sich nur bei Ausrüstungswechsel – eine Stunde genügt
    () => getCharacterMedia(ref.slug, token),
    60 * 60
  )
}

export function professions(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawProfessions>> {
  return withSnapshot(
    characterKey(ref.slug, "professions"),
    async () =>
      (await getCharacterProfessions(ref.slug, token)) as RawProfessions
  )
}

export function raids(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawEncounters>> {
  return withSnapshot(
    characterKey(ref.slug, "raids"),
    async () =>
      (await getCharacterRaids(ref.slug, token)) as RawEncounters
  )
}

export function dungeons(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawEncounters>> {
  return withSnapshot(
    characterKey(ref.slug, "dungeons"),
    async () =>
      (await getCharacterDungeons(ref.slug, token)) as RawEncounters
  )
}

/**
 * Erfolge. Der Abruf verdichtet die Antwort selbst, bevor sie in den
 * Snapshot geht – die Rohantwort wäre für eine tägliche Historie zu gross.
 */
export function achievements(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<AchievementSummary>> {
  return withSnapshot(
    characterKey(ref.slug, "achievements"),
    () => fetchCharacterAchievements(ref.slug, token)
  )
}

export function reputations(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawReputations>> {
  return withSnapshot(
    characterKey(ref.slug, "reputations"),
    () => fetchReputations(ref.slug, token)
  )
}

export function pvpSummary(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawPvpSummary>> {
  return withSnapshot(
    characterKey(ref.slug, "pvp"),
    () => fetchPvpSummary(ref.slug, token)
  )
}

/**
 * Alle gewerteten Klassen in einem Snapshot – einzeln wären es drei
 * Einträge je Charakter und Tag, ohne Mehrwert.
 */
export function pvpBrackets(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<Record<string, RawBracket | null>>> {
  return withSnapshot(
    characterKey(ref.slug, "pvp-brackets"),
    async () => {
      const results = await Promise.all(
        PVP_BRACKETS.map(async (b) => [
          b.slug,
          await fetchBracket(ref.slug, b.slug, token),
        ] as const)
      )
      return Object.fromEntries(results)
    }
  )
}

// ─── Sammlungen ───────────────────────────────────────────────────────────────

/** Account-weit: gilt für alle Charaktere gemeinsam. */
export function accountMounts(
  token: string
): Promise<SnapshotResult<RawMountCollection>> {
  return withSnapshot(accountKey("account-mounts"), () => fetchAccountMounts(token))
}

export function accountPets(
  token: string
): Promise<SnapshotResult<RawPetCollection>> {
  return withSnapshot(accountKey("account-pets"), () => fetchAccountPets(token))
}

export function toys(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawToyCollection>> {
  return withSnapshot(
    characterKey(ref.slug, "toys"),
    () => fetchCharacterToys(ref.slug, token)
  )
}

export function titles(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawTitleCollection>> {
  return withSnapshot(
    characterKey(ref.slug, "titles"),
    () => fetchCharacterTitles(ref.slug, token)
  )
}

// ─── Gilde ────────────────────────────────────────────────────────────────────

/**
 * Welcher Gilde der Charakter angehört. `null` heisst „in keiner Gilde" –
 * das ist ein gültiger Zustand, kein Fehler.
 */
export function characterGuild(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<GuildRef | null>> {
  return withSnapshot(
    characterKey(ref.slug, "character-guild"),
    () => fetchCharacterGuild(ref.slug, token)
  )
}

export function guildProfile(
  guild: GuildRef,
  token: string
): Promise<SnapshotResult<RawGuild>> {
  return withSnapshot(guildKey(guild.slug, "guild"), () =>
    fetchGuild(guild, token)
  )
}

/**
 * Mitgliederliste, schon verdichtet. Längere Frist als üblich: ein Roster
 * ändert sich in Stunden, nicht in Minuten, und der Abruf ist der teuerste
 * der Gildenansicht.
 */
export function guildRoster(
  guild: GuildRef,
  token: string
): Promise<SnapshotResult<GuildRosterView>> {
  return withSnapshot(
    guildKey(guild.slug, "guild-roster"),
    () => fetchRoster(guild, token),
    6 * 60 * 60
  )
}

export function guildActivity(
  guild: GuildRef,
  token: string
): Promise<SnapshotResult<RawGuildActivity>> {
  return withSnapshot(
    guildKey(guild.slug, "guild-activity"),
    () => fetchGuildActivity(guild, token),
    60 * 60
  )
}

export function guildAchievements(
  guild: GuildRef,
  token: string
): Promise<SnapshotResult<RawGuildAchievements>> {
  return withSnapshot(
    guildKey(guild.slug, "guild-achievements"),
    () => fetchGuildAchievements(guild, token),
    6 * 60 * 60
  )
}

/**
 * Ergebnis eines Abrufs, der auch scheitern darf.
 * Die Seiten sollen bei einem fehlenden Datensatz nicht ganz ausfallen.
 */
export interface Attempt<T> {
  value: T | null
  fetchedAt: Date | null
  stale: boolean
  failed: boolean
  /**
   * true = die API hat mit 404 geantwortet. Bei WoW Forever heisst das meist
   * „noch keine Daten" (Charakter unter Stufe 10 oder noch nie ausgeloggt,
   * Bild noch nicht gerendert) – die Oberfläche sagt das, statt einen
   * Fehler zu melden. `failed` ist dann ebenfalls true.
   */
  notFound: boolean
}

export async function attempt<T>(
  load: () => Promise<SnapshotResult<T>>
): Promise<Attempt<T>> {
  try {
    const result = await load()
    return {
      value: result.data,
      fetchedAt: result.fetchedAt,
      stale: result.stale,
      failed: false,
      notFound: false,
    }
  } catch (error) {
    return {
      value: null,
      fetchedAt: null,
      stale: false,
      failed: true,
      notFound: isNotFound(error),
    }
  }
}
