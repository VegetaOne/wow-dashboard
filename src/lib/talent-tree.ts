/**
 * Talentbäume: Formen und Einlesen. Rein – keine Abrufe, keine Datenbank –,
 * damit Client-Komponenten es importieren dürfen und es sich testen lässt.
 * Die Abrufe stehen in `talents.ts`.
 *
 * WoW Forever (geprüft 2026-11-11, nicht dokumentiert):
 * - Je Spezialisierung ein Baum unter
 *   `/data/wow/talent-tree/{treeId}/playable-specialization/{specId}`; die drei
 *   Bäume einer Klasse teilen die `treeId`. Klassisch also drei Bäume je Klasse.
 * - Knoten in `spec_talent_nodes` mit `display_row`/`display_col` (ab 1),
 *   `ranks[]` (je Rang Talent, Zauber, Beschreibung) und `locked_by`/`unlocks`.
 * - **`locked_by` zeigt in beide Richtungen.** Zwei verbundene Knoten sperren
 *   sich laut API gegenseitig (104927 ↔ 104928 im Gleichgewichtsbaum). Als
 *   Voraussetzung gilt darum nur ein Knoten in einer **höheren** Zeile.
 * - Was ein Charakter gesetzt hat, steht in `/specializations` mit derselben
 *   Talent-ID wie in den Rängen des Baums.
 */

// ─── Formen ───────────────────────────────────────────────────────────────────

export interface TalentRank {
  rank: number
  description: string | null
}

export interface TalentNode {
  id: number
  /** Talent-ID aus den Rängen – darüber werden gesetzte Talente zugeordnet */
  talentId: number | null
  name: string
  spellId: number | null
  /** Icon-URL aus den Zauber-Medien; `null`, wenn die API keins liefert */
  icon: string | null
  /** Zeile und Spalte, ab 1 */
  row: number
  col: number
  maxRank: number
  ranks: TalentRank[]
  /** Knoten, die voll ausgebaut sein müssen, bevor dieser einen Punkt bekommt */
  requires: number[]
}

export interface TalentTree {
  treeId: number
  specId: number
  name: string
  /** Hintergrundbild des Baums; `null`, wenn die API keins liefert */
  background: string | null
  nodes: TalentNode[]
  rows: number
  cols: number
}

export interface ClassTalents {
  classId: number | null
  className: string | null
  trees: TalentTree[]
}

/** Gesetzte Ränge je Knoten-ID. Fehlt ein Knoten, ist er 0. */
export type Allocation = Record<number, number>

// ─── Rohformen der API ────────────────────────────────────────────────────────

interface RawRank {
  rank?: number
  tooltip?: {
    talent?: { id?: number; name?: string }
    spell_tooltip?: { spell?: { id?: number; name?: string }; description?: string }
  }
}

export interface RawTalentNode {
  id?: number
  ranks?: RawRank[]
  display_row?: number
  display_col?: number
  locked_by?: number[]
}

export interface RawSpecTree {
  id?: number
  name?: string
  media?: { key?: { href?: string } }
  playable_class?: { id?: number; name?: string }
  playable_specialization?: { id?: number; name?: string }
  spec_talent_nodes?: RawTalentNode[]
}

export interface RawSpecializations {
  specialization_groups?: {
    is_active?: boolean
    specializations?: {
      specialization?: { id?: number; name?: string }
      talents?: { talent?: { id?: number }; talent_rank?: number }[]
      spent_points?: number
    }[]
  }[]
}

// ─── Einlesen ─────────────────────────────────────────────────────────────────

/** Einträge des Index: `treeId` und `specId` stehen nur im `href`. */
export function parseTreeIndex(raw: {
  spec_talent_trees?: { key?: { href?: string }; name?: string }[]
} | null): { treeId: number; specId: number; name: string }[] {
  return (raw?.spec_talent_trees ?? [])
    .map((entry) => {
      const match = entry.key?.href?.match(/talent-tree\/(\d+)\/playable-specialization\/(\d+)/)
      if (!match) return null
      return { treeId: Number(match[1]), specId: Number(match[2]), name: entry.name ?? "" }
    })
    .filter((e): e is { treeId: number; specId: number; name: string } => e !== null)
}

export function parseSpecTree(raw: RawSpecTree | null, treeId: number, specId: number): TalentTree | null {
  if (!raw) return null

  const rawNodes = (raw.spec_talent_nodes ?? []).filter(
    (n): n is RawTalentNode & { id: number } => typeof n.id === "number"
  )
  const rowOf = new Map(rawNodes.map((n) => [n.id, n.display_row ?? 0]))

  const nodes: TalentNode[] = rawNodes
    .filter((n) => typeof n.display_row === "number" && typeof n.display_col === "number")
    .map((n) => {
      const ranks = (n.ranks ?? [])
        .filter((r) => typeof r.rank === "number")
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      const first = ranks[0]?.tooltip
      const row = n.display_row!
      return {
        id: n.id,
        talentId: first?.talent?.id ?? null,
        name: first?.talent?.name ?? first?.spell_tooltip?.spell?.name ?? `#${n.id}`,
        spellId: first?.spell_tooltip?.spell?.id ?? null,
        // Bilder kommen getrennt (talents.ts) – das Einlesen bleibt ohne Abruf
        icon: null,
        row,
        col: n.display_col!,
        maxRank: Math.max(1, ranks.length),
        ranks: ranks.map((r) => ({
          rank: r.rank!,
          description: r.tooltip?.spell_tooltip?.description ?? null,
        })),
        // Nur Knoten weiter oben – siehe Kopfkommentar zu `locked_by`
        requires: (n.locked_by ?? []).filter((id) => (rowOf.get(id) ?? row) < row),
      }
    })

  return {
    treeId,
    specId,
    name: raw.playable_specialization?.name ?? raw.name ?? `#${specId}`,
    background: null,
    nodes,
    rows: nodes.reduce((max, n) => Math.max(max, n.row), 0),
    cols: nodes.reduce((max, n) => Math.max(max, n.col), 0),
  }
}

/**
 * Gesetzte Ränge des Charakters, auf Knoten gelegt. Nur die aktive Gruppe –
 * eine zweite Talentverteilung (falls Forever sie kennt) kommt später.
 * Talente, die keinem Knoten zuzuordnen sind, werden gezählt statt verschluckt.
 */
export function allocationFromCharacter(
  raw: RawSpecializations | null,
  trees: TalentTree[]
): { allocation: Allocation; unmatched: number; spentByTree: Record<number, number> } {
  const byTalent = new Map<number, TalentNode>()
  for (const tree of trees) {
    for (const node of tree.nodes) {
      if (node.talentId !== null) byTalent.set(node.talentId, node)
    }
  }

  const groups = raw?.specialization_groups ?? []
  const active = groups.find((g) => g.is_active) ?? groups[0]
  const allocation: Allocation = {}
  const spentByTree: Record<number, number> = {}
  let unmatched = 0

  for (const spec of active?.specializations ?? []) {
    const specId = spec.specialization?.id
    if (typeof specId === "number" && typeof spec.spent_points === "number") {
      spentByTree[specId] = spec.spent_points
    }
    for (const entry of spec.talents ?? []) {
      const node = typeof entry.talent?.id === "number" ? byTalent.get(entry.talent.id) : undefined
      const rank = typeof entry.talent_rank === "number" ? entry.talent_rank : 0
      if (!node || rank <= 0) {
        if (rank > 0) unmatched++
        continue
      }
      allocation[node.id] = Math.min(rank, node.maxRank)
    }
  }

  return { allocation, unmatched, spentByTree }
}

/** Punkte in einem Baum nach Zuteilung. */
export function pointsInTree(tree: TalentTree, allocation: Allocation): number {
  return tree.nodes.reduce((sum, n) => sum + (allocation[n.id] ?? 0), 0)
}
