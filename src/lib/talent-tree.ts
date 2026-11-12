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
 * - **`display_col` beginnt nicht bei jedem Baum bei 1.** Die Bäume einer
 *   Klasse liegen offenbar in einem gemeinsamen Raster nebeneinander; ohne
 *   Ausgleich stand ein Baum rechts, einer links, einer mittig. Die Spalten
 *   werden darum je Baum auf 1 gesetzt. Die Zeilen bleiben, wie sie sind –
 *   sie tragen die Stufe (Punkte je Zeile).
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
  /** Zeile (Stufe, wie von der API) und Spalte (je Baum ab 1) */
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

  // Spalten je Baum ab 1 – siehe Kopfkommentar
  const minCol = nodes.reduce((min, n) => Math.min(min, n.col), Infinity)
  if (Number.isFinite(minCol)) for (const n of nodes) n.col -= minCol - 1

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

/** Ränge je Talent-ID – so speichert ein Build, so liefert das Profil. */
export type TalentRanks = Record<number, number>

/** Ein gespeicherter Build, wie Server und Oberfläche ihn austauschen. */
export interface SavedBuild {
  id: string
  classId: number
  name: string
  ranks: TalentRanks
  updatedAt: string
}

/**
 * Eine Talentverteilung des Charakters. Forever kennt zwei (Dualspec);
 * die API nennt keine Nummer, nur die Reihenfolge und `is_active`. Gezählt
 * wird darum in der Reihenfolge der Antwort ab 1 – angenommen, dass sie
 * stabil ist (für Forever nicht belegt).
 */
export interface TalentGroup {
  index: number
  active: boolean
  ranks: TalentRanks
  spentBySpec: Record<number, number>
}

export function groupsFromCharacter(raw: RawSpecializations | null): TalentGroup[] {
  return (raw?.specialization_groups ?? []).map((group, i) => {
    const ranks: TalentRanks = {}
    const spentBySpec: Record<number, number> = {}
    for (const spec of group.specializations ?? []) {
      const specId = spec.specialization?.id
      if (typeof specId === "number" && typeof spec.spent_points === "number") {
        spentBySpec[specId] = spec.spent_points
      }
      for (const entry of spec.talents ?? []) {
        const id = entry.talent?.id
        const rank = entry.talent_rank
        if (typeof id === "number" && typeof rank === "number" && rank > 0) {
          ranks[id] = Math.max(ranks[id] ?? 0, rank)
        }
      }
    }
    return { index: i + 1, active: group.is_active === true, ranks, spentBySpec }
  })
}

/**
 * Ränge je Talent-ID auf Knoten legen. Talente, die keinem Knoten zuzuordnen
 * sind, werden gezählt statt verschluckt; Ränge über dem Höchstrang gekappt.
 */
export function allocationFromRanks(
  trees: TalentTree[],
  ranks: TalentRanks
): { allocation: Allocation; unmatched: number } {
  const byTalent = new Map<number, TalentNode>()
  for (const tree of trees) {
    for (const node of tree.nodes) {
      if (node.talentId !== null) byTalent.set(node.talentId, node)
    }
  }
  const allocation: Allocation = {}
  let unmatched = 0
  for (const [key, rank] of Object.entries(ranks)) {
    if (!(rank > 0)) continue
    const node = byTalent.get(Number(key))
    if (!node) {
      unmatched++
      continue
    }
    allocation[node.id] = Math.min(rank, node.maxRank)
  }
  return { allocation, unmatched }
}

/** Umkehrung: Knoten-Ränge als Talent-IDs, wie ein Build sie speichert. */
export function ranksFromAllocation(trees: TalentTree[], allocation: Allocation): TalentRanks {
  const ranks: TalentRanks = {}
  for (const tree of trees) {
    for (const node of tree.nodes) {
      const rank = allocation[node.id] ?? 0
      if (rank > 0 && node.talentId !== null) ranks[node.talentId] = rank
    }
  }
  return ranks
}

/**
 * Gesetzte Ränge des Charakters, auf Knoten gelegt. Ohne `groupIndex` die
 * aktive Talentverteilung, sonst die genannte (ab 1).
 */
export function allocationFromCharacter(
  raw: RawSpecializations | null,
  trees: TalentTree[],
  groupIndex?: number
): { allocation: Allocation; unmatched: number; spentByTree: Record<number, number> } {
  const groups = groupsFromCharacter(raw)
  const group =
    (groupIndex !== undefined ? groups.find((g) => g.index === groupIndex) : groups.find((g) => g.active)) ??
    groups[0]
  if (!group) return { allocation: {}, unmatched: 0, spentByTree: {} }
  const { allocation, unmatched } = allocationFromRanks(trees, group.ranks)
  return { allocation, unmatched, spentByTree: group.spentBySpec }
}

/** Punkte in einem Baum nach Zuteilung. */
export function pointsInTree(tree: TalentTree, allocation: Allocation): number {
  return tree.nodes.reduce((sum, n) => sum + (allocation[n.id] ?? 0), 0)
}

export function totalPoints(trees: TalentTree[], allocation: Allocation): number {
  return trees.reduce((sum, tree) => sum + pointsInTree(tree, allocation), 0)
}

// ─── Regeln ───────────────────────────────────────────────────────────────────
//
// Die API liefert keine dieser Regeln. Angenommen nach dem klassischen Spiel
// und vom Nutzer so bestätigt (2026-11-11): ein Punkt je Stufe ab Stufe 10,
// geplant wird immer für die Höchststufe 60 (Entscheid 2026-11-12), jede Zeile
// verlangt 5 Punkte mehr in den Zeilen darüber desselben Baums, und eine
// Voraussetzung muss voll ausgebaut sein. Die Oberfläche schreibt
// „angenommen" dazu.

export const MAX_LEVEL = 60
export const MAX_POINTS = MAX_LEVEL - 9
export const POINTS_PER_ROW = 5

/** Punkte im Baum in Zeilen oberhalb von `row`. */
function pointsAbove(tree: TalentTree, allocation: Allocation, row: number): number {
  return tree.nodes.reduce((sum, n) => sum + (n.row < row ? allocation[n.id] ?? 0 : 0), 0)
}

/** Warum ein Punkt nicht gesetzt werden kann – `null`, wenn er es kann. */
export type AddBlock = "maxRank" | "noPoints" | "rowLocked" | "requires"

export function addBlock(
  trees: TalentTree[],
  tree: TalentTree,
  allocation: Allocation,
  node: TalentNode
): AddBlock | null {
  if ((allocation[node.id] ?? 0) >= node.maxRank) return "maxRank"
  if (totalPoints(trees, allocation) >= MAX_POINTS) return "noPoints"
  if (pointsAbove(tree, allocation, node.row) < (node.row - 1) * POINTS_PER_ROW) return "rowLocked"
  const byId = new Map(tree.nodes.map((n) => [n.id, n]))
  for (const id of node.requires) {
    const req = byId.get(id)
    if (req && (allocation[req.id] ?? 0) < req.maxRank) return "requires"
  }
  return null
}

/** Knoten im Baum, die nach den Regeln nicht stehen dürften. */
function brokenNodes(tree: TalentTree, allocation: Allocation): number[] {
  const byId = new Map(tree.nodes.map((n) => [n.id, n]))
  return tree.nodes
    .filter((n) => (allocation[n.id] ?? 0) > 0)
    .filter(
      (n) =>
        pointsAbove(tree, allocation, n.row) < (n.row - 1) * POINTS_PER_ROW ||
        n.requires.some((id) => {
          const req = byId.get(id)
          return req !== undefined && (allocation[req.id] ?? 0) < req.maxRank
        })
    )
    .map((n) => n.id)
}

/**
 * Darf ein Punkt weg? Nur, wenn danach nichts mehr in der Luft hängt: keine
 * Zeile verliert ihre Freischaltung, keine Voraussetzung fällt unter voll.
 * War der Baum vorher schon regelwidrig (Build aus dem Spiel oder Import),
 * zählt nur, dass das Entfernen nichts Neues bricht.
 */
export function canRemove(tree: TalentTree, allocation: Allocation, node: TalentNode): boolean {
  const rank = allocation[node.id] ?? 0
  if (rank <= 0) return false
  const before = new Set(brokenNodes(tree, allocation))
  const next = { ...allocation, [node.id]: rank - 1 }
  return brokenNodes(tree, next).every((id) => id === node.id || before.has(id))
}

/** Was an einer Verteilung nicht zu den angenommenen Regeln passt. */
export function ruleIssues(
  trees: TalentTree[],
  allocation: Allocation
): { overBudget: number; broken: number[] } {
  return {
    overBudget: Math.max(0, totalPoints(trees, allocation) - MAX_POINTS),
    broken: trees.flatMap((tree) => brokenNodes(tree, allocation)),
  }
}

// ─── Vergleich mit dem Build im Spiel ─────────────────────────────────────────

/**
 * - `done`: der Charakter hat mindestens den Rang des Builds
 * - `todo`: der Build verlangt mehr, als gesetzt ist
 * - `extra`: gesetzt, aber im Build nicht (oder niedriger) vorgesehen
 * - `none`: weder noch
 */
export type NodeStatus = "done" | "todo" | "extra" | "none"

export function nodeStatus(current: number, target: number): NodeStatus {
  if (target > 0 && current >= target) return current > target ? "extra" : "done"
  if (target > current) return "todo"
  if (current > target) return "extra"
  return "none"
}

/** Punkte, die noch fehlen, und Punkte, die anders sitzen als im Build. */
export function compareAllocations(
  trees: TalentTree[],
  current: Allocation,
  target: Allocation
): { missing: number; extra: number } {
  let missing = 0
  let extra = 0
  for (const tree of trees) {
    for (const node of tree.nodes) {
      const c = current[node.id] ?? 0
      const t = target[node.id] ?? 0
      if (t > c) missing += t - c
      if (c > t) extra += c - t
    }
  }
  return { missing, extra }
}

// ─── Austausch als JSON ───────────────────────────────────────────────────────
//
// Ein eigenes Format dieser App (Entscheid 2026-11-11): für Forever ist kein
// Build-Code des Spiels bekannt, und ein Code, der wie einer aussieht, es aber
// nicht ist, wäre schlimmer als keiner. Die Oberfläche sagt das.

export const EXPORT_FORMAT = "wow-dashboard/talent-build"
export const EXPORT_VERSION = 1
const MAX_NAME = 60
const MAX_ENTRIES = 300
const MAX_RANK = 10

export interface BuildExport {
  format: typeof EXPORT_FORMAT
  version: typeof EXPORT_VERSION
  classId: number
  className: string | null
  name: string
  talents: { talentId: number; rank: number }[]
}

export function exportBuild(build: {
  classId: number
  className: string | null
  name: string
  ranks: TalentRanks
}): BuildExport {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    classId: build.classId,
    className: build.className,
    name: build.name,
    talents: Object.entries(build.ranks)
      .map(([id, rank]) => ({ talentId: Number(id), rank }))
      .sort((a, b) => a.talentId - b.talentId),
  }
}

/** Name eines Builds: getrimmt, gekürzt; leer heisst ungültig. */
export function cleanBuildName(input: unknown): string | null {
  if (typeof input !== "string") return null
  const name = input.trim().replace(/\s+/g, " ").slice(0, MAX_NAME)
  return name.length > 0 ? name : null
}

/**
 * Ränge auf Form prüfen – Schlüssel positive ganze Talent-IDs, Ränge 1–10.
 * Gegen die Bäume prüft das nicht; das tut die Oberfläche, die sie kennt.
 */
export function cleanRanks(input: unknown): TalentRanks | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const entries = Object.entries(input as Record<string, unknown>)
  if (entries.length > MAX_ENTRIES) return null
  const ranks: TalentRanks = {}
  for (const [key, value] of entries) {
    const id = Number(key)
    if (!Number.isInteger(id) || id <= 0) return null
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_RANK) return null
    ranks[id] = value
  }
  return ranks
}

export type ImportError = "json" | "format" | "version" | "content"

export function parseBuildImport(
  text: string
): { ok: true; classId: number; name: string; ranks: TalentRanks } | { ok: false; error: ImportError } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "json" }
  }
  const obj = data as Partial<BuildExport> | null
  if (!obj || typeof obj !== "object" || obj.format !== EXPORT_FORMAT) return { ok: false, error: "format" }
  if (obj.version !== EXPORT_VERSION) return { ok: false, error: "version" }
  if (typeof obj.classId !== "number" || !Array.isArray(obj.talents)) return { ok: false, error: "content" }

  const raw: Record<string, unknown> = {}
  for (const entry of obj.talents) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "content" }
    raw[String((entry as { talentId?: unknown }).talentId)] = (entry as { rank?: unknown }).rank
  }
  const ranks = cleanRanks(raw)
  const name = cleanBuildName(obj.name)
  if (!ranks || !name) return { ok: false, error: "content" }
  return { ok: true, classId: obj.classId, name, ranks }
}
