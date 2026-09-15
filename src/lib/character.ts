/**
 * Charakterdaten mit Zwischenspeicher.
 *
 * `battlenet.ts` bleibt die rohe API-Schicht. Hier liegt die Ebene darüber:
 * jeder Abruf geht durch `withSnapshot`, bekommt damit einen Verlauf und
 * fällt bei API-Ausfall auf den letzten bekannten Stand zurück.
 *
 * Neue Datensätze gehören hierhin, nicht direkt in die Seiten.
 */

import {
  getCharacterEquipment,
  getCharacterProfile,
  getCharacterMedia,
  getCharacterProfessions,
  getCharacterRaids,
  getCharacterDungeons,
  getCharacterMythicKeystone,
  type CharacterEquipment,
  type CharacterMedia,
  type GameMode,
} from "./battlenet"
import { withSnapshot, accountKey, type SnapshotResult } from "./snapshot"
import type { RawProfessions } from "./professions"
import type { RawEncounters, RawMythicProfile } from "./progress"
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

export interface CharacterRef {
  realm: string
  name: string
  mode: GameMode
}

export interface CharacterProfileData {
  averageItemLevel?: number
  equippedItemLevel?: number
}

export function equipment(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<CharacterEquipment>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "equipment" },
    () => getCharacterEquipment(ref.realm, ref.name, token, ref.mode)
  )
}

export function profile(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<CharacterProfileData>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "profile" },
    () => getCharacterProfile(ref.realm, ref.name, token, ref.mode)
  )
}

export function media(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<CharacterMedia>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "media" },
    // Bilder ändern sich nur bei Ausrüstungswechsel – eine Stunde genügt
    () => getCharacterMedia(ref.realm, ref.name, token, ref.mode),
    60 * 60
  )
}

export function professions(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawProfessions>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "professions" },
    async () =>
      (await getCharacterProfessions(
        ref.realm,
        ref.name,
        token,
        ref.mode
      )) as RawProfessions
  )
}

export function raids(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawEncounters>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "raids" },
    async () =>
      (await getCharacterRaids(ref.realm, ref.name, token, ref.mode)) as RawEncounters
  )
}

export function dungeons(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawEncounters>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "dungeons" },
    async () =>
      (await getCharacterDungeons(ref.realm, ref.name, token, ref.mode)) as RawEncounters
  )
}

/** Mythisch+ gibt es nur in Retail – in Classic wirft der Abruf. */
export function mythicKeystone(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawMythicProfile>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "mythic-keystone" },
    async () =>
      (await getCharacterMythicKeystone(
        ref.realm, ref.name, token, ref.mode
      )) as RawMythicProfile,
    // Wöchentlicher Reset – häufiger als eine Stunde lohnt nicht
    60 * 60
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
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "achievements" },
    () => fetchCharacterAchievements(ref.realm, ref.name, token, ref.mode)
  )
}

export function reputations(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawReputations>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "reputations" },
    () => fetchReputations(ref.realm, ref.name, token, ref.mode)
  )
}

export function pvpSummary(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawPvpSummary>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "pvp" },
    () => fetchPvpSummary(ref.realm, ref.name, token, ref.mode)
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
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "pvp-brackets" },
    async () => {
      const results = await Promise.all(
        PVP_BRACKETS.map(async (b) => [
          b.slug,
          await fetchBracket(ref.realm, ref.name, b.slug, token, ref.mode),
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
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "toys" },
    () => fetchCharacterToys(ref.realm, ref.name, token, ref.mode)
  )
}

export function titles(
  ref: CharacterRef,
  token: string
): Promise<SnapshotResult<RawTitleCollection>> {
  return withSnapshot(
    { gameMode: ref.mode, realmSlug: ref.realm, charName: ref.name, dataset: "titles" },
    () => fetchCharacterTitles(ref.realm, ref.name, token, ref.mode)
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
    }
  } catch {
    return { value: null, fetchedAt: null, stale: false, failed: true }
  }
}
