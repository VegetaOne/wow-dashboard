"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useFormat, useT } from "./I18nProvider"
import { TalentTrees } from "./TalentTrees"
import type { TranslationKey } from "@/lib/i18n"
import {
  MAX_LEVEL,
  MAX_POINTS,
  POINTS_PER_ROW,
  allocationFromRanks,
  exportBuild,
  parseBuildImport,
  ranksFromAllocation,
  ruleIssues,
  type Allocation,
  type ClassTalents,
  type ImportError,
  type SavedBuild,
  type TalentRanks,
} from "@/lib/talent-tree"

export interface PlannerSource {
  slug: string
  name: string
  level: number
}

interface Group {
  index: number
  active: boolean
  ranks: TalentRanks
}

const IMPORT_ERROR: Record<ImportError, TranslationKey> = {
  json: "planner.importErrorJson",
  format: "planner.importErrorFormat",
  version: "planner.importErrorVersion",
  content: "planner.importErrorContent",
}

/** Ränge gleich? Reihenfolge der Schlüssel egal. */
function sameRanks(a: TalentRanks, b: TalentRanks): boolean {
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  return ka.every((k) => a[Number(k)] === b[Number(k)])
}

/**
 * Talentplaner einer Klasse: gespeicherte Builds wählen, bearbeiten,
 * anlegen (aus dem Spiel oder leer), exportieren, importieren, löschen.
 *
 * Ein Build gehört der Klasse, nicht einem Charakter. Welcher Build für
 * welchen Charakter das Ziel ist, wird im Bereich „Talente" der Heldenakte
 * aktiviert – hier wird nur geplant.
 *
 * Gespeichert wird ausdrücklich per Knopf, nicht bei jedem Klick: ein Build
 * ist oft ein Ausprobieren, und „Verwerfen" soll den letzten Stand zurückholen.
 */
export function TalentPlanner({
  talents,
  classId,
  className,
  initialBuilds,
  initialBuildId,
  sources,
  startFrom,
}: {
  talents: ClassTalents
  classId: number
  className: string | null
  initialBuilds: SavedBuild[]
  initialBuildId: string | null
  sources: PlannerSource[]
  startFrom: { slug: string; group: number | null } | null
}) {
  const t = useT()
  const f = useFormat()
  const trees = talents.trees

  const [builds, setBuilds] = useState(initialBuilds)
  const [selectedId, setSelectedId] = useState<string | null>(
    startFrom ? null : initialBuilds.find((b) => b.id === initialBuildId)?.id ?? initialBuilds[0]?.id ?? null
  )
  const selected = builds.find((b) => b.id === selectedId) ?? null

  const [name, setName] = useState(selected?.name ?? "")
  const [allocation, setAllocation] = useState<Allocation>(() =>
    selected ? allocationFromRanks(trees, selected.ranks).allocation : {}
  )
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [creating, setCreating] = useState(startFrom !== null || initialBuilds.length === 0)
  const fileRef = useRef<HTMLInputElement>(null)

  const ranks = useMemo(() => ranksFromAllocation(trees, allocation), [trees, allocation])
  const dirty = selected !== null && (name.trim() !== selected.name || !sameRanks(ranks, selected.ranks))
  const issues = ruleIssues(trees, allocation)
  const unmatched = selected ? allocationFromRanks(trees, selected.ranks).unmatched : 0

  // Ungespeicherte Änderungen nicht stillschweigend verlieren
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // Gewählten Build in der Adresse halten, damit Neuladen ihn wieder öffnet
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("class", String(classId))
    if (selectedId) url.searchParams.set("build", selectedId)
    else url.searchParams.delete("build")
    url.searchParams.delete("from")
    url.searchParams.delete("group")
    window.history.replaceState(null, "", url)
  }, [classId, selectedId])

  const select = (build: SavedBuild | null) => {
    if (dirty && !window.confirm(t("planner.discardConfirm"))) return
    setSelectedId(build?.id ?? null)
    setName(build?.name ?? "")
    setAllocation(build ? allocationFromRanks(trees, build.ranks).allocation : {})
    setConfirmDelete(false)
    setMessage(null)
  }

  const remember = (build: SavedBuild) => {
    setBuilds((list) => {
      const rest = list.filter((b) => b.id !== build.id)
      return [...rest, build].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const create = async (buildName: string, buildRanks: TalentRanks): Promise<boolean> => {
    if (dirty && !window.confirm(t("planner.discardConfirm"))) return false
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch("/api/talent-builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, name: buildName, ranks: buildRanks }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.build) {
        setMessage({ text: data?.error ?? t("planner.saveFailed"), error: true })
        return false
      }
      const build = data.build as SavedBuild
      remember(build)
      setSelectedId(build.id)
      setName(build.name)
      setAllocation(allocationFromRanks(trees, build.ranks).allocation)
      setCreating(false)
      setMessage({ text: t("planner.created"), error: false })
      return true
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    if (!selected) return
    const cleanName = name.trim()
    if (!cleanName) {
      setMessage({ text: t("planner.nameMissing"), error: true })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/talent-builds/${encodeURIComponent(selected.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, ranks }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.build) {
        setMessage({ text: data?.error ?? t("planner.saveFailed"), error: true })
        return
      }
      remember(data.build as SavedBuild)
      setName((data.build as SavedBuild).name)
      setMessage({ text: t("planner.saved"), error: false })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!selected) return
    setBusy(true)
    try {
      const res = await fetch(`/api/talent-builds/${encodeURIComponent(selected.id)}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage({ text: data?.error ?? t("planner.saveFailed"), error: true })
        return
      }
      const rest = builds.filter((b) => b.id !== selected.id)
      setBuilds(rest)
      const next = rest[0] ?? null
      setSelectedId(next?.id ?? null)
      setName(next?.name ?? "")
      setAllocation(next ? allocationFromRanks(trees, next.ranks).allocation : {})
      setConfirmDelete(false)
      setMessage({ text: t("planner.deleted"), error: false })
      if (!next) setCreating(true)
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    const data = exportBuild({ classId, className, name: name.trim() || (selected?.name ?? ""), ranks })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const safe = (data.name || "build").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "")
    a.download = `talentbuild-${safe || "build"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file: File) => {
    setMessage(null)
    const result = parseBuildImport(await file.text())
    if (!result.ok) {
      setMessage({ text: t(IMPORT_ERROR[result.error]), error: true })
      return
    }
    if (result.classId !== classId) {
      setMessage({ text: t("planner.importWrongClass"), error: true })
      return
    }
    await create(result.name, result.ranks)
  }

  return (
    <div>
      {/* Builds der Klasse */}
      <div className="flex flex-wrap items-center gap-2 border-b px-[22px] py-3" style={{ borderColor: "var(--wb-gold-faint)" }}>
        <span className="eyebrow mr-2">{t("planner.builds")}</span>
        <div className="flex flex-wrap">
          {builds.map((build) => (
            <button
              key={build.id}
              type="button"
              className="wb-tab"
              aria-pressed={build.id === selectedId && !creating}
              onClick={() => {
                setCreating(false)
                select(build)
              }}
            >
              {build.name}
            </button>
          ))}
        </div>
        <button type="button" className="wb-tab" aria-pressed={creating} onClick={() => setCreating(true)}>
          {t("planner.newBuild")}
        </button>
        <button type="button" className="wb-tab" onClick={() => fileRef.current?.click()} disabled={busy}>
          {t("planner.import")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file) void importFile(file)
          }}
        />
      </div>

      {message && (
        <div className="border-b px-[22px] py-2 text-[13px]" style={{ borderColor: "var(--wb-gold-faint)", color: message.error ? "var(--color-loss)" : "var(--color-gain)" }} role="status">
          {message.text}
        </div>
      )}

      {creating ? (
        <NewBuildForm
          trees={talents}
          sources={sources}
          startFrom={startFrom}
          defaultName={t("planner.defaultName", { n: builds.length + 1 })}
          busy={busy}
          onCreate={create}
          onCancel={builds.length > 0 ? () => setCreating(false) : null}
        />
      ) : selected ? (
        <>
          {/* Bearbeiten */}
          <div className="flex flex-wrap items-end gap-3 border-b px-[22px] py-3" style={{ borderColor: "var(--wb-gold-faint)" }}>
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1">
              <span className="eyebrow">{t("planner.name")}</span>
              <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
            </label>
            <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !dirty}>
              {t("planner.save")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => select(selected)} disabled={busy || !dirty}>
              {t("planner.discard")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setAllocation({})} disabled={busy || Object.keys(allocation).length === 0}>
              {t("planner.reset")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={download} title={t("planner.exportHint")}>
              {t("planner.export")}
            </button>
            {confirmDelete ? (
              <button type="button" className="btn btn-secondary" style={{ color: "var(--color-loss)" }} onClick={remove} disabled={busy}>
                {t("planner.deleteConfirm")}
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(true)} disabled={busy}>
                {t("planner.delete")}
              </button>
            )}
          </div>

          <div className="px-[22px] pt-3 text-[12px] italic" style={{ color: "var(--wb-ink-dim)" }}>
            {t("planner.rulesNote", { points: f.number(MAX_POINTS), level: f.number(MAX_LEVEL), perRow: f.number(POINTS_PER_ROW) })}
            {dirty && (
              <span className="ml-2 not-italic" style={{ color: "var(--wb-gold-lit)" }}>
                {t("planner.unsaved")}
              </span>
            )}
          </div>
          {(issues.broken.length > 0 || issues.overBudget > 0) && (
            <div className="mx-[22px] mt-3 border-2 px-4 py-2 text-[12px]" style={{ borderColor: "var(--color-loss)" }}>
              {issues.overBudget > 0 && <div>{t("planner.pointsOver", { count: f.number(issues.overBudget) })}</div>}
              {issues.broken.length > 0 && <div>{t("planner.rulesBroken", { count: f.number(issues.broken.length) })}</div>}
            </div>
          )}

          <div className="px-6 py-6">
            <TalentTrees talents={talents} allocation={allocation} unmatched={unmatched} onChange={setAllocation} />
          </div>
        </>
      ) : null}
    </div>
  )
}

/**
 * Neuer Build: Name und Ausgangspunkt. Vorgewählt ist der Build im Spiel
 * des ersten Charakters dieser Klasse (Entscheid 2026-11-12); „Leer" ist
 * die Alternative. Die Talentverteilungen eines Charakters werden erst
 * geladen, wenn er gewählt ist.
 */
function NewBuildForm({
  trees,
  sources,
  startFrom,
  defaultName,
  busy,
  onCreate,
  onCancel,
}: {
  trees: ClassTalents
  sources: PlannerSource[]
  startFrom: { slug: string; group: number | null } | null
  defaultName: string
  busy: boolean
  onCreate: (name: string, ranks: TalentRanks) => Promise<boolean>
  onCancel: (() => void) | null
}) {
  const t = useT()
  const f = useFormat()
  const [name, setName] = useState(defaultName)
  const [source, setSource] = useState<string>(
    startFrom && sources.some((s) => s.slug === startFrom.slug) ? startFrom.slug : sources[0]?.slug ?? ""
  )
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [group, setGroup] = useState<number | null>(startFrom?.group ?? null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setGroups(null)
    setLoadError(false)
    if (!source) return
    let cancelled = false
    fetch(`/api/wow/talent-source?slug=${encodeURIComponent(source)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { groups?: Group[] }) => {
        if (cancelled) return
        const list = data.groups ?? []
        setGroups(list)
        // Gewünschte Verteilung, sonst die aktive
        setGroup((g) => (g !== null && list.some((x) => x.index === g) ? g : list.find((x) => x.active)?.index ?? list[0]?.index ?? null))
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [source])

  const chosen = groups?.find((g) => g.index === group) ?? null
  const preview = chosen ? allocationFromRanks(trees.trees, chosen.ranks) : null
  const ready = !source || (groups !== null && (groups.length === 0 || chosen !== null))

  const submit = async () => {
    // Nur, was zu den Bäumen passt – Unbekanntes würde still mitgespeichert
    const ranks = preview ? ranksFromAllocation(trees.trees, preview.allocation) : {}
    await onCreate(name, ranks)
  }

  return (
    <div className="grid gap-4 px-[22px] py-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="flex flex-col gap-1">
        <span className="eyebrow">{t("planner.name")}</span>
        <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">{t("planner.startFrom")}</span>
        <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">{t("planner.startEmpty")}</option>
          {sources.map((s) => (
            <option key={s.slug} value={s.slug}>
              {t("planner.startCharacter", { name: s.name, level: f.number(s.level) })}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || !ready || !name.trim()}>
          {t("planner.create")}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {t("planner.cancel")}
          </button>
        )}
      </div>

      {source && (
        <div className="text-[12px] sm:col-span-3">
          {loadError ? (
            <span style={{ color: "var(--color-loss)" }}>{t("planner.sourceFailed")}</span>
          ) : groups === null ? (
            <span className="italic opacity-70">{t("planner.sourceLoading")}</span>
          ) : groups.length === 0 ? (
            <span className="italic opacity-70">{t("planner.sourceEmpty")}</span>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {groups.length > 1 && (
                <div className="flex">
                  {groups.map((g) => (
                    <button key={g.index} type="button" className="wb-tab" aria-pressed={g.index === group} onClick={() => setGroup(g.index)}>
                      {g.active ? t("planner.groupActive", { n: g.index }) : t("planner.group", { n: g.index })}
                    </button>
                  ))}
                </div>
              )}
              {preview && (
                <span className="opacity-75">
                  {t("planner.sourcePoints", { count: f.number(Object.values(preview.allocation).reduce((a, b) => a + b, 0)) })}
                  {preview.unmatched > 0 && ` · ${t("talents.unmatched", { count: f.number(preview.unmatched) })}`}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      {sources.length === 0 && (
        <div className="text-[12px] italic opacity-70 sm:col-span-3">{t("planner.noSources")}</div>
      )}
    </div>
  )
}
