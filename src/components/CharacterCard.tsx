"use client"

import Link from "next/link"
import type { WoWCharacter, GameMode, CharacterDetails } from "@/lib/battlenet"
import { CLASS_COLORS } from "@/lib/battlenet"
import { characterBase } from "@/lib/characterTabs"
import { classCode } from "@/lib/i18n"
import { useLanguage, useT } from "./I18nProvider"

interface CharacterCardProps {
  character: WoWCharacter & { isFavorite?: boolean }
  onToggleFavorite: () => void
  mode?: GameMode
  /** Gegenstandsstufe und Avatar – werden nachgeladen, sobald der Realm sichtbar ist */
  details?: CharacterDetails
  /** true, solange die Werte noch unterwegs sind */
  detailsPending?: boolean
  /** "Kante" färbt nur die linke Kante, "Fläche" tönt die ganze Zeile */
  tint?: "edge" | "fill"
}

export function CharacterCard({
  character,
  onToggleFavorite,
  mode = "retail",
  details,
  detailsPending = false,
  tint = "edge",
}: CharacterCardProps) {
  const t = useT()
  const language = useLanguage()

  const isAlliance = character.faction.type === "ALLIANCE"
  const band = isAlliance ? "var(--faction-alliance)" : "var(--faction-horde)"
  const classColor = CLASS_COLORS[character.playable_class.id] ?? "#FFFFFF"
  const code = classCode(language, character.playable_class.id)
  // Modus steht im Pfad: derselbe Name kann in mehreren Modi existieren
  const href = characterBase(mode, character.realm.slug, character.name.toLowerCase())

  // Retail: Gegenstandsstufe als Hauptkennzahl.
  // Classic und Classic Era liefern keine — dort die Stufe.
  const showItemLevel = mode === "retail"
  const metric = showItemLevel ? details?.equippedItemLevel : character.level
  const metricLabel = showItemLevel ? t("card.itemLevel") : t("card.level")

  return (
    <div
      className="flex items-center gap-4 border-b border-line pr-6 hover:bg-ink/5"
      style={{
        background:
          tint === "fill"
            ? `color-mix(in srgb, ${band} 12%, transparent)`
            : "transparent",
      }}
    >
      <span className="w-1 self-stretch" style={{ background: band }} aria-hidden />

      <span className="class-code" title={character.playable_class.name}>
        {code}
      </span>

      <span className="h-3 w-3 flex-none" style={{ background: classColor }} aria-hidden />

      <Link href={href} className="flex min-w-0 flex-1 basis-[150px] flex-col py-2.5 no-underline">
        <span className="font-heading text-[15px] font-extrabold leading-tight text-ink">
          {character.name}
        </span>
        {/* Realm steht in der Gruppenüberschrift, hier wäre er doppelt */}
        <span className="text-[11px] uppercase tracking-[0.05em] opacity-55">
          {character.playable_race.name} {character.playable_class.name}
        </span>
      </Link>

      <span className="w-14 flex-none text-right">
        <span className="block eyebrow">{metricLabel}</span>
        <Metric
          value={metric}
          pending={detailsPending && showItemLevel}
          loadingLabel={t("card.loading")}
        />
      </span>

      <span className="hidden w-14 flex-none text-right text-[13px] opacity-75 sm:block">
        <span className="block eyebrow">{t("card.averageItemLevel")}</span>
        <Metric
          value={details?.averageItemLevel}
          pending={detailsPending && showItemLevel}
          loadingLabel={t("card.loading")}
          small
        />
      </span>

      <span className="hidden w-24 flex-none sm:block">
        <span className="block eyebrow">{t("card.faction")}</span>
        <span className="text-[12px]">
          {isAlliance ? t("card.alliance") : t("card.horde")}
        </span>
      </span>

      <button
        onClick={onToggleFavorite}
        aria-pressed={!!character.isFavorite}
        title={
          character.isFavorite ? t("card.favoriteRemove") : t("card.favoriteAdd")
        }
        className="w-9 flex-none border border-line py-1.5 text-[13px]"
        style={{
          background: character.isFavorite ? "var(--color-accent)" : "transparent",
          color: character.isFavorite ? "var(--color-bg)" : "var(--color-text)",
        }}
      >
        ★
      </button>

      <Link href={href} className="btn btn-secondary hidden lg:inline-flex">
        {t("card.gear")}
      </Link>
    </div>
  )
}

/** Zeigt einen Wert, einen Platzhalter-Puls oder einen Strich. */
function Metric({
  value,
  pending,
  loadingLabel,
  small = false,
}: {
  value?: number
  pending: boolean
  loadingLabel: string
  small?: boolean
}) {
  if (typeof value === "number") {
    return small ? (
      <>{value}</>
    ) : (
      <span className="font-heading text-[16px] font-extrabold">{value}</span>
    )
  }

  if (pending) {
    return (
      <span
        className="ml-auto block animate-pulse bg-neutral-300"
        style={{ height: small ? 12 : 16, width: small ? 24 : 32 }}
        aria-label={loadingLabel}
      />
    )
  }

  return small ? <>—</> : <span className="font-heading text-[16px] font-extrabold">—</span>
}
