"use client"

import Link from "next/link"
import type { CharacterDetails, WoWCharacter } from "@/lib/battlenet"
import { characterBase } from "@/lib/characterTabs"
import { classIconUrl, hideIfBroken } from "@/lib/gameIcons"
import { classCode } from "@/lib/i18n"
import { useFormat, useLanguage, useT } from "./I18nProvider"
import { FactionMedallion } from "./FactionMedallion"

/** Plätze auf der Bühne – fest wie in der Übergabe, damit die Reihe nie umbricht. */
export const STAGE_SLOTS = 5

/**
 * Höhe der Bildfläche. Die Übergabe lässt sie mit `flex:1` wachsen und
 * deckelt bei 44vh; auf hohen Bildschirmen blieb darunter eine leere Karte
 * stehen. Feste Spanne statt Wachsen – die Karten stehen mittig im Band.
 */
const RENDER_HEIGHT = "clamp(200px, 44vh, 480px)"
/** Bildfläche + Namensplatte + Kennzahl + Rahmeneinzug */
const CARD_HEIGHT = `calc(${RENDER_HEIGHT} + 113px)`

type StageCharacter = WoWCharacter & { isFavorite?: boolean }

/**
 * Kriegsschar-Bühne (Warband-Übergabe, Band 2): die Favoriten als Figuren
 * auf einem Aufsteller. Immer fünf Plätze; freie zeigen, wie man sie füllt.
 *
 * Abweichungen von der Übergabe:
 * - Das Bild ist der Render aus der API (`character-media`), kein Upload –
 *   entschieden 2026-11-12. Fehlt er (Forever liefert Bilder verzögert),
 *   bleibt die Fläche mit Hinweis leer.
 * - Ein Klick öffnet die Heldenakte des Charakters als eigene Seite statt
 *   die Akte darunter zu tauschen: so lädt jede Ansicht ihre Daten selbst.
 */
export function WarbandStage({
  characters,
  details,
  total,
  favoriteCount,
}: {
  characters: StageCharacter[]
  details: Record<string, CharacterDetails>
  total: number
  favoriteCount: number
}) {
  const t = useT()
  const slots = Array.from({ length: STAGE_SLOTS }, (_, i) => characters[i] ?? null)
  const overflow = Math.max(0, favoriteCount - STAGE_SLOTS)

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{
        minHeight: "calc(100vh - 64px)",
        background:
          "radial-gradient(ellipse 120% 90% at 50% 8%, var(--wb-panel-2) 0%, var(--wb-stone) 48%, var(--wb-void) 100%)",
      }}
    >
      {/* Steingitter und Bodenvignette – nur Dekor. Das Gitter über
          --wb-gold-faint statt schwarzer Linien: rgba(0,0,0,…) zeichnet auf
          Pergament ein grobes Raster (Regel der Übergabe zu Platten). */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--wb-gold-faint) 0 1px, transparent 1px 90px), repeating-linear-gradient(0deg, var(--wb-gold-faint) 0 1px, transparent 1px 90px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 55% at 50% 118%, var(--wb-scrim) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative px-[22px] pt-7">
        <h2 className="wb-band-title" style={{ textShadow: "none" }}>
          {t("stage.title")}
        </h2>
        <p className="mt-2 text-center text-[14px] italic" style={{ color: "var(--wb-ink-dim)" }}>
          {t("stage.subtitle", { favorites: Math.min(favoriteCount, STAGE_SLOTS), slots: STAGE_SLOTS, count: total })}
          {overflow > 0 && ` · ${t("stage.more", { count: overflow })}`}
        </p>
      </div>

      <div
        className="relative flex flex-1 flex-nowrap items-center justify-center px-[22px] pb-1.5 pt-[18px]"
        style={{ gap: "clamp(6px, 1.1vw, 20px)" }}
      >
        {slots.map((char, i) =>
          char ? (
            <StageCard key={char.slug} character={char} details={details[char.slug]} />
          ) : (
            <EmptySlot key={`leer-${i}`} />
          ),
        )}
      </div>

      {/* Scroll-Hinweis */}
      <div className="relative flex items-center justify-center gap-4 pb-5 pt-3">
        <span className="h-px w-[130px]" style={{ background: "var(--wb-gold-faint)" }} />
        <span className="flex flex-col items-center gap-1">
          <span className="font-heading text-[10px] uppercase" style={{ letterSpacing: "0.3em", color: "var(--wb-ink-dim)" }}>
            {t("stage.scrollHint")}
          </span>
          <span style={{ color: "var(--wb-gold)", animation: "wbBob 3.4s ease-in-out infinite" }} aria-hidden>
            ▼
          </span>
        </span>
        <span className="h-px w-[130px]" style={{ background: "var(--wb-gold-faint)" }} />
      </div>
    </section>
  )
}

const CARD_CLIP = "polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)"

function StageCard({ character, details }: { character: StageCharacter; details?: CharacterDetails }) {
  const t = useT()
  const f = useFormat()
  const language = useLanguage()
  const horde = character.faction.type === "HORDE"
  const factionText = horde ? "var(--wb-horde-lit)" : "var(--wb-ally-lit)"
  const render = details?.renderUrl ?? null
  const fullName = character.surname ? `${character.name} ${character.surname}` : character.name
  const classIcon = classIconUrl(character.playable_class.id)

  return (
    <Link
      href={characterBase(character.slug)}
      className="group relative flex min-w-0 max-w-[268px] flex-col no-underline transition-transform duration-[260ms] ease-out hover:-translate-y-4 hover:scale-[1.035] focus-visible:-translate-y-4"
      style={{ flex: "1 1 130px" }}
    >
      {/* Aura beim Hervorheben */}
      <span
        className="pointer-events-none absolute -left-[9%] bottom-0 h-[52%] w-[118%] opacity-0 transition-opacity duration-[260ms] group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${horde ? "rgba(200,50,31,0.5)" : "rgba(63,111,180,0.5)"} 0%, transparent 72%)`,
        }}
        aria-hidden
      />

      <span
        className="relative flex flex-col border transition-shadow duration-[260ms] group-hover:border-[color:var(--wb-gold)] group-hover:[box-shadow:0_0_0_1px_var(--wb-gold),0_0_34px_rgba(201,161,75,0.45),0_20px_40px_var(--wb-plate-2)]"
        style={{
          clipPath: CARD_CLIP,
          borderColor: "var(--wb-gold-faint)",
          background: "linear-gradient(180deg, var(--wb-plate-3), var(--wb-plate-2))",
          boxShadow: "0 12px 26px var(--wb-plate-2)",
        }}
      >
        {/* Bildfläche */}
        <span
          className="relative mx-[5px] mt-[5px] flex items-end justify-center overflow-hidden"
          style={{
            height: RENDER_HEIGHT,
            background: "linear-gradient(180deg, var(--wb-panel) 0%, var(--wb-deep) 100%)",
          }}
        >
          {render ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={render}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "50% 20%" }}
              loading="lazy"
            />
          ) : (
            <span className="mb-6 text-[11px] italic" style={{ color: "var(--wb-ink-dim)" }}>
              {details ? t("stage.noRender") : t("card.loading")}
            </span>
          )}
        </span>

        {/* Klassenplakette. Das Kürzel liegt unter dem Bild: lädt das Icon
            nicht, wird es ausgeblendet und das Kürzel bleibt lesbar stehen. */}
        <span
          className="absolute left-[9px] top-[9px] grid h-[38px] w-[38px] place-items-center overflow-hidden border font-heading text-[12px] font-bold"
          style={{
            borderColor: "var(--wb-gold)",
            background: "linear-gradient(180deg, var(--wb-plate-2), var(--wb-plate))",
            color: factionText,
            boxShadow: "0 2px 8px var(--wb-plate-2)",
          }}
          title={character.playable_class.name}
        >
          {classCode(language, character.playable_class.id)}
          {classIcon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={classIcon}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              ref={hideIfBroken}
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          )}
        </span>

        {/* Namensplatte */}
        <span
          className="flex h-14 flex-none flex-col items-center justify-center border-t px-2 text-center"
          style={{
            borderColor: "var(--wb-gold-faint)",
            background: "linear-gradient(180deg, var(--wb-plate-2), var(--wb-plate-3))",
          }}
        >
          <span
            className="block w-full truncate font-heading font-black"
            style={{
              fontSize: "clamp(13px, 1.2vw, 17px)",
              letterSpacing: "0.06em",
              color: factionText,
              textShadow: "0 1px 0 var(--wb-emboss)",
            }}
          >
            {fullName}
          </span>
          <span
            className="block w-full truncate text-[11px] uppercase"
            style={{ letterSpacing: "0.08em", color: "var(--wb-ink-dim)" }}
          >
            {character.playable_race.name} {character.playable_class.name}
          </span>
        </span>

        {/* Kennzahl: die Stufe. Die Gegenstandsstufe ist beim Leveln noch
            keine Aussage und gehört nicht auf die Bühne. */}
        <span
          className="mx-[5px] mb-[5px] flex flex-col items-center border-t px-1 py-[7px]"
          style={{ borderColor: "var(--wb-gold-faint)" }}
        >
          <span className="font-heading text-[15px] font-bold" style={{ color: "var(--wb-gold-lit)" }}>
            {character.level ? f.number(character.level) : "—"}
          </span>
          <span className="text-[9px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--wb-ink-dim)" }}>
            {t("card.level")}
          </span>
        </span>
      </span>

      {/* Wappen-Medaillon oben rechts */}
      <span className="absolute -right-[3px] -top-[3px]">
        <FactionMedallion faction={character.faction.type} framed />
      </span>

      {/* Sockelschatten */}
      <span
        className="mx-auto mt-1 h-4 w-[82%]"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,161,75,0.32) 0%, transparent 70%)" }}
        aria-hidden
      />
    </Link>
  )
}

function EmptySlot() {
  const t = useT()
  return (
    <div className="flex min-w-0 max-w-[268px] flex-col" style={{ flex: "1 1 130px" }}>
      <div
        className="flex flex-col items-center justify-center gap-1 border border-dashed px-3 text-center"
        style={{ height: CARD_HEIGHT, clipPath: CARD_CLIP, borderColor: "var(--wb-gold-faint)", background: "var(--wb-plate-3)" }}
      >
        <span className="font-heading text-[13px] font-bold uppercase" style={{ letterSpacing: "0.14em", color: "var(--wb-ink-dim)" }}>
          {t("stage.emptySlot")}
        </span>
        <span className="text-[11px] italic" style={{ color: "var(--wb-ink-dim)" }}>
          {t("stage.emptyHint")}
        </span>
      </div>
      <span className="mt-1 h-4" aria-hidden />
    </div>
  )
}
