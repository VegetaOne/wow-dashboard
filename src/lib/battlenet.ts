/**
 * Battle.net API Client
 * Alle Requests laufen server-seitig (Token verlässt nie das Backend).
 */

import { apiBase, locale, region } from "./runtime"
import type { TranslationKey } from "./i18n"

/** Wie viele Charakter-Requests parallel laufen dürfen (Rate-Limit-Schutz) */
const CONCURRENCY = 8

// ─── Spielmodi ────────────────────────────────────────────────────────────────

export type GameMode = "retail" | "classic" | "classic-era"

export interface GameModeConfig {
  id: GameMode
  label: string
  /** Namespace für Profildaten (Charaktere, Ausrüstung) */
  namespace: string
  /** Namespace für statische Spieldaten (Item-Icons, Medien) */
  staticNamespace: string
  /** Namespace für veränderliche Spieldaten (Auktionen, verbundene Realms) */
  dynamicNamespace: string
  accent: string
  /** Retail liefert ilvl + Avatar, Classic-Namespaces nicht */
  hasRichProfile: boolean
}

/**
 * Die Spielmodi.
 *
 * Die Namespaces tragen die Region im Namen, und die Region steht seit dem
 * Setup in der Datenbank – sie kann sich also zur Laufzeit ändern. Deshalb
 * sind die drei Namespace-Felder **Getter**: als feste Zeichenketten wären
 * sie beim Laden des Moduls eingefroren und würden nach einer Umstellung
 * weiter auf die alte Region zeigen.
 */
export const GAME_MODES: GameModeConfig[] = [
  {
    id: "retail",
    label: "Retail",
    get namespace() {
      return `profile-${region()}`
    },
    get staticNamespace() {
      return `static-${region()}`
    },
    get dynamicNamespace() {
      return `dynamic-${region()}`
    },
    accent: "#D4AF37",
    hasRichProfile: true,
  },
  {
    id: "classic",
    label: "Classic",
    get namespace() {
      return `profile-classic-${region()}`
    },
    get staticNamespace() {
      return `static-classic-${region()}`
    },
    get dynamicNamespace() {
      return `dynamic-classic-${region()}`
    },
    accent: "#C9A227",
    hasRichProfile: false,
  },
  {
    id: "classic-era",
    label: "Classic Era",
    get namespace() {
      return `profile-classic1x-${region()}`
    },
    get staticNamespace() {
      return `static-classic1x-${region()}`
    },
    get dynamicNamespace() {
      return `dynamic-classic1x-${region()}`
    },
    accent: "#7BA05B",
    hasRichProfile: false,
  },
]

/**
 * Slots, die verzaubert werden können. Nur für Retail belegt –
 * für die Classic-Modi gelten andere Regeln, die hier nicht abgedeckt sind.
 */
export const ENCHANTABLE_SLOTS: Partial<Record<GameMode, string[]>> = {
  retail: [
    "MAIN_HAND", "OFF_HAND", "CHEST", "LEGS",
    "FEET", "WRIST", "BACK", "FINGER_1", "FINGER_2",
  ],
}

/** Slot-Anordnung wie im Charakterfenster: links, rechts, Waffen unten. */
export const PAPERDOLL_LEFT = [
  "HEAD", "NECK", "SHOULDER", "BACK", "CHEST", "WRIST",
]
export const PAPERDOLL_RIGHT = [
  "HANDS", "WAIST", "LEGS", "FEET",
  "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2",
]
export const PAPERDOLL_WEAPONS = ["MAIN_HAND", "OFF_HAND"]

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface WoWCharacter {
  id: number
  name: string
  realm: { slug: string; name: string }
  level: number
  faction: { type: "ALLIANCE" | "HORDE"; name: string }
  playable_class: { id: number; name: string }
  playable_race: { id: number; name: string }
  gender: { type: string; name: string }
  gameMode: GameMode
  averageItemLevel?: number
  equippedItemLevel?: number
  avatarUrl?: string | null
  isFavorite?: boolean
}

export interface EquipmentSlot {
  slot: { type: string; name?: string }
  /** Enthält nur id und key – der Anzeigename steht eine Ebene höher */
  item: { id: number; name?: string }
  /** Anzeigename des Gegenstands (oberste Ebene der API-Antwort) */
  name?: string
  quality?: { type: string; name?: string }
  /** Die Classic-APIs liefern für viele Gegenstände keine Stufe */
  level?: { value: number; display_string?: string }
  enchantments?: { display_string: string }[]
  sockets?: { socket_type: { type: string }; item?: { name?: string } }[]
  /** Für den Tooltip – jede Angabe hat einen fertigen Anzeigetext */
  stats?: {
    type?: { type: string; name?: string }
    value?: number
    display?: { display_string?: string }
    is_negated?: boolean
  }[]
  armor?: { value?: number; display?: { display_string?: string } }
  binding?: { type?: string; name?: string }
  /** Wird von uns nachgeladen, kommt nicht aus der Equipment-Antwort */
  iconUrl?: string
}

export interface CharacterEquipment {
  character?: { name?: string; realm?: { slug?: string } }
  equipped_items?: EquipmentSlot[]
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

async function bnetFetch<T>(
  path: string,
  token: string,
  namespace: string,
  revalidate = 300
): Promise<T> {
  const url = new URL(`${apiBase()}${path}`)
  url.searchParams.set("namespace", namespace)
  url.searchParams.set("locale", locale())

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate },
  })

  if (!res.ok) {
    throw new Error(`Battle.net ${res.status} (${namespace}): ${await res.text()}`)
  }

  return res.json() as Promise<T>
}

/** Führt fn über alle items aus, aber höchstens `limit` gleichzeitig. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  )
  return results
}

// ─── Charaktere laden ─────────────────────────────────────────────────────────

interface RawCharacter {
  id: number
  name: string
  realm: { slug: string; name: string }
  level: number
  faction: { type: string; name: string }
  playable_class: { id: number; name: string }
  playable_race: { id: number; name: string }
  gender: { type: string; name: string }
}

/**
 * Charaktere eines einzelnen Spielmodus.
 * Schlägt der Namespace fehl (z.B. Modus für den Account nicht vorhanden),
 * wird eine leere Liste zurückgegeben statt zu werfen.
 */
async function getCharactersForMode(
  mode: GameModeConfig,
  token: string
): Promise<WoWCharacter[]> {
  try {
    const data = await bnetFetch<{
      wow_accounts?: { characters: RawCharacter[] }[]
    }>("/profile/user/wow", token, mode.namespace)

    const raw = (data.wow_accounts ?? []).flatMap((acc) => acc.characters ?? [])

    return raw.map((c) => ({
      id: c.id,
      name: c.name,
      realm: c.realm,
      level: c.level,
      faction: {
        type: c.faction.type === "ALLIANCE" ? "ALLIANCE" : "HORDE",
        name: c.faction.name,
      },
      playable_class: c.playable_class,
      playable_race: c.playable_race,
      gender: c.gender,
      gameMode: mode.id,
    }))
  } catch (error) {
    console.warn(
      `[wow] Namespace ${mode.namespace} nicht verfügbar – übersprungen.`,
      error instanceof Error ? error.message : error
    )
    return []
  }
}

/** ilvl eines Charakters – nur Retail liefert diese Werte */
async function fetchProfileDetails(
  realm: string,
  name: string,
  token: string,
  namespace: string
): Promise<{ averageItemLevel?: number; equippedItemLevel?: number }> {
  try {
    const data = await bnetFetch<{
      average_item_level?: number
      equipped_item_level?: number
    }>(`/profile/wow/character/${realm}/${name.toLowerCase()}`, token, namespace)
    return {
      averageItemLevel: data.average_item_level,
      equippedItemLevel: data.equipped_item_level,
    }
  } catch {
    return {}
  }
}

/** Avatar-URL eines Charakters */
async function fetchAvatar(
  realm: string,
  name: string,
  token: string,
  namespace: string
): Promise<string | null> {
  try {
    const data = await bnetFetch<{ assets?: { key: string; value: string }[] }>(
      `/profile/wow/character/${realm}/${name.toLowerCase()}/character-media`,
      token,
      namespace
    )
    return data.assets?.find((a) => a.key === "avatar")?.value ?? null
  } catch {
    return null
  }
}

/**
 * Charaktere eines Spielmodus als flache Liste – ein einziger API-Call.
 *
 * Bewusst OHNE Gegenstandsstufe und Avatar: die kosten zwei weitere Anfragen
 * pro Charakter und würden den ersten Seitenaufbau um Dutzende Requests
 * verzögern. Sie kommen über getCharacterDetails nach, wenn sie gebraucht werden.
 */
export async function getCharacters(
  token: string,
  modeId: GameMode,
  favoriteKeys: Set<string>
): Promise<WoWCharacter[]> {
  const mode = GAME_MODES.find((m) => m.id === modeId) ?? GAME_MODES[0]
  const characters = await getCharactersForMode(mode, token)

  return characters
    .map((char) => ({
      ...char,
      isFavorite: favoriteKeys.has(`${mode.id}:${char.realm.slug}:${char.name}`),
    }))
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
}

export interface CharacterDetails {
  equippedItemLevel?: number
  averageItemLevel?: number
  avatarUrl?: string | null
}

/** Schlüssel, unter dem Details zu einem Charakter geführt werden. */
export function detailKey(realmSlug: string, name: string): string {
  return `${realmSlug}:${name}`
}

/**
 * Gegenstandsstufe und Avatar für eine begrenzte Auswahl an Charakteren.
 * Wird vom Client nur für die Realm-Abschnitte angefragt, die er zeigt.
 */
export async function getCharacterDetails(
  refs: { realm: string; name: string }[],
  token: string,
  modeId: GameMode
): Promise<Record<string, CharacterDetails>> {
  const mode = GAME_MODES.find((m) => m.id === modeId) ?? GAME_MODES[0]

  // Die Classic-APIs führen diese Werte nicht – gar nicht erst anfragen.
  if (!mode.hasRichProfile) return {}

  const results = await mapLimit(refs, CONCURRENCY, async (ref) => {
    const key = detailKey(ref.realm, ref.name)
    try {
      const [details, avatarUrl] = await Promise.all([
        fetchProfileDetails(ref.realm, ref.name, token, mode.namespace),
        fetchAvatar(ref.realm, ref.name, token, mode.namespace),
      ])
      return [key, { ...details, avatarUrl }] as const
    } catch {
      return [key, {} as CharacterDetails] as const
    }
  })

  const map: Record<string, CharacterDetails> = {}
  for (const [key, value] of results) map[key] = value
  return map
}

// ─── Ausrüstung ───────────────────────────────────────────────────────────────

export async function getCharacterEquipment(
  realm: string,
  name: string,
  token: string,
  mode: GameMode = "retail"
): Promise<CharacterEquipment> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  return bnetFetch<CharacterEquipment>(
    `/profile/wow/character/${realm}/${name.toLowerCase()}/equipment`,
    token,
    config.namespace
  )
}

export async function getCharacterProfile(
  realm: string,
  name: string,
  token: string,
  mode: GameMode = "retail"
): Promise<{ averageItemLevel?: number; equippedItemLevel?: number }> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const data = await bnetFetch<{
    average_item_level?: number
    equipped_item_level?: number
  }>(`/profile/wow/character/${realm}/${name.toLowerCase()}`, token, config.namespace)

  return {
    averageItemLevel: data.average_item_level,
    equippedItemLevel: data.equipped_item_level,
  }
}

/** Eine Woche – Item-Icons ändern sich praktisch nie. */
const STATIC_REVALIDATE = 60 * 60 * 24 * 7

/**
 * Icon-URLs zu Gegenstands-IDs.
 * Fehlende Icons werden ausgelassen statt zu werfen – ein Icon ist kein
 * Grund, die ganze Ausrüstungsseite scheitern zu lassen.
 */
export async function getItemIcons(
  itemIds: number[],
  token: string,
  mode: GameMode = "retail"
): Promise<Record<number, string>> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const unique = Array.from(new Set(itemIds.filter((id) => id > 0)))

  const results = await mapLimit(unique, CONCURRENCY, async (id) => {
    try {
      const data = await bnetFetch<{ assets?: { key: string; value: string }[] }>(
        `/data/wow/media/item/${id}`,
        token,
        config.staticNamespace,
        STATIC_REVALIDATE
      )
      return [id, data.assets?.find((a) => a.key === "icon")?.value] as const
    } catch {
      return [id, undefined] as const
    }
  })

  const icons: Record<number, string> = {}
  for (const [id, url] of results) {
    if (url) icons[id] = url
  }
  return icons
}

/** Stammdaten eines Gegenstands, wie der Tooltip sie braucht. */
export interface ItemDetails {
  id: number
  name: string
  itemLevel: number | null
  quality: string | null
  inventoryType: string | null
  /** Fertige Anzeigetexte je Wert, wie die API sie liefert */
  stats: { label: string; type: string | null; value: number | null }[]
  armor: string | null
  binding: string | null
}

/**
 * Stammdaten mehrerer Gegenstände. Fehlende werden ausgelassen statt
 * zu werfen – ein Tooltip ist kein Grund, die Seite scheitern zu lassen.
 */
export async function getItemDetails(
  itemIds: number[],
  token: string,
  mode: GameMode = "retail"
): Promise<Record<number, ItemDetails>> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const unique = Array.from(new Set(itemIds.filter((id) => id > 0)))

  const results = await mapLimit(unique, CONCURRENCY, async (id) => {
    try {
      const data = await bnetFetch<{
        id?: number
        name?: string
        level?: number
        quality?: { type?: string }
        inventory_type?: { type?: string }
        preview_item?: {
          stats?: {
            type?: { type?: string }
            value?: number
            display?: { display_string?: string }
          }[]
          armor?: { display?: { display_string?: string } }
          binding?: { name?: string }
          level?: { value?: number }
        }
      }>(`/data/wow/item/${id}`, token, config.staticNamespace, STATIC_REVALIDATE)

      const preview = data.preview_item
      const stats = (preview?.stats ?? [])
        .map((s) => ({
          label: s.display?.display_string ?? "",
          type: s.type?.type ?? null,
          value: typeof s.value === "number" ? s.value : null,
        }))
        .filter((s) => s.label !== "" || s.value !== null)

      return [
        id,
        {
          id,
          name: data.name ?? `Gegenstand ${id}`,
          itemLevel:
            typeof data.level === "number"
              ? data.level
              : (preview?.level?.value ?? null),
          quality: data.quality?.type ?? null,
          inventoryType: data.inventory_type?.type ?? null,
          stats,
          armor: preview?.armor?.display?.display_string ?? null,
          binding: preview?.binding?.name ?? null,
        } satisfies ItemDetails,
      ] as const
    } catch {
      return [id, null] as const
    }
  })

  const map: Record<number, ItemDetails> = {}
  for (const [id, details] of results) {
    if (details) map[id] = details
  }
  return map
}

/** Rohantwort eines beliebigen Charakter-Unterpfads. */
async function characterEndpoint(
  path: string,
  realm: string,
  name: string,
  token: string,
  mode: GameMode
): Promise<unknown> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  return bnetFetch<unknown>(
    `/profile/wow/character/${realm}/${name.toLowerCase()}/${path}`,
    token,
    config.namespace
  )
}

export function getCharacterRaids(
  realm: string, name: string, token: string, mode: GameMode = "retail"
): Promise<unknown> {
  return characterEndpoint("encounters/raids", realm, name, token, mode)
}

export function getCharacterDungeons(
  realm: string, name: string, token: string, mode: GameMode = "retail"
): Promise<unknown> {
  return characterEndpoint("encounters/dungeons", realm, name, token, mode)
}

/** Nur Retail – die Classic-Namespaces antworten hier mit 404. */
export function getCharacterMythicKeystone(
  realm: string, name: string, token: string, mode: GameMode = "retail"
): Promise<unknown> {
  return characterEndpoint("mythic-keystone-profile", realm, name, token, mode)
}

/** Rohantwort des professions-Endpunkts – Auswertung in professions.ts */
export async function getCharacterProfessions(
  realm: string,
  name: string,
  token: string,
  mode: GameMode = "retail"
): Promise<unknown> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  return bnetFetch<unknown>(
    `/profile/wow/character/${realm}/${name.toLowerCase()}/professions`,
    token,
    config.namespace
  )
}

export interface CharacterMedia {
  /** Quadratisches Porträt */
  avatar: string | null
  /** Brustbild */
  inset: string | null
  /** Volles Charaktermodell – bevorzugt freigestellt (main-raw) */
  main: string | null
}

/**
 * Bilder eines Charakters. Die Classic-APIs liefern hier meist nichts –
 * in dem Fall kommen überall null zurück statt eines Fehlers.
 */
export async function getCharacterMedia(
  realm: string,
  name: string,
  token: string,
  mode: GameMode = "retail"
): Promise<CharacterMedia> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const empty: CharacterMedia = { avatar: null, inset: null, main: null }

  try {
    const data = await bnetFetch<{ assets?: { key: string; value: string }[] }>(
      `/profile/wow/character/${realm}/${name.toLowerCase()}/character-media`,
      token,
      config.namespace
    )
    const assets = data.assets ?? []
    const pick = (key: string) => assets.find((a) => a.key === key)?.value ?? null

    return {
      avatar: pick("avatar"),
      inset: pick("inset"),
      // main-raw ist freigestellt und lässt sich sauber auf den Hintergrund legen
      main: pick("main-raw") ?? pick("main"),
    }
  } catch {
    return empty
  }
}

// ─── Konstanten für die Darstellung ──────────────────────────────────────────

export const CLASS_COLORS: Record<number, string> = {
  1: "#C79C6E",  // Krieger
  2: "#F58CBA",  // Paladin
  3: "#ABD473",  // Jäger
  4: "#FFF569",  // Schurke
  5: "#FFFFFF",  // Priester
  6: "#C41F3B",  // Todesritter
  7: "#0070DE",  // Schamane
  8: "#69CCF0",  // Magier
  9: "#9482C9",  // Hexenmeister
  10: "#00FF96", // Mönch
  11: "#FF7D0A", // Druide
  12: "#A330C9", // Dämonenjäger
  13: "#33937F", // Rufer
}

export const FACTION_STYLE = {
  ALLIANCE: {
    label: "Allianz",
    color: "#3B82F6",
    dim: "#1E3A5F",
    glow: "rgba(59, 130, 246, 0.35)",
  },
  HORDE: {
    label: "Horde",
    color: "#DC2626",
    dim: "#5F1E1E",
    glow: "rgba(220, 38, 38, 0.35)",
  },
} as const

export const QUALITY_COLORS: Record<string, string> = {
  POOR: "#9D9D9D",
  COMMON: "#FFFFFF",
  UNCOMMON: "#1EFF00",
  RARE: "#0070FF",
  EPIC: "#A335EE",
  LEGENDARY: "#FF8000",
  ARTIFACT: "#E6CC80",
  HEIRLOOM: "#00CCFF",
}

const QUALITY_LABEL_KEYS: Record<string, TranslationKey> = {
  POOR: "equipment.quality.poor",
  COMMON: "equipment.quality.common",
  UNCOMMON: "equipment.quality.uncommon",
  RARE: "equipment.quality.rare",
  EPIC: "equipment.quality.epic",
  LEGENDARY: "equipment.quality.legendary",
  ARTIFACT: "equipment.quality.artifact",
  HEIRLOOM: "equipment.quality.heirloom",
}

/**
 * Wörterbuchschlüssel zum API-Qualitätstyp – ersetzt die früher dreifache
 * Tabelle in EquipmentPanel, ItemTooltip und CandidateTooltip. Ein
 * unbekannter oder fehlender Typ gibt `null`; die aufrufende Stelle zeigt
 * dann „—" statt des rohen API-Werts.
 */
export function qualityLabelKey(quality: string | null): TranslationKey | null {
  if (!quality) return null
  return QUALITY_LABEL_KEYS[quality] ?? null
}

export const SLOT_ORDER = [
  "HEAD", "NECK", "SHOULDER", "BACK", "CHEST",
  "WRIST", "HANDS", "WAIST", "LEGS", "FEET",
  "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2",
  "MAIN_HAND", "OFF_HAND",
]

export const SLOT_NAMES: Record<string, string> = {
  HEAD: "Kopf", NECK: "Hals", SHOULDER: "Schultern", BACK: "Umhang",
  CHEST: "Brust", WRIST: "Handgelenke", HANDS: "Hände", WAIST: "Taille",
  LEGS: "Beine", FEET: "Füße", FINGER_1: "Ring 1", FINGER_2: "Ring 2",
  TRINKET_1: "Schmuckstück 1", TRINKET_2: "Schmuckstück 2",
  MAIN_HAND: "Haupthand", OFF_HAND: "Nebenhand",
}
