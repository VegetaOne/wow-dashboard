"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CharacterCard } from "./CharacterCard"
import { STAGE_SLOTS, WarbandStage } from "./WarbandStage"
import type { WoWCharacter, CharacterDetails } from "@/lib/battlenet"
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

  // Bühne: die Favoriten, höchste Stufe zuerst, höchstens fünf. Wer
  // darüber hinaus markiert ist, bleibt mit goldenem ★ in der Liste.
  const { stage, others } = useMemo(() => {
    const favorites = characters
      .filter((c) => c.isFavorite)
      .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
    const stage = favorites.slice(0, STAGE_SLOTS)
    const onStage = new Set(stage.map((c) => c.slug))
    return { stage, others: characters.filter((c) => !onStage.has(c.slug)) }
  }, [characters])

  // Die Bühne ist sofort sichtbar – ihre Bilder und Werte gleich holen
  useEffect(() => {
    if (stage.length > 0) loadDetails(stage)
  }, [stage, loadDetails])

  const displayed = others
    .filter((c) => (faction === "all" ? true : c.faction.type === faction))
    .filter((c) =>
      !query.trim()
        ? true
        : (c.name + " " + (c.surname ?? "") + " " + c.playable_class.name)
            .toLowerCase()
            .includes(query.trim().toLowerCase())
    )

  const groups = groupByFaction(displayed)

  if (error) {
    return (
      <div className="wb-plate m-6 p-6 text-[14px]">
        <span className="eyebrow block" style={{ color: "var(--wb-horde-lit)" }}>
          {t("grid.apiError")}
        </span>
        {error}
      </div>
    )
  }

  return (
    <div>
      <WarbandStage
        characters={stage}
        details={details}
        total={characters.length}
        favoriteCount={characters.filter((c) => c.isFavorite).length}
      />

      {/* Übrige Charaktere */}
      <section
        className="px-[26px] pb-8 pt-6"
        style={{
          background: "linear-gradient(180deg, var(--wb-deep), var(--wb-void))",
          borderTop: "2px solid var(--wb-gold-faint)",
        }}
      >
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="mr-auto">
              <h2 style={{ fontSize: 21 }}>{t("list.title")}</h2>
              <p className="mt-1 text-[12px] uppercase" style={{ letterSpacing: "0.1em", color: "var(--wb-ink-dim)" }}>
                {t("list.count", {
                  shown: displayed.length,
                  total: others.length,
                  horde: others.filter((c) => c.faction.type === "HORDE").length,
                  alliance: others.filter((c) => c.faction.type === "ALLIANCE").length,
                })}
              </p>
            </div>

            <div className="flex">
              {([
                { id: "all", labelKey: "grid.filterAll", color: "var(--wb-gold)" },
                { id: "HORDE", labelKey: "card.horde", color: "var(--wb-horde)" },
                { id: "ALLIANCE", labelKey: "card.alliance", color: "var(--wb-ally)" },
              ] as const).map((f) => {
                const active = faction === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setFaction(f.id)}
                    aria-pressed={active}
                    className="wb-tab"
                    style={{
                      padding: "9px 15px",
                      fontSize: 11,
                      letterSpacing: "0.16em",
                      ...(active
                        ? { background: f.color, borderColor: f.color, color: "var(--wb-on-gold)", boxShadow: "none" }
                        : {}),
                    }}
                  >
                    <span
                      className="h-2 w-2"
                      style={{ background: active ? "var(--wb-on-gold)" : f.color }}
                      aria-hidden
                    />
                    {t(f.labelKey)}
                  </button>
                )
              })}
            </div>

            <input
              className="input"
              style={{ width: 210 }}
              placeholder={t("grid.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-[5px] h-[56px] animate-pulse" style={{ background: "var(--wb-plate)" }} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div
              className="border border-dashed px-6 py-8 text-center text-[13px] italic"
              style={{ borderColor: "var(--wb-gold-faint)", color: "var(--wb-ink-dim)" }}
            >
              {characters.length === 0 ? t("grid.noCharacters") : t("list.empty")}
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

        <footer
          className="mx-auto mt-8 flex max-w-[1100px] flex-wrap justify-between gap-3 pt-4 text-[11px] uppercase"
          style={{ letterSpacing: "0.16em", color: "var(--wb-ink-dim)", borderTop: "2px solid var(--wb-gold-faint)" }}
        >
          <span>{t("list.footer")}</span>
          <span>{t("list.footerNote")}</span>
        </footer>
      </section>
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
      <div className="mb-2 mt-4 flex items-baseline gap-3 first:mt-0">
        <span
          className="font-heading text-[12px] font-bold uppercase"
          style={{ letterSpacing: "0.2em", color: group.faction === "HORDE" ? "var(--wb-horde-lit)" : "var(--wb-ally-lit)" }}
        >
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
