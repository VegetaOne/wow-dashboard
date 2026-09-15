"use client"

import { useCallback, useRef, useState } from "react"
import type { GameMode } from "@/lib/battlenet"
import type { ProfessionView, ProfessionTierView, TierCatalog } from "@/lib/professions"

interface ProfessionsPanelProps {
  professions: ProfessionView[]
  mode: GameMode
}

const KIND_LABEL = {
  primary: "Hauptberuf",
  secondary: "Nebenberuf",
} as const

/**
 * Beschriftungen als ein String statt aus JSX-Ausdrücken zusammengesetzt.
 * React trennt aufeinanderfolgende Ausdrücke im Markup mit Kommentarknoten –
 * das bläht das DOM auf und macht den Text schwer prüfbar.
 */
function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

export function ProfessionsPanel({ professions, mode }: ProfessionsPanelProps) {
  // Kataloge je Fertigkeitsstufe – erst auf Anforderung geladen
  const [catalogs, setCatalogs] = useState<Record<number, TierCatalog | null>>({})
  const [loadingTier, setLoadingTier] = useState<number | null>(null)
  const [openTier, setOpenTier] = useState<number | null>(null)
  const requested = useRef<Set<number>>(new Set())

  const loadCatalog = useCallback(
    async (professionId: number, tierId: number) => {
      if (requested.current.has(tierId)) return
      requested.current.add(tierId)
      setLoadingTier(tierId)

      try {
        const res = await fetch(
          `/api/wow/profession-tier?professionId=${professionId}&tierId=${tierId}&mode=${mode}`
        )
        const data = await res.json()
        setCatalogs((prev) => ({ ...prev, [tierId]: data.catalog ?? null }))
      } catch {
        requested.current.delete(tierId)
        setCatalogs((prev) => ({ ...prev, [tierId]: null }))
      } finally {
        setLoadingTier(null)
      }
    },
    [mode]
  )

  function toggleTier(professionId: number, tier: ProfessionTierView) {
    const next = openTier === tier.tierId ? null : tier.tierId
    setOpenTier(next)
    if (next !== null) loadCatalog(professionId, tier.tierId)
  }

  if (professions.length === 0) {
    return (
      <div className="border-2 border-line px-4 py-3">
        <span className="eyebrow block">Berufe</span>
        <span className="text-[13px] opacity-75">
          Für diesen Charakter liefert die API keine Berufe.
        </span>
      </div>
    )
  }

  const primaries = professions.filter((p) => p.kind === "primary")
  const secondaries = professions.filter((p) => p.kind === "secondary")

  return (
    <div className="space-y-8">
      {[
        ["primary", primaries] as const,
        ["secondary", secondaries] as const,
      ].map(([kind, list]) =>
        list.length === 0 ? null : (
          <section key={kind}>
            <h4 className="mb-3">{list.length > 1 ? `${KIND_LABEL[kind]}e` : KIND_LABEL[kind]}</h4>

            <div className="space-y-4">
              {list.map((prof) => (
                <ProfessionCard
                  key={prof.professionId}
                  profession={prof}
                  openTier={openTier}
                  loadingTier={loadingTier}
                  catalogs={catalogs}
                  onToggleTier={toggleTier}
                />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  )
}

function ProfessionCard({
  profession,
  openTier,
  loadingTier,
  catalogs,
  onToggleTier,
}: {
  profession: ProfessionView
  openTier: number | null
  loadingTier: number | null
  catalogs: Record<number, TierCatalog | null>
  onToggleTier: (professionId: number, tier: ProfessionTierView) => void
}) {
  const recipeTotal = profession.tiers.reduce(
    (sum, t) => sum + t.knownRecipes.length,
    0
  )

  const summary = [
    profession.tiers.length > 0
      ? plural(profession.tiers.length, "Stufe", "Stufen")
      : null,
    `${plural(recipeTotal, "Rezept", "Rezepte")} bekannt`,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="border-2 border-line">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-heading text-[14px] font-extrabold uppercase tracking-[0.06em]">
          {profession.professionName}
        </span>
        <span className="eyebrow">{summary}</span>
      </div>

      {profession.tiers.length === 0 ? (
        <div className="px-4 py-2.5 text-[13px] opacity-60">
          Keine Fertigkeitsangaben von der API.
        </div>
      ) : (
        <div>
          {profession.tiers.map((tier) => (
            <TierRow
              key={tier.tierId}
              professionId={profession.professionId}
              tier={tier}
              isOpen={openTier === tier.tierId}
              isLoading={loadingTier === tier.tierId}
              catalog={catalogs[tier.tierId]}
              hasCatalog={tier.tierId in catalogs}
              onToggle={onToggleTier}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TierRow({
  professionId,
  tier,
  isOpen,
  isLoading,
  catalog,
  hasCatalog,
  onToggle,
}: {
  professionId: number
  tier: ProfessionTierView
  isOpen: boolean
  isLoading: boolean
  catalog: TierCatalog | null | undefined
  hasCatalog: boolean
  onToggle: (professionId: number, tier: ProfessionTierView) => void
}) {
  const pct =
    tier.skillPoints !== null && tier.maxSkillPoints && tier.maxSkillPoints > 0
      ? Math.round((tier.skillPoints / tier.maxSkillPoints) * 100)
      : null

  const knownIds = new Set(tier.knownRecipes.map((r) => r.id))

  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => onToggle(professionId, tier)}
        aria-expanded={isOpen}
        className="w-full px-4 py-2.5 text-left hover:bg-ink/5"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="min-w-0 flex-1 truncate text-[13px]">
            {tier.tierName}
          </span>

          {tier.skillPoints !== null && (
            <span className="font-heading text-[13px] font-extrabold">
              {tier.maxSkillPoints !== null
                ? `${tier.skillPoints} / ${tier.maxSkillPoints}`
                : String(tier.skillPoints)}
            </span>
          )}

          <span className="eyebrow">
            {plural(tier.knownRecipes.length, "Rezept", "Rezepte")}
          </span>

          <span className="w-4 flex-none text-center text-[12px] opacity-55">
            {isOpen ? "−" : "+"}
          </span>
        </div>

        {pct !== null && (
          <div className="mt-1.5 h-1.5 bg-neutral-300">
            <div
              className="h-1.5"
              style={{ width: `${pct}%`, background: "var(--color-accent)" }}
            />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-line bg-surface px-4 py-3">
          {isLoading && (
            <span className="text-[13px] opacity-55">Lade Rezeptliste…</span>
          )}

          {/* Kein Katalog: die Classic-Namespaces führen Rezept-Stammdaten
              nicht durchgängig. Dann nur zeigen, was bekannt ist. */}
          {!isLoading && hasCatalog && !catalog && (
            <div>
              <p className="mb-2 text-[12px] opacity-60">
                Für diese Stufe liefert die API keine vollständige Rezeptliste —
                es lässt sich also nicht sagen, was noch fehlt. Bekannte Rezepte:
              </p>
              <RecipeList recipes={tier.knownRecipes} known={knownIds} />
            </div>
          )}

          {!isLoading && catalog && (
            <TierCatalogView catalog={catalog} knownIds={knownIds} />
          )}
        </div>
      )}
    </div>
  )
}

function TierCatalogView({
  catalog,
  knownIds,
}: {
  catalog: TierCatalog
  knownIds: Set<number>
}) {
  const known = catalog.categories.reduce(
    (sum, c) => sum + c.recipes.filter((r) => knownIds.has(r.id)).length,
    0
  )
  const total = catalog.totalRecipes
  const pct = total > 0 ? Math.round((known / total) * 100) : 0

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="eyebrow">Rezeptfortschritt</span>
        <span className="font-heading text-[13px] font-extrabold">
          {`${known} / ${total} (${pct}%)`}
        </span>
      </div>

      <div className="mb-4 h-1.5 bg-neutral-300">
        <div
          className="h-1.5"
          style={{ width: `${pct}%`, background: "var(--faction-alliance)" }}
        />
      </div>

      <div className="space-y-4">
        {catalog.categories.map((cat) => {
          const missing = cat.recipes.filter((r) => !knownIds.has(r.id))
          return (
            <div key={cat.name}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]">
                  {cat.name}
                </span>
                <span className="eyebrow">
                  {`${cat.recipes.length - missing.length} / ${cat.recipes.length}`}
                </span>
              </div>
              <RecipeList recipes={cat.recipes} known={knownIds} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecipeList({
  recipes,
  known,
}: {
  recipes: { id: number; name: string }[]
  known: Set<number>
}) {
  if (recipes.length === 0) {
    return <span className="text-[12px] opacity-50">Keine Rezepte</span>
  }

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-x-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((r) => {
        const isKnown = known.has(r.id)
        return (
          <li
            key={r.id}
            className="flex items-center gap-2 py-0.5 text-[12px]"
            style={{ opacity: isKnown ? 1 : 0.5 }}
          >
            <span
              className="h-2 w-2 flex-none border"
              style={{
                borderColor: isKnown ? "transparent" : "var(--color-divider)",
                background: isKnown ? "var(--faction-alliance)" : "transparent",
              }}
              aria-label={isKnown ? "bekannt" : "fehlt"}
            />
            <span className="truncate" title={r.name}>
              {r.name}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
