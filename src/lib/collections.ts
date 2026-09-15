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

import { GAME_MODES, type GameMode } from "./battlenet"

const REGION = process.env.BNET_REGION || "eu"
const API_BASE = `https://${REGION}.api.blizzard.com`
const LOCALE = "de_DE"
const STATIC_REVALIDATE = 60 * 60 * 24 * 7

// ─── Gemeinsame Form ──────────────────────────────────────────────────────────

export interface CollectibleEntry {
  id: number
  name: string
  /** false bei Reittieren, die gesammelt aber nicht nutzbar sind */
  usable?: boolean
}

export interface CollectionView {
  label: string
  collected: CollectibleEntry[]
  /** Alle bekannten Objekte – leer, wenn die Stammdaten fehlen */
  all: CollectibleEntry[]
  /** Nicht gesammelt. Leer, wenn `all` leer ist – dann ist keine Aussage möglich */
  missing: CollectibleEntry[]
  /** true, wenn wir die Gesamtmenge kennen und damit rechnen dürfen */
  hasTotal: boolean
}

function buildView(
  label: string,
  collected: CollectibleEntry[],
  all: CollectibleEntry[]
): CollectionView {
  const owned = new Set(collected.map((c) => c.id))
  const missing = all.filter((a) => !owned.has(a.id))

  return {
    label,
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

function entry(id: unknown, name: unknown, fallback: string): CollectibleEntry | null {
  if (typeof id !== "number") return null
  return { id, name: typeof name === "string" ? name : `${fallback} ${id}` }
}

export function parseMounts(
  raw: RawMountCollection | null,
  index: RawIndex | null
): CollectionView {
  const collected = (raw?.mounts ?? [])
    .map((m): CollectibleEntry | null => {
      const e = entry(m.mount?.id, m.mount?.name, "Reittier")
      return e ? { ...e, usable: m.is_useable !== false } : null
    })
    .filter((e): e is CollectibleEntry => e !== null)

  const all = (index?.mounts ?? [])
    .map((m) => entry(m.id, m.name, "Reittier"))
    .filter((e): e is CollectibleEntry => e !== null)

  return buildView("Reittiere", collected, all)
}

export function parsePets(
  raw: RawPetCollection | null,
  index: RawIndex | null
): CollectionView {
  // Dasselbe Haustier kann mehrfach im Besitz sein – nach Art entdoppeln
  const seen = new Set<number>()
  const collected: CollectibleEntry[] = []

  for (const p of raw?.pets ?? []) {
    const e = entry(p.species?.id, p.species?.name, "Begleiter")
    if (e && !seen.has(e.id)) {
      seen.add(e.id)
      collected.push(e)
    }
  }

  const all = (index?.pets ?? [])
    .map((p) => entry(p.id, p.name, "Begleiter"))
    .filter((e): e is CollectibleEntry => e !== null)

  return buildView("Begleiter", collected, all)
}

export function parseToys(
  raw: RawToyCollection | null,
  index: RawIndex | null
): CollectionView {
  const collected = (raw?.toys ?? [])
    .map((t) => entry(t.toy?.id, t.toy?.name, "Spielzeug"))
    .filter((e): e is CollectibleEntry => e !== null)

  const all = (index?.toys ?? [])
    .map((t) => entry(t.id, t.name, "Spielzeug"))
    .filter((e): e is CollectibleEntry => e !== null)

  return buildView("Spielzeug", collected, all)
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
    .map((t) => entry(t.id, t.name, "Titel"))
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

async function staticIndex(
  path: string,
  token: string,
  mode: GameMode
): Promise<RawIndex | null> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(`${API_BASE}${path}`)
  url.searchParams.set("namespace", config.staticNamespace)
  url.searchParams.set("locale", LOCALE)

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: STATIC_REVALIDATE },
    })
    if (!res.ok) return null
    return (await res.json()) as RawIndex
  } catch {
    return null
  }
}

/** Alle Reittiere – eine Antwort, eine Woche gecacht. */
export function getMountIndex(token: string, mode: GameMode = "retail") {
  return staticIndex("/data/wow/mount/index", token, mode)
}

export function getPetIndex(token: string, mode: GameMode = "retail") {
  return staticIndex("/data/wow/pet/index", token, mode)
}

export function getToyIndex(token: string, mode: GameMode = "retail") {
  return staticIndex("/data/wow/toy/index", token, mode)
}

// ─── Sammlungs-Abrufe ─────────────────────────────────────────────────────────

async function profileFetch<T>(
  path: string,
  token: string,
  mode: GameMode
): Promise<T> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(`${API_BASE}${path}`)
  url.searchParams.set("namespace", config.namespace)
  url.searchParams.set("locale", LOCALE)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 900 },
  })
  if (!res.ok) throw new Error(`Sammlungen ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/** Account-weite Reittiere. */
export function fetchAccountMounts(token: string, mode: GameMode = "retail") {
  return profileFetch<RawMountCollection>(
    "/profile/user/wow/collections/mounts",
    token,
    mode
  )
}

/** Account-weite Begleiter. */
export function fetchAccountPets(token: string, mode: GameMode = "retail") {
  return profileFetch<RawPetCollection>(
    "/profile/user/wow/collections/pets",
    token,
    mode
  )
}

export function fetchCharacterToys(
  realm: string,
  name: string,
  token: string,
  mode: GameMode = "retail"
) {
  return profileFetch<RawToyCollection>(
    `/profile/wow/character/${realm}/${name.toLowerCase()}/collections/toys`,
    token,
    mode
  )
}

export function fetchCharacterTitles(
  realm: string,
  name: string,
  token: string,
  mode: GameMode = "retail"
) {
  return profileFetch<RawTitleCollection>(
    `/profile/wow/character/${realm}/${name.toLowerCase()}/titles`,
    token,
    mode
  )
}
