/**
 * Sammlungen: Reittiere, Begleiter, Spielzeug, Titel.
 *
 * Reittiere und Begleiter hängen am **Account**, nicht am Charakter –
 * die API hat dafür eigene Endpunkte unter /profile/user/wow/collections.
 * Spielzeug und Titel kommen je Charakter.
 *
 * Die Fehlliste ist hier billig: `/data/wow/mount/index` liefert alle
 * Reittiere in *einer* Antwort. Kein Durchlauf wie beim Loot-Index nötig.
 */

import { bnetGet, characterPath } from "./battlenet"
import type { TranslationKey } from "./i18n"

const STATIC_REVALIDATE = 60 * 60 * 24 * 7

// ─── Gemeinsame Form ──────────────────────────────────────────────────────────

export interface CollectibleEntry {
  id: number
  name: string
  /** false bei Reittieren, die gesammelt aber nicht nutzbar sind */
  usable?: boolean
}

export interface CollectionView {
  labelKey: TranslationKey
  collected: CollectibleEntry[]
  /** Alle bekannten Objekte – leer, wenn die Stammdaten fehlen */
  all: CollectibleEntry[]
  /** Nicht gesammelt. Leer, wenn `all` leer ist – dann ist keine Aussage möglich */
  missing: CollectibleEntry[]
  /** true, wenn wir die Gesamtmenge kennen und damit rechnen dürfen */
  hasTotal: boolean
}

function buildView(
  labelKey: TranslationKey,
  collected: CollectibleEntry[],
  all: CollectibleEntry[]
): CollectionView {
  const owned = new Set(collected.map((c) => c.id))
  const missing = all.filter((a) => !owned.has(a.id))

  return {
    labelKey,
    collected: [...collected].sort((a, b) => a.name.localeCompare(b.name)),
    all,
    missing: missing.sort((a, b) => a.name.localeCompare(b.name)),
    hasTotal: all.length > 0,
  }
}

// ─── Rohformen ────────────────────────────────────────────────────────────────

export interface RawMountCollection {
  mounts?: { mount?: { id?: number; name?: string }; is_useable?: boolean }[]
}

export interface RawPetCollection {
  pets?: { species?: { id?: number; name?: string } }[]
}

export interface RawToyCollection {
  toys?: { toy?: { id?: number; name?: string } }[]
}

export interface RawTitleCollection {
  active_title?: { id?: number; name?: string }
  titles?: { id?: number; name?: string }[]
}

interface RawIndex {
  mounts?: { id?: number; name?: string }[]
  pets?: { id?: number; name?: string }[]
  toys?: { id?: number; name?: string }[]
}

// ─── Auswertung ───────────────────────────────────────────────────────────────

/**
 * Fehlt der Name, steht die ID mit `#` – sprachneutral. Früher „Reittier 123",
 * das blieb nach dem Umschalten auf Englisch deutsch.
 */
function entry(id: unknown, name: unknown): CollectibleEntry | null {
  if (typeof id !== "number") return null
  return { id, name: typeof name === "string" ? name : `#${id}` }
}

export function parseMounts(
  raw: RawMountCollection | null,
  index: RawIndex | null
): CollectionView {
  const collected = (raw?.mounts ?? [])
    .map((m): CollectibleEntry | null => {
      const e = entry(m.mount?.id, m.mount?.name)
      return e ? { ...e, usable: m.is_useable !== false } : null
    })
    .filter((e): e is CollectibleEntry => e !== null)

  const all = (index?.mounts ?? [])
    .map((m) => entry(m.id, m.name))
    .filter((e): e is CollectibleEntry => e !== null)

  return buildView("collections.mounts", collected, all)
}

export function parsePets(
  raw: RawPetCollection | null,
  index: RawIndex | null
): CollectionView {
  // Dasselbe Haustier kann mehrfach im Besitz sein – nach Art entdoppeln
  const seen = new Set<number>()
  const collected: CollectibleEntry[] = []

  for (const p of raw?.pets ?? []) {
    const e = entry(p.species?.id, p.species?.name)
    if (e && !seen.has(e.id)) {
      seen.add(e.id)
      collected.push(e)
    }
  }

  const all = (index?.pets ?? [])
    .map((p) => entry(p.id, p.name))
    .filter((e): e is CollectibleEntry => e !== null)

  return buildView("collections.pets", collected, all)
}

export function parseToys(
  raw: RawToyCollection | null,
  index: RawIndex | null
): CollectionView {
  const collected = (raw?.toys ?? [])
    .map((t) => entry(t.toy?.id, t.toy?.name))
    .filter((e): e is CollectibleEntry => e !== null)

  const all = (index?.toys ?? [])
    .map((t) => entry(t.id, t.name))
    .filter((e): e is CollectibleEntry => e !== null)

  return buildView("collections.toys", collected, all)
}

export interface TitleView {
  activeTitleId: number | null
  titles: CollectibleEntry[]
}

/**
 * Titel. Die API liefert Namen mit `%s` als Platzhalter für den
 * Charakternamen ("%s der Erforscher") – der wird hier eingesetzt.
 */
export function parseTitles(
  raw: RawTitleCollection | null,
  characterName: string
): TitleView {
  const titles = (raw?.titles ?? [])
    .map((t) => entry(t.id, t.name))
    .filter((e): e is CollectibleEntry => e !== null)
    .map((t) => ({ ...t, name: formatTitle(t.name, characterName) }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    activeTitleId:
      typeof raw?.active_title?.id === "number" ? raw.active_title.id : null,
    titles,
  }
}

export function formatTitle(template: string, characterName: string): string {
  const name = characterName.charAt(0).toUpperCase() + characterName.slice(1)
  return template.replace(/%s/g, name).trim()
}

// ─── Stammdaten-Indizes ───────────────────────────────────────────────────────

/**
 * Stammdaten-Index. `null` statt Fehler: ohne Index gibt es nur keine
 * Fehlliste. Für Forever ist nicht belegt, dass diese Indizes liefern –
 * siehe „Gestrichen bis bestätigt" in `docs/roadmap.md`.
 */
async function staticIndex(path: string, token: string): Promise<RawIndex | null> {
  try {
    return await bnetGet<RawIndex>(path, token, "static", STATIC_REVALIDATE)
  } catch {
    return null
  }
}

/** Alle Reittiere – eine Antwort, eine Woche gecacht. */
export function getMountIndex(token: string) {
  return staticIndex("/data/wow/mount/index", token)
}

export function getPetIndex(token: string) {
  return staticIndex("/data/wow/pet/index", token)
}

export function getToyIndex(token: string) {
  return staticIndex("/data/wow/toy/index", token)
}

// ─── Sammlungs-Abrufe ─────────────────────────────────────────────────────────

function profileFetch<T>(path: string, token: string): Promise<T> {
  return bnetGet<T>(path, token, "profile", 900)
}

/** Account-weite Reittiere. */
export function fetchAccountMounts(token: string) {
  return profileFetch<RawMountCollection>("/profile/user/wow/collections/mounts", token)
}

/** Account-weite Begleiter. */
export function fetchAccountPets(token: string) {
  return profileFetch<RawPetCollection>("/profile/user/wow/collections/pets", token)
}

export function fetchCharacterToys(slug: string, token: string) {
  return profileFetch<RawToyCollection>(characterPath(slug, "collections/toys"), token)
}

export function fetchCharacterTitles(slug: string, token: string) {
  return profileFetch<RawTitleCollection>(characterPath(slug, "titles"), token)
}
