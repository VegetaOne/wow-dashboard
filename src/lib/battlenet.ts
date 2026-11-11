/**
 * Battle.net API Client für WoW Forever.
 * Alle Requests laufen server-seitig (Token verlässt nie das Backend).
 *
 * Seit 2026-11-11 kennt die App nur noch WoW Forever. Retail, Classic und
 * Classic Era sind entfernt – siehe `docs/reihenfolge.md`.
 *
 * **Die Forever-API ist von Blizzard nicht dokumentiert.** Alles hier stammt
 * aus Community-Tests (Stand 2026-11-11, Quellen in `docs/roadmap.md`) und
 * kann sich ohne Ankündigung ändern. Darum liegen alle Namespaces und
 * Pfadmuster an dieser einen Stelle, und Fehler tragen ihren HTTP-Status,
 * damit die Ansichten ein 404 („noch keine Daten") von einem echten Fehler
 * unterscheiden können.
 *
 * Was Forever anders adressiert als Retail und Classic:
 * - Charaktere haben **keinen Realm**, sondern Vor- und Nachnamen, pro
 *   Region eindeutig. Der Pfad ist `/profile/wow/character/{name}-{surname}`.
 * - Gilden haben ebenfalls keinen Realm: `/data/wow/guild/{guild-slug}`.
 * - Statt Realms gibt es Rulesets (PvP, Normal, Rollenspiel, …).
 */

import { apiBase, locale, region } from "./runtime"
import type { TranslationKey } from "./i18n"

/** Wie viele Charakter-Requests parallel laufen dürfen (Rate-Limit-Schutz) */
const CONCURRENCY = 8

// ─── Namespaces ───────────────────────────────────────────────────────────────

/** Anzeigename des Spiels – steht über dem Charakterkopf. */
export const GAME_LABEL = "WoW Forever"

export type NamespaceKind = "profile" | "static" | "dynamic"

/**
 * Gelernte Static-Namespaces je Region.
 *
 * Vor dem Start lieferte der unversionierte Name `static-forever-{region}`
 * ein 403; nur die versionierte Form (`static-1.60.1_70399-forever-eu`)
 * antwortete. Seit dem Start geht auch die unversionierte. Damit ein
 * Rückfall nicht wieder alle Tooltips leert, wird die versionierte Form aus
 * den Verweisen des Account-Profils gelernt (`playable_class.key.href`) und
 * bei einem 403 der unversionierten Form benutzt – nie hart verdrahtet.
 *
 * Bewusst je Region: ein Wechsel der Region darf keinen Namespace der alten
 * Region weiterverwenden.
 */
const learnedStatic: Map<string, string> = (() => {
  // Über globalThis, damit jede Seite und Route dieselbe gelernte Version
  // sieht – Next bündelt dieses Modul je Einstiegspunkt einzeln (siehe
  // `config-cache.ts`).
  const key = Symbol.for("wow-dashboard.learned-static")
  const g = globalThis as unknown as Record<symbol, Map<string, string> | undefined>
  return (g[key] ??= new Map<string, string>())
})()

/**
 * Namespace für eine Datenart. Als Funktion, nicht als Konstante: die Region
 * steht in der Datenbank und kann sich zur Laufzeit ändern.
 */
export function namespace(kind: NamespaceKind): string {
  return `${kind}-forever-${region()}`
}

/** Versionierter Static-Namespace, wenn einer gelernt wurde. */
function learnedStaticNamespace(): string | null {
  return learnedStatic.get(region()) ?? null
}

/**
 * Static-Namespace aus einem API-Verweis lernen. Erwartet eine URL mit
 * `namespace=static-…-forever-{region}` – alles andere wird ignoriert.
 */
export function learnStaticNamespace(href: string | undefined | null): void {
  if (!href) return
  try {
    const ns = new URL(href).searchParams.get("namespace")
    const current = region()
    if (ns && ns.startsWith("static-") && ns.endsWith(`-forever-${current}`)) {
      learnedStatic.set(current, ns)
    }
  } catch {
    // Kein gültiger Verweis – nichts zu lernen
  }
}

// ─── Charakter-Adressierung ───────────────────────────────────────────────────

/**
 * Slug eines Forever-Charakters: `{name}-{surname}`, klein geschrieben.
 * Umlaute und Akzente bleiben – die URL-Kodierung übernimmt `characterPath`.
 */
export function characterSlug(name: string, surname: string): string {
  return `${name.trim()}-${surname.trim()}`.toLowerCase()
}

/**
 * Slug aus dem `character.href` des Account-Profils lesen. Das ist die
 * verlässlichste Quelle: Blizzard baut den Verweis selbst, wir müssen die
 * Schreibweise nicht nachbilden.
 */
export function slugFromHref(href: string | undefined | null): string | null {
  if (!href) return null
  try {
    const path = new URL(href).pathname
    const match = path.match(/\/profile\/wow\/character\/([^/]+)$/)
    return match ? decodeURIComponent(match[1]).toLowerCase() : null
  } catch {
    return null
  }
}

/**
 * Ein Slug, wie er aus der URL kommt, prüfen. Forever-Slugs enthalten immer
 * einen Bindestrich zwischen Vor- und Nachnamen; ohne ihn ist es kein
 * Forever-Charakter (etwa ein alter Link aus Retail-Zeiten).
 */
export function isCharacterSlug(slug: string): boolean {
  return /^[^/\s]+-[^/\s]+$/.test(slug)
}

/** Profilpfad eines Charakters, optional mit Unterpfad. */
export function characterPath(slug: string, sub?: string): string {
  const base = `/profile/wow/character/${encodeURIComponent(slug.toLowerCase())}`
  return sub ? `${base}/${sub}` : base
}

/** Anzeigename aus dem Slug, wenn die API keinen liefert: „anduin-wrynn" → „Anduin Wrynn". */
export function displayNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/**
 * Slots, die verzaubert werden können. Für Forever noch nicht belegt –
 * deshalb leer: lieber keine Warnung „fehlende Verzauberung" als eine
 * erfundene. Wird gefüllt, sobald mit echten Daten geprüft ist, welche Slots
 * Verzauberungen tragen.
 */
export const ENCHANTABLE_SLOTS: string[] = []

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
  /** `{name}-{surname}`, klein – die Adresse des Charakters */
  slug: string
  name: string
  /** Nachname. `null`, wenn die API keinen liefert */
  surname: string | null
  level: number
  faction: { type: "ALLIANCE" | "HORDE"; name: string }
  playable_class: { id: number; name: string }
  playable_race: { id: number; name: string }
  gender: { type: string; name: string }
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
  /** Nicht jeder Gegenstand führt eine Stufe */
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
  character?: { name?: string }
  equipped_items?: EquipmentSlot[]
}

// ─── Fehler ───────────────────────────────────────────────────────────────────

/**
 * Fehler einer Battle.net-Anfrage, mit HTTP-Status.
 *
 * Der Status ist der Punkt: bei Forever heisst ein 404 oft „noch keine
 * Daten" (Charakter unter Stufe 10, noch nie ausgeloggt, Bild noch nicht
 * gerendert) und nicht „kaputt". Siehe `isNotFound`.
 */
export class BnetError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly ns: string
  ) {
    super(`Battle.net ${status} (${ns}): ${path}`)
    this.name = "BnetError"
  }
}

/** true, wenn der Fehler ein 404 der API ist – also „keine Daten", nicht „Fehler". */
export function isNotFound(error: unknown): boolean {
  return error instanceof BnetError && error.status === 404
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

async function rawFetch<T>(
  path: string,
  token: string,
  ns: string,
  revalidate: number
): Promise<T> {
  const url = new URL(`${apiBase()}${path}`)
  url.searchParams.set("namespace", ns)
  url.searchParams.set("locale", locale())

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate },
  })

  if (!res.ok) throw new BnetError(res.status, path, ns)
  return res.json() as Promise<T>
}

/**
 * Eine Anfrage an die Forever-API. Alle Module gehen hierüber, damit
 * Namespace, Locale und Fehlerform an einer Stelle stehen.
 *
 * Für Static-Daten: antwortet die unversionierte Form mit 403 und ist eine
 * versionierte gelernt, wird einmal mit dieser wiederholt.
 */
export async function bnetGet<T>(
  path: string,
  token: string,
  kind: NamespaceKind,
  revalidate = 300
): Promise<T> {
  try {
    return await rawFetch<T>(path, token, namespace(kind), revalidate)
  } catch (error) {
    const fallback = kind === "static" ? learnedStaticNamespace() : null
    if (fallback && error instanceof BnetError && error.status === 403) {
      return rawFetch<T>(path, token, fallback, revalidate)
    }
    throw error
  }
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

/**
 * Eintrag der Account-Liste, so tolerant gelesen wie möglich. Laut
 * Community-Tests trägt er `name`, `surname`, Klasse, Volk, Fraktion, Stufe
 * und einen `character.href` – aber keinen Realm.
 */
interface RawAccountCharacter {
  id?: number
  name?: string
  surname?: string
  character?: { href?: string }
  level?: number
  faction?: { type?: string; name?: string }
  playable_class?: { id?: number; name?: string; key?: { href?: string } }
  playable_race?: { id?: number; name?: string; key?: { href?: string } }
  gender?: { type?: string; name?: string }
}

/** Slug eines Account-Eintrags: zuerst aus dem Verweis, sonst aus Vor- und Nachname. */
function accountEntrySlug(c: RawAccountCharacter): string | null {
  const fromHref = slugFromHref(c.character?.href)
  if (fromHref) return fromHref
  if (c.name && c.surname) return characterSlug(c.name, c.surname)
  return null
}

/**
 * Alle Forever-Charaktere des Accounts als flache Liste – ein einziger
 * API-Call.
 *
 * Bewusst OHNE Gegenstandsstufe und Avatar: die kosten zwei weitere Anfragen
 * pro Charakter und würden den ersten Seitenaufbau um Dutzende Requests
 * verzögern. Sie kommen über getCharacterDetails nach, wenn sie gebraucht werden.
 *
 * Die Account-Liste kann dem Charakterprofil um 20–40 Minuten nachlaufen,
 * etwa bei der Stufe. Für Stufe und Ausrüstung gilt darum das Profil.
 */
export async function getCharacters(
  token: string,
  favoriteSlugs: Set<string>
): Promise<WoWCharacter[]> {
  const data = await bnetGet<{
    wow_accounts?: { characters?: RawAccountCharacter[] }[]
  }>("/profile/user/wow", token, "profile")

  const raw = (data.wow_accounts ?? []).flatMap((acc) => acc.characters ?? [])

  const characters: WoWCharacter[] = []
  for (const c of raw) {
    // Nebenbei die versionierte Static-Namespace lernen – siehe oben
    learnStaticNamespace(c.playable_class?.key?.href ?? c.playable_race?.key?.href)

    const slug = accountEntrySlug(c)
    if (!slug || !c.name) continue

    characters.push({
      id: typeof c.id === "number" ? c.id : 0,
      slug,
      name: c.name,
      surname: c.surname ?? null,
      level: typeof c.level === "number" ? c.level : 0,
      faction: {
        type: c.faction?.type === "HORDE" ? "HORDE" : "ALLIANCE",
        name: c.faction?.name ?? "",
      },
      playable_class: {
        id: c.playable_class?.id ?? 0,
        name: c.playable_class?.name ?? "",
      },
      playable_race: {
        id: c.playable_race?.id ?? 0,
        name: c.playable_race?.name ?? "",
      },
      gender: { type: c.gender?.type ?? "", name: c.gender?.name ?? "" },
      isFavorite: favoriteSlugs.has(slug),
    })
  }

  return characters.sort(
    (a, b) => b.level - a.level || a.name.localeCompare(b.name)
  )
}

export interface CharacterDetails {
  equippedItemLevel?: number
  averageItemLevel?: number
  avatarUrl?: string | null
}

/** Gegenstandsstufe eines Charakters – fehlt sie, bleibt sie leer. */
async function fetchProfileDetails(
  slug: string,
  token: string
): Promise<{ averageItemLevel?: number; equippedItemLevel?: number }> {
  try {
    const data = await bnetGet<{
      average_item_level?: number
      equipped_item_level?: number
    }>(characterPath(slug), token, "profile")
    return {
      averageItemLevel: data.average_item_level,
      equippedItemLevel: data.equipped_item_level,
    }
  } catch {
    return {}
  }
}

/** Avatar-URL eines Charakters */
async function fetchAvatar(slug: string, token: string): Promise<string | null> {
  try {
    const data = await bnetGet<{ assets?: { key: string; value: string }[] }>(
      characterPath(slug, "character-media"),
      token,
      "profile"
    )
    return data.assets?.find((a) => a.key === "avatar")?.value ?? null
  } catch {
    return null
  }
}

/**
 * Gegenstandsstufe und Avatar für eine begrenzte Auswahl an Charakteren,
 * je Slug. Wird vom Client nur für die Abschnitte angefragt, die er zeigt.
 *
 * Ob Forever eine Gegenstandsstufe im Profil führt, ist nicht belegt – fehlt
 * sie, bleibt das Feld leer und die Oberfläche zeigt „—".
 */
export async function getCharacterDetails(
  slugs: string[],
  token: string
): Promise<Record<string, CharacterDetails>> {
  const results = await mapLimit(slugs, CONCURRENCY, async (slug) => {
    try {
      const [details, avatarUrl] = await Promise.all([
        fetchProfileDetails(slug, token),
        fetchAvatar(slug, token),
      ])
      return [slug, { ...details, avatarUrl }] as const
    } catch {
      return [slug, {} as CharacterDetails] as const
    }
  })

  const map: Record<string, CharacterDetails> = {}
  for (const [slug, value] of results) map[slug] = value
  return map
}

// ─── Charakterprofil und Ausrüstung ───────────────────────────────────────────

export function getCharacterEquipment(
  slug: string,
  token: string
): Promise<CharacterEquipment> {
  return bnetGet<CharacterEquipment>(characterPath(slug, "equipment"), token, "profile")
}

/** Was die Kopfzeile eines Charakters aus dem Profil braucht. */
export interface CharacterProfileData {
  name?: string
  surname?: string
  level?: number
  /** Name des Rulesets (PvP, Normal, Rollenspiel …) statt eines Realms */
  rulesetName?: string
  rulesetId?: number
  averageItemLevel?: number
  equippedItemLevel?: number
  /** Klasse – für die Talentbäume; ältere Snapshots haben sie nicht */
  classId?: number
  className?: string
}

/**
 * Charakterprofil. Laut Community-Tests führt es `surname` und `ruleset`
 * statt eines Realms; die Form von `ruleset` ist nicht belegt und wird
 * tolerant gelesen.
 */
export async function getCharacterProfile(
  slug: string,
  token: string
): Promise<CharacterProfileData> {
  const data = await bnetGet<{
    name?: string
    surname?: string
    level?: number
    ruleset?: { id?: number; name?: string; type?: string }
    average_item_level?: number
    equipped_item_level?: number
    character_class?: { id?: number; name?: string }
  }>(characterPath(slug), token, "profile")

  return {
    name: data.name,
    surname: data.surname,
    level: data.level,
    rulesetName: data.ruleset?.name ?? data.ruleset?.type,
    rulesetId: data.ruleset?.id,
    averageItemLevel: data.average_item_level,
    equippedItemLevel: data.equipped_item_level,
    classId: data.character_class?.id,
    className: data.character_class?.name,
  }
}

/** Eine Woche – Item-Icons ändern sich praktisch nie. */
const STATIC_REVALIDATE = 60 * 60 * 24 * 7

/**
 * Icon-URLs zu Gegenstands-IDs.
 * Fehlende Icons werden ausgelassen statt zu werfen – ein Icon ist kein
 * Grund, die ganze Ausrüstungsseite scheitern zu lassen. Bei Forever fehlen
 * für ältere Gegenstände häufig die Stammdaten (siehe `docs/roadmap.md`).
 */
export async function getItemIcons(
  itemIds: number[],
  token: string
): Promise<Record<number, string>> {
  const unique = Array.from(new Set(itemIds.filter((id) => id > 0)))

  const results = await mapLimit(unique, CONCURRENCY, async (id) => {
    try {
      const data = await bnetGet<{ assets?: { key: string; value: string }[] }>(
        `/data/wow/media/item/${id}`,
        token,
        "static",
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
 * Der Aufrufer erkennt fehlende Stammdaten daran, dass die ID in der
 * Antwort fehlt.
 */
export async function getItemDetails(
  itemIds: number[],
  token: string
): Promise<Record<number, ItemDetails>> {
  const unique = Array.from(new Set(itemIds.filter((id) => id > 0)))

  const results = await mapLimit(unique, CONCURRENCY, async (id) => {
    try {
      const data = await bnetGet<{
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
      }>(`/data/wow/item/${id}`, token, "static", STATIC_REVALIDATE)

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
          name: data.name ?? `#${id}`,
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
function characterEndpoint(
  slug: string,
  sub: string,
  token: string
): Promise<unknown> {
  return bnetGet<unknown>(characterPath(slug, sub), token, "profile")
}

export function getCharacterRaids(slug: string, token: string): Promise<unknown> {
  return characterEndpoint(slug, "encounters/raids", token)
}

export function getCharacterDungeons(slug: string, token: string): Promise<unknown> {
  return characterEndpoint(slug, "encounters/dungeons", token)
}

/** Rohantwort des professions-Endpunkts – Auswertung in professions.ts */
export function getCharacterProfessions(slug: string, token: string): Promise<unknown> {
  return characterEndpoint(slug, "professions", token)
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
 * Bilder eines Charakters. Bei Forever fehlen sie eine Weile, nachdem ein
 * Charakter zum ersten Mal auftaucht (404) – in dem Fall kommen überall
 * null zurück statt eines Fehlers.
 */
export async function getCharacterMedia(
  slug: string,
  token: string
): Promise<CharacterMedia> {
  const empty: CharacterMedia = { avatar: null, inset: null, main: null }

  try {
    const data = await bnetGet<{ assets?: { key: string; value: string }[] }>(
      characterPath(slug, "character-media"),
      token,
      "profile"
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
 * Tabelle in EquipmentPanel, ItemTooltip und dem früheren CandidateTooltip. Ein
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

/**
 * Wörterbuchschlüssel je Slot. Früher eine Tabelle fester deutscher Namen
 * (`SLOT_NAMES`) – die blieb auch nach dem Umschalten auf Englisch deutsch.
 */
const SLOT_LABEL_KEYS: Record<string, TranslationKey> = {
  HEAD: "equipment.slot.head", NECK: "equipment.slot.neck",
  SHOULDER: "equipment.slot.shoulder", BACK: "equipment.slot.back",
  CHEST: "equipment.slot.chest", WRIST: "equipment.slot.wrist",
  HANDS: "equipment.slot.hands", WAIST: "equipment.slot.waist",
  LEGS: "equipment.slot.legs", FEET: "equipment.slot.feet",
  FINGER_1: "equipment.slot.finger1", FINGER_2: "equipment.slot.finger2",
  TRINKET_1: "equipment.slot.trinket1", TRINKET_2: "equipment.slot.trinket2",
  MAIN_HAND: "equipment.slot.mainHand", OFF_HAND: "equipment.slot.offHand",
}

/** Schlüssel zum Slot-Typ der API; `null` für unbekannte Slots (dann Rohwert zeigen). */
export function slotLabelKey(slotType: string): TranslationKey | null {
  return SLOT_LABEL_KEYS[slotType] ?? null
}
