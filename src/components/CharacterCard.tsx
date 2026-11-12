"use client"

import Link from "next/link"
import type { WoWCharacter, CharacterDetails } from "@/lib/battlenet"
import { characterBase } from "@/lib/characterTabs"
import { classCode } from "@/lib/i18n"
import { useFormat, useLanguage, useT } from "./I18nProvider"

interface CharacterCardProps {
  character: WoWCharacter & { isFavorite?: boolean }
  onToggleFavorite: () => void
  /** Gegenstandsstufe und Bilder – werden nachgeladen, sobald der Abschnitt sichtbar ist */
  details?: CharacterDetails
  /** true, solange die Werte noch unterwegs sind */
  detailsPending?: boolean
}

/**
 * Zeile der übrigen Charaktere (Warband-Übergabe, Band 4): Fraktionsband,
 * Klassenkürzel in Fraktionsfarbe, Name, zwei Kennzahlen, ★ zum Aufnehmen
 * in die Kriegsschar.
 *
 * Klassenfarben nur als Marker, nie als Text – Weiss und Gelb fallen auf
 * Pergament unter die Lesbarkeitsgrenze (Übergabe, „Fraktionsfarben").
 * Die Schatzkammer-Marker der Übergabe entfallen: Forever führt keine.
 */
export function CharacterCard({
  character,
  onToggleFavorite,
  details,
  detailsPending = false,
}: CharacterCardProps) {
  const t = useT()
  const f = useFormat()
  const language = useLanguage()

  const horde = character.faction.type === "HORDE"
  const band = horde ? "var(--wb-horde)" : "var(--wb-ally)"
  const factionText = horde ? "var(--wb-horde-lit)" : "var(--wb-ally-lit)"
  const href = characterBase(character.slug)
  const fullName = character.surname ? `${character.name} ${character.surname}` : character.name

  return (
    <div
      className="group mb-[5px] flex items-stretch gap-3.5 border transition-colors hover:bg-[rgba(201,161,75,0.12)]"
      style={{
        borderColor: character.isFavorite ? "var(--wb-gold)" : "var(--wb-gold-faint)",
        background: "linear-gradient(90deg, var(--wb-plate), var(--wb-plate-3))",
      }}
    >
      <span className="w-[5px] flex-none" style={{ background: band }} aria-hidden />

      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3.5 py-2 no-underline">
        <span
          className="grid h-[38px] w-[38px] flex-none place-items-center border font-heading text-[12px] font-bold"
          style={{ borderColor: "var(--wb-gold-faint)", background: "var(--wb-plate)", color: factionText }}
          title={character.playable_class.name}
        >
          {classCode(language, character.playable_class.id)}
        </span>

        <span className="flex min-w-0 flex-col" style={{ flex: "1 1 170px" }}>
          <span className="truncate font-heading text-[15px] font-bold" style={{ color: factionText }}>
            {fullName}
          </span>
          <span className="truncate text-[11px] uppercase" style={{ letterSpacing: "0.06em", color: "var(--wb-ink-dim)" }}>
            {character.playable_race.name} {character.playable_class.name}
          </span>
        </span>

        <Metric label={t("card.level")} value={character.level || undefined} pending={false} />
        <span className="hidden sm:block">
          <Metric
            label={t("card.itemLevel")}
            value={details?.equippedItemLevel}
            pending={detailsPending}
            format={f.number}
          />
        </span>
      </Link>

      <span className="flex items-center pr-2">
        <button
          onClick={onToggleFavorite}
          aria-pressed={!!character.isFavorite}
          title={character.isFavorite ? t("card.favoriteRemove") : t("card.favoriteAdd")}
          aria-label={character.isFavorite ? t("card.favoriteRemove") : t("card.favoriteAdd")}
          className="grid h-[38px] w-[38px] place-items-center border text-[15px]"
          style={{
            borderColor: character.isFavorite ? "var(--wb-gold)" : "var(--wb-gold-faint)",
            background: character.isFavorite ? "var(--wb-gold)" : "var(--wb-plate-3)",
            color: character.isFavorite ? "var(--wb-on-gold)" : "var(--wb-gold-lit)",
          }}
        >
          ★
        </button>
      </span>
    </div>
  )
}

/** Kennzahl mit Mikrolabel: Wert, Platzhalter-Puls oder Strich. */
function Metric({
  label,
  value,
  pending,
  format = String,
}: {
  label: string
  value?: number
  pending: boolean
  format?: (n: number) => string
}) {
  return (
    <span className="flex w-[58px] flex-none flex-col items-end">
      <span className="font-heading text-[15px] font-bold" style={{ color: "var(--wb-gold-lit)" }}>
        {typeof value === "number" ? (
          format(value)
        ) : pending ? (
          <span className="mt-1 block h-3.5 w-7 animate-pulse" style={{ background: "var(--wb-gold-faint)" }} />
        ) : (
          "—"
        )}
      </span>
      <span className="text-[9px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--wb-ink-dim)" }}>
        {label}
      </span>
    </span>
  )
}
