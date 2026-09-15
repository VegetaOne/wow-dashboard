/**
 * Berufe.
 *
 * Die API-Form unterscheidet sich zwischen Retail und Classic:
 *
 * - Retail schachtelt je Beruf mehrere `tiers` (eine Fertigkeitsstufe pro
 *   Erweiterung), jede mit eigenen Punkten und bekannten Rezepten.
 * - Die Classic-Namespaces liefern die Punkte oft direkt am Beruf, ohne
 *   `tiers`-Ebene.
 *
 * Beides wird hier auf eine gemeinsame Form gebracht. Fehlende Felder
 * führen zu `null`, nicht zu einem Absturz – bei dieser API habe ich
 * gelernt, keine Struktur vorauszusetzen.
 */

import { GAME_MODES, type GameMode } from "./battlenet"

const REGION = process.env.BNET_REGION || "eu"
const API_BASE = `https://${REGION}.api.blizzard.com`
const LOCALE = "de_DE"
const STATIC_REVALIDATE = 60 * 60 * 24 * 7

// ─── Gemeinsame Form ──────────────────────────────────────────────────────────

export interface KnownRecipe {
  id: number
  name: string
}

export interface ProfessionTierView {
  tierId: number
  tierName: string
  skillPoints: number | null
  maxSkillPoints: number | null
  knownRecipes: KnownRecipe[]
  /** false, wenn die Stufe nur aus Beruf-Werten erzeugt wurde (Classic) */
  isRealTier: boolean
}

export interface ProfessionView {
  professionId: number
  professionName: string
  kind: "primary" | "secondary"
  tiers: ProfessionTierView[]
}

// ─── Rohform, absichtlich durchgehend optional ───────────────────────────────

interface RawRecipe {
  id?: number
  name?: string
}

interface RawTier {
  skill_points?: number
  max_skill_points?: number
  tier?: { id?: number; name?: string }
  known_recipes?: RawRecipe[]
}

interface RawProfessionEntry {
  profession?: { id?: number; name?: string }
  /** Retail */
  tiers?: RawTier[]
  /** Classic: direkt am Beruf */
  skill_points?: number
  max_skill_points?: number
  known_recipes?: RawRecipe[]
}

export interface RawProfessions {
  primaries?: RawProfessionEntry[]
  secondaries?: RawProfessionEntry[]
}

// ─── Auswertung ───────────────────────────────────────────────────────────────

function parseRecipes(raw: RawRecipe[] | undefined): KnownRecipe[] {
  return (raw ?? [])
    .filter((r): r is { id: number; name?: string } => typeof r?.id === "number")
    .map((r) => ({ id: r.id, name: r.name ?? `Rezept ${r.id}` }))
}

function parseEntry(
  entry: RawProfessionEntry,
  kind: "primary" | "secondary"
): ProfessionView | null {
  const professionId = entry.profession?.id
  if (typeof professionId !== "number") return null

  const professionName = entry.profession?.name ?? `Beruf ${professionId}`

  // Retail: echte Fertigkeitsstufen
  if (Array.isArray(entry.tiers) && entry.tiers.length > 0) {
    const tiers = entry.tiers
      .map((t): ProfessionTierView | null => {
        const tierId = t.tier?.id
        if (typeof tierId !== "number") return null
        return {
          tierId,
          tierName: t.tier?.name ?? `Stufe ${tierId}`,
          skillPoints: typeof t.skill_points === "number" ? t.skill_points : null,
          maxSkillPoints:
            typeof t.max_skill_points === "number" ? t.max_skill_points : null,
          knownRecipes: parseRecipes(t.known_recipes),
          isRealTier: true,
        }
      })
      .filter((t): t is ProfessionTierView => t !== null)
      // Neueste Erweiterung zuerst – die ist praktisch immer die relevante
      .sort((a, b) => b.tierId - a.tierId)

    return { professionId, professionName, kind, tiers }
  }

  // Classic: Punkte hängen am Beruf, keine Stufen-Ebene.
  // Eine künstliche Stufe erzeugen, damit die Oberfläche einheitlich bleibt.
  const hasFlatPoints =
    typeof entry.skill_points === "number" ||
    typeof entry.max_skill_points === "number"

  if (hasFlatPoints || (entry.known_recipes?.length ?? 0) > 0) {
    return {
      professionId,
      professionName,
      kind,
      tiers: [
        {
          tierId: professionId,
          tierName: professionName,
          skillPoints:
            typeof entry.skill_points === "number" ? entry.skill_points : null,
          maxSkillPoints:
            typeof entry.max_skill_points === "number"
              ? entry.max_skill_points
              : null,
          knownRecipes: parseRecipes(entry.known_recipes),
          isRealTier: false,
        },
      ],
    }
  }

  // Beruf bekannt, aber ohne jede Angabe – trotzdem zeigen
  return { professionId, professionName, kind, tiers: [] }
}

/** Rohantwort auf die gemeinsame Form bringen. */
export function parseProfessions(raw: RawProfessions | null): ProfessionView[] {
  if (!raw) return []

  const primaries = (raw.primaries ?? [])
    .map((e) => parseEntry(e, "primary"))
    .filter((p): p is ProfessionView => p !== null)

  const secondaries = (raw.secondaries ?? [])
    .map((e) => parseEntry(e, "secondary"))
    .filter((p): p is ProfessionView => p !== null)

  return [...primaries, ...secondaries]
}

/** Summe über alle Stufen – für die Kopfzeile eines Berufs. */
export function totalRecipes(profession: ProfessionView): number {
  return profession.tiers.reduce((sum, t) => sum + t.knownRecipes.length, 0)
}

// ─── Rezept-Stammdaten je Fertigkeitsstufe ───────────────────────────────────

export interface TierCatalog {
  tierId: number
  tierName: string
  /** Alle Rezepte der Stufe, nach Kategorie gruppiert */
  categories: { name: string; recipes: KnownRecipe[] }[]
  totalRecipes: number
}

/**
 * Alle Rezepte einer Fertigkeitsstufe – Grundlage für die Fehlliste.
 *
 * Wird nur auf Anforderung geladen: pro Stufe ein Aufruf, und die Antwort
 * ist umfangreich. Eine Woche gecacht, weil Stammdaten sich nicht ändern.
 */
export async function getTierCatalog(
  professionId: number,
  tierId: number,
  token: string,
  mode: GameMode
): Promise<TierCatalog | null> {
  const config = GAME_MODES.find((m) => m.id === mode) ?? GAME_MODES[0]
  const url = new URL(
    `${API_BASE}/data/wow/profession/${professionId}/skill-tier/${tierId}`
  )
  url.searchParams.set("namespace", config.staticNamespace)
  url.searchParams.set("locale", LOCALE)

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: STATIC_REVALIDATE },
    })
    if (!res.ok) return null

    const data = (await res.json()) as {
      id?: number
      name?: string
      categories?: { name?: string; recipes?: RawRecipe[] }[]
    }

    const categories = (data.categories ?? [])
      .map((c) => ({
        name: c.name ?? "Ohne Kategorie",
        recipes: parseRecipes(c.recipes),
      }))
      .filter((c) => c.recipes.length > 0)

    return {
      tierId,
      tierName: data.name ?? `Stufe ${tierId}`,
      categories,
      totalRecipes: categories.reduce((sum, c) => sum + c.recipes.length, 0),
    }
  } catch {
    return null
  }
}
