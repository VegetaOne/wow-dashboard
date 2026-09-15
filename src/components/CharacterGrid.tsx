"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CharacterCard } from "./CharacterCard"
import type { WoWCharacter, GameMode, CharacterDetails } from "@/lib/battlenet"
import { detailKey } from "@/lib/battlenet"

interface CharacterWithMeta extends WoWCharacter {
  isFavorite?: boolean
}

type FactionFilter = "all" | "HORDE" | "ALLIANCE"
type DetailMap = Record<string, CharacterDetails>

export const POLL_MS = 60_000

/** Nur Retail liefert Gegenstandsstufen — Classic-Modi zeigen die Stufe. */
function hasItemLevel(mode: GameMode) {
  return mode === "retail"
}

interface RealmGroup {
  slug: string
  name: string
  characters: CharacterWithMeta[]
}

/** Realms alphabetisch, Charaktere darin nach Stufe absteigend. */
function groupByRealm(characters: CharacterWithMeta[]): RealmGroup[] {
  const map = new Map<string, RealmGroup>()

  for (const char of characters) {
    const group = map.get(char.realm.slug)
    if (group) {
      group.characters.push(char)
    } else {
      map.set(char.realm.slug, {
        slug: char.realm.slug,
        name: char.realm.name,
        characters: [char],
      })
    }
  }

  const groups = Array.from(map.values())
  for (const group of groups) {
    group.characters.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
  }
  groups.sort((a, b) => a.name.localeCompare(b.name))
  return groups
}

export function CharacterGrid({ onSync }: { onSync?: (at: Date, count: number) => void }) {
  const params = useSearchParams()
  const mode = (params.get("mode") as GameMode) || "retail"

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
  // wenn ein Realm-Abschnitt sichtbar wird. Einmal geholt, bleibt es da.
  const [details, setDetails] = useState<DetailMap>({})
  const requestedRef = useRef<Set<string>>(new Set())

  const loadDetails = useCallback(
    async (chars: CharacterWithMeta[]) => {
      const missing = chars.filter(
        (c) => !requestedRef.current.has(detailKey(c.realm.slug, c.name))
      )
      if (missing.length === 0) return

      for (const c of missing) {
        requestedRef.current.add(detailKey(c.realm.slug, c.name))
      }

      try {
        const res = await fetch("/api/wow/character-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            characters: missing.map((c) => ({ realm: c.realm.slug, name: c.name })),
          }),
        })
        const data = await res.json()
        if (data.details) {
          setDetails((prev) => ({ ...prev, ...data.details }))
        }
      } catch {
        // Bei Fehlschlag wieder freigeben, damit ein späterer Versuch greift
        for (const c of missing) {
          requestedRef.current.delete(detailKey(c.realm.slug, c.name))
        }
      }
    },
    [mode]
  )

  // Moduswechsel: Geladenes verwerfen, die Werte gelten pro Modus
  useEffect(() => {
    setDetails({})
    requestedRef.current = new Set()
  }, [mode])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/wow/characters?mode=${mode}`)
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
  }, [mode])

  // Die App zieht selbst — kein manueller Refresh-Button.
  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  const toggleFavorite = useCallback(
    async (char: CharacterWithMeta) => {
      const res = await fetch("/api/wow/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // gameMode mitgeben: derselbe Name kann in mehreren Modi existieren
        body: JSON.stringify({
          characterName: char.name,
          realmSlug: char.realm.slug,
          gameMode: mode,
        }),
      })
      const data = await res.json()
      if (data.error) return

      setCharacters((prev) =>
        prev.map((c) =>
          c.name === char.name && c.realm.slug === char.realm.slug
            ? { ...c, isFavorite: data.isFavorite }
            : c
        )
      )
    },
    [mode]
  )

  const stats = useMemo(() => {
    const loadedLevels = characters
      .map((c) => details[detailKey(c.realm.slug, c.name)]?.equippedItemLevel)
      .filter((v): v is number => typeof v === "number")

    const avg = loadedLevels.length
      ? Math.round(loadedLevels.reduce((a, b) => a + b, 0) / loadedLevels.length)
      : null
    const maxLevel = Math.max(0, ...characters.map((c) => c.level))

    return [
      {
        label: "Charaktere",
        value: characters.length,
        note: `${characters.filter((c) => c.faction.type === "HORDE").length} Horde · ${
          characters.filter((c) => c.faction.type === "ALLIANCE").length
        } Allianz`,
      },
      hasItemLevel(mode)
        ? {
            label: "Ø Gegenstandsstufe",
            value: avg ?? "—",
            // Ehrlich bleiben: der Schnitt gilt nur für das bisher Geladene
            note: loadedLevels.length
              ? `aus ${loadedLevels.length} von ${characters.length} · Höchste ${Math.max(
                  ...loadedLevels
                )}`
              : "wird beim Scrollen geladen",
          }
        : {
            label: "Höchste Stufe",
            value: maxLevel,
            note: `${characters.filter((c) => c.level >= maxLevel).length} auf Höchststufe`,
          },
      {
        label: "Favoriten",
        value: characters.filter((c) => c.isFavorite).length,
        note: "mit ★ markiert",
      },
      {
        label: "Realms",
        value: new Set(characters.map((c) => c.realm.slug)).size,
        note: "verteilt auf",
      },
    ]
  }, [characters, mode, details])

  const displayed = characters
    .filter((c) => (faction === "all" ? true : c.faction.type === faction))
    .filter((c) => (favoritesOnly ? c.isFavorite : true))
    .filter((c) =>
      !query.trim()
        ? true
        : (c.name + c.playable_class.name + c.realm.name)
            .toLowerCase()
            .includes(query.trim().toLowerCase())
    )

  const realmGroups = groupByRealm(displayed)

  if (error) {
    return (
      <div className="border-2 border-accent p-6 text-[14px]">
        <span className="eyebrow block">API-Fehler</span>
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* Kennzahlen-Leiste */}
      <div className="grid grid-cols-2 border-b-2 border-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 border-r border-line px-6 py-4">
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
            { id: "all", label: "Alle", color: "var(--color-neutral-700)" },
            { id: "HORDE", label: "Horde", color: "var(--faction-horde)" },
            { id: "ALLIANCE", label: "Allianz", color: "var(--faction-alliance)" },
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
                {f.label}
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
          ★ Favoriten
        </button>

        <input
          className="input max-w-[220px]"
          placeholder="Charakter suchen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <span className="ml-auto text-[11px] uppercase tracking-[0.08em] opacity-55">
          {displayed.length} von {characters.length} Charakteren
          {realmGroups.length > 0 && ` · ${realmGroups.length} Realms`}
        </span>
      </div>

      {/* Spaltenköpfe */}
      <div className="flex items-center gap-4 border-b-2 border-line pr-6 text-[10px] uppercase tracking-[0.1em] opacity-55">
        <span className="w-1 flex-none" />
        <span className="w-[34px] flex-none">Kl.</span>
        <span className="w-3 flex-none" />
        <span className="min-w-0 flex-1 basis-[150px] py-2">Charakter</span>
        <span className="w-14 flex-none text-right">
          {hasItemLevel(mode) ? "GS" : "Stufe"}
        </span>
        <span className="hidden w-14 flex-none text-right sm:block">Ø</span>
        <span className="hidden w-24 flex-none sm:block">Fraktion</span>
        <span className="w-9 flex-none">★</span>
        <span className="hidden w-[104px] flex-none lg:block" />
      </div>

      {loading ? (
        <div className="divide-y divide-line">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[54px] animate-pulse bg-surface" />
          ))}
        </div>
      ) : realmGroups.length === 0 ? (
        <div className="px-6 py-12 text-[13px] opacity-55">
          {favoritesOnly
            ? "Noch keine Favoriten gesetzt — ★ bei einem Charakter klicken."
            : "Keine Charaktere gefunden."}
        </div>
      ) : (
        realmGroups.map((group) => (
          <RealmSection
            key={group.slug}
            group={group}
            mode={mode}
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
 * Ein Realm-Abschnitt. Meldet sich, sobald er in Sichtweite kommt,
 * damit erst dann Gegenstandsstufen und Avatare geladen werden.
 */
function RealmSection({
  group,
  mode,
  details,
  onVisible,
  onToggleFavorite,
}: {
  group: RealmGroup
  mode: GameMode
  details: DetailMap
  onVisible: (chars: CharacterWithMeta[]) => void
  onToggleFavorite: (char: CharacterWithMeta) => void
}) {
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
  }, [group.slug, onVisible])

  const loadedCount = group.characters.filter(
    (c) => details[detailKey(c.realm.slug, c.name)]
  ).length
  const pendingDetails = hasItemLevel(mode) && loadedCount < group.characters.length

  return (
    <section ref={sectionRef}>
      {/* Realm-Zwischenüberschrift */}
      <div className="flex items-baseline gap-3 border-b border-line bg-surface px-6 py-2">
        <span className="font-heading text-[13px] font-extrabold uppercase tracking-[0.06em]">
          {group.name}
        </span>
        <span className="eyebrow">
          {group.characters.length}{" "}
          {group.characters.length === 1 ? "Charakter" : "Charaktere"}
        </span>
        {pendingDetails && (
          <span className="eyebrow ml-auto animate-pulse">Lade Werte…</span>
        )}
      </div>

      {group.characters.map((char) => (
        <CharacterCard
          key={`${char.realm.slug}-${char.name}`}
          character={char}
          mode={mode}
          details={details[detailKey(char.realm.slug, char.name)]}
          detailsPending={hasItemLevel(mode) && !details[detailKey(char.realm.slug, char.name)]}
          onToggleFavorite={() => onToggleFavorite(char)}
        />
      ))}
    </section>
  )
}
