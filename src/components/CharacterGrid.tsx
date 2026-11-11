"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CharacterCard } from "./CharacterCard"
import type { WoWCharacter, CharacterDetails } from "@/lib/battlenet"
import type { TranslationKey } from "@/lib/i18n"
import { useT } from "./I18nProvider"

interface CharacterWithMeta extends WoWCharacter {
  isFavorite?: boolean
}

type FactionFilter = "all" | "HORDE" | "ALLIANCE"
type DetailMap = Record<string, CharacterDetails>

/** Vorgabe, falls die Konfiguration nichts sagt. */
export const POLL_MS = 60_000

/**
 * Gruppe der Liste. Früher je Realm – WoW Forever hat keine Realms, und die
 * Account-Liste nennt auch kein Ruleset. Gruppiert wird darum nach Fraktion;
 * die Abschnitte bleiben nötig, weil sie das Nachladen der Werte steuern.
 */
interface CharacterGroup {
  faction: "ALLIANCE" | "HORDE"
  characters: CharacterWithMeta[]
}

/** Allianz vor Horde, Charaktere darin nach Stufe absteigend. */
function groupByFaction(characters: CharacterWithMeta[]): CharacterGroup[] {
  const groups: CharacterGroup[] = [
    { faction: "ALLIANCE", characters: [] },
    { faction: "HORDE", characters: [] },
  ]
  for (const char of characters) {
    groups[char.faction.type === "HORDE" ? 1 : 0].characters.push(char)
  }
  for (const group of groups) {
    group.characters.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
  }
  return groups.filter((g) => g.characters.length > 0)
}

export function CharacterGrid({
  onSync,
  pollMs = POLL_MS,
}: {
  onSync?: (at: Date, count: number) => void
  /** Abrufintervall aus der Konfiguration */
  pollMs?: number
}) {
  const t = useT()

  const [characters, setCharacters] = useState<CharacterWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [faction, setFaction] = useState<FactionFilter>("all")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [query, setQuery] = useState("")

  // onSync in einer Ref halten: Der Aufrufer übergibt oft eine Inline-Funktion,
  // deren Identität sich bei jedem Render ändert. Als Abhängigkeit von `load`
  // würde das den Lade-Effect endlos neu starten.
  const onSyncRef = useRef(onSync)
  useEffect(() => {
    onSyncRef.current = onSync
  }, [onSync])

  // Gegenstandsstufe und Avatar kommen nicht mit der Liste, sondern erst
  // wenn ein Abschnitt sichtbar wird. Einmal geholt, bleibt es da.
  const [details, setDetails] = useState<DetailMap>({})
  const requestedRef = useRef<Set<string>>(new Set())

  const loadDetails = useCallback(
    async (chars: CharacterWithMeta[]) => {
      const missing = chars.filter((c) => !requestedRef.current.has(c.slug))
      if (missing.length === 0) return

      for (const c of missing) requestedRef.current.add(c.slug)

      try {
        const res = await fetch("/api/wow/character-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: missing.map((c) => c.slug) }),
        })
        const data = await res.json()
        if (data.details) {
          setDetails((prev) => ({ ...prev, ...data.details }))
        }
      } catch {
        // Bei Fehlschlag wieder freigeben, damit ein späterer Versuch greift
        for (const c of missing) requestedRef.current.delete(c.slug)
      }
    },
    []
  )

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wow/characters")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCharacters(data.characters)
      setError(null)
      onSyncRef.current?.(new Date(), data.characters.length)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Die App zieht selbst — kein manueller Refresh-Button.
  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(load, pollMs)
    return () => clearInterval(id)
  }, [load])

  const toggleFavorite = useCallback(
    async (char: CharacterWithMeta) => {
      const res = await fetch("/api/wow/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: char.slug }),
      })
      const data = await res.json()
      if (data.error) return

      setCharacters((prev) =>
        prev.map((c) =>
          c.slug === char.slug ? { ...c, isFavorite: data.isFavorite } : c
        )
      )
    },
    []
  )

  const stats = useMemo(() => {
    const loadedLevels = characters
      .map((c) => details[c.slug]?.equippedItemLevel)
      .filter((v): v is number => typeof v === "number")

    const avg = loadedLevels.length
      ? Math.round(loadedLevels.reduce((a, b) => a + b, 0) / loadedLevels.length)
      : null
    const maxLevel = Math.max(0, ...characters.map((c) => c.level))

    const stat = (
      key: TranslationKey,
      value: number | string,
      note: string
    ) => ({ key, label: t(key), value, note })

    return [
      stat(
        "grid.statCharacters",
        characters.length,
        t("grid.factionSplit", {
          horde: characters.filter((c) => c.faction.type === "HORDE").length,
          alliance: characters.filter((c) => c.faction.type === "ALLIANCE").length,
        })
      ),
      stat(
        "grid.statHighestLevel",
        maxLevel,
        t("grid.atMaxLevel", {
          count: characters.filter((c) => c.level >= maxLevel).length,
        })
      ),
      // Ob Forever eine Gegenstandsstufe führt, ist nicht belegt. Ohne einen
      // einzigen geladenen Wert steht „—", nie 0.
      stat(
        "grid.statAvgItemLevel",
        avg ?? "—",
        // Ehrlich bleiben: der Schnitt gilt nur für das bisher Geladene
        loadedLevels.length
          ? t("grid.avgNote", {
              loaded: loadedLevels.length,
              total: characters.length,
              max: Math.max(...loadedLevels),
            })
          : t("grid.avgPending")
      ),
      stat(
        "grid.statFavorites",
        characters.filter((c) => c.isFavorite).length,
        t("grid.favoritesNote")
      ),
    ]
  }, [characters, details, t])

  const displayed = characters
    .filter((c) => (faction === "all" ? true : c.faction.type === faction))
    .filter((c) => (favoritesOnly ? c.isFavorite : true))
    .filter((c) =>
      !query.trim()
        ? true
        : (c.name + " " + (c.surname ?? "") + c.playable_class.name)
            .toLowerCase()
            .includes(query.trim().toLowerCase())
    )

  const groups = groupByFaction(displayed)

  if (error) {
    return (
      <div className="border-2 border-accent p-6 text-[14px]">
        <span className="eyebrow block">{t("grid.apiError")}</span>
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* Kennzahlen-Leiste */}
      <div className="grid grid-cols-2 border-b-2 border-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.key} className="flex flex-col gap-0.5 border-r border-line px-6 py-4">
            <span className="eyebrow">{s.label}</span>
            <span className="font-heading text-[30px] font-extrabold leading-none tracking-[-0.02em]">
              {loading ? "—" : s.value}
            </span>
            <span className="text-[11px] opacity-50">{s.note}</span>
          </div>
        ))}
      </div>

      {/* Filterzeile */}
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-3">
        <div className="flex">
          {([
            { id: "all", labelKey: "grid.filterAll", color: "var(--color-neutral-700)" },
            { id: "HORDE", labelKey: "card.horde", color: "var(--faction-horde)" },
            { id: "ALLIANCE", labelKey: "card.alliance", color: "var(--faction-alliance)" },
          ] as const).map((f) => {
            const active = faction === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFaction(f.id)}
                className="-ml-px inline-flex items-center gap-2 border border-line px-3.5 py-1.5 font-heading text-[12px] font-extrabold uppercase tracking-[0.06em]"
                style={{
                  background: active ? f.color : "transparent",
                  color: active ? "var(--color-bg)" : "var(--color-text)",
                }}
              >
                <span
                  className="h-2 w-2"
                  style={{ background: active ? "var(--color-bg)" : f.color }}
                  aria-hidden
                />
                {t(f.labelKey)}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          aria-pressed={favoritesOnly}
          className="btn btn-secondary"
          style={
            favoritesOnly
              ? { background: "var(--color-accent)", color: "var(--color-bg)", borderColor: "transparent" }
              : undefined
          }
        >
          ★ {t("grid.favorites")}
        </button>

        <input
          className="input max-w-[220px]"
          placeholder={t("grid.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <span className="ml-auto text-[11px] uppercase tracking-[0.08em] opacity-55">
          {t("grid.shownOf", {
            shown: displayed.length,
            total: characters.length,
          })}
        </span>
      </div>

      {/* Spaltenköpfe */}
      <div className="flex items-center gap-4 border-b-2 border-line pr-6 text-[10px] uppercase tracking-[0.1em] opacity-55">
        <span className="w-1 flex-none" />
        <span className="w-[34px] flex-none">{t("grid.colClass")}</span>
        <span className="w-3 flex-none" />
        <span className="min-w-0 flex-1 basis-[150px] py-2">
          {t("grid.colCharacter")}
        </span>
        <span className="w-14 flex-none text-right">{t("card.level")}</span>
        <span className="hidden w-14 flex-none text-right sm:block">
          {t("card.itemLevel")}
        </span>
        <span className="hidden w-24 flex-none sm:block">{t("card.faction")}</span>
        <span className="w-9 flex-none">★</span>
        <span className="hidden w-[104px] flex-none lg:block" />
      </div>

      {loading ? (
        <div className="divide-y divide-line">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[54px] animate-pulse bg-surface" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="px-6 py-12 text-[13px] opacity-55">
          {favoritesOnly ? t("grid.noFavorites") : t("grid.noCharacters")}
        </div>
      ) : (
        groups.map((group) => (
          <CharacterSection
            key={group.faction}
            group={group}
            details={details}
            onVisible={loadDetails}
            onToggleFavorite={toggleFavorite}
          />
        ))
      )}
    </div>
  )
}

/**
 * Ein Abschnitt der Liste. Meldet sich, sobald er in Sichtweite kommt,
 * damit erst dann Gegenstandsstufen und Avatare geladen werden.
 */
function CharacterSection({
  group,
  details,
  onVisible,
  onToggleFavorite,
}: {
  group: CharacterGroup
  details: DetailMap
  onVisible: (chars: CharacterWithMeta[]) => void
  onToggleFavorite: (char: CharacterWithMeta) => void
}) {
  const t = useT()
  const sectionRef = useRef<HTMLElement | null>(null)

  // Aktuelle Charakterliste in einer Ref, damit der Effect nicht bei
  // jeder Filteränderung neu aufgesetzt werden muss.
  const charsRef = useRef(group.characters)
  charsRef.current = group.characters

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // Ohne IntersectionObserver (z.B. serverseitiges Rendern) direkt laden
    if (typeof IntersectionObserver === "undefined") {
      onVisible(charsRef.current)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          // onVisible entdoppelt selbst – mehrfaches Melden ist unschädlich
          onVisible(charsRef.current)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [group.faction, onVisible])

  const loadedCount = group.characters.filter((c) => details[c.slug]).length
  const pendingDetails = loadedCount < group.characters.length

  return (
    <section ref={sectionRef}>
      {/* Zwischenüberschrift je Fraktion */}
      <div className="flex items-baseline gap-3 border-b border-line bg-surface px-6 py-2">
        <span className="font-heading text-[13px] font-extrabold uppercase tracking-[0.06em]">
          {group.faction === "HORDE" ? t("card.horde") : t("card.alliance")}
        </span>
        <span className="eyebrow">
          {group.characters.length}{" "}
          {group.characters.length === 1
            ? t("grid.characterOne")
            : t("grid.characterMany")}
        </span>
        {pendingDetails && (
          <span className="eyebrow ml-auto animate-pulse">
            {t("grid.loadingValues")}
          </span>
        )}
      </div>

      {group.characters.map((char) => (
        <CharacterCard
          key={char.slug}
          character={char}
          details={details[char.slug]}
          detailsPending={!details[char.slug]}
          onToggleFavorite={() => onToggleFavorite(char)}
        />
      ))}
    </section>
  )
}
