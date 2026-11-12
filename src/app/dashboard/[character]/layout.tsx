import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { ActiveSectionLabel, CharacterTabs, SectionCount } from "@/components/CharacterTabs"
import { FactionMedallion } from "@/components/FactionMedallion"
import { NoDataYet } from "@/components/NoDataYet"
import { displayNameFromSlug } from "@/lib/battlenet"
import { attempt, characterFromParam, media, profile } from "@/lib/character"
import { getT, getFormat } from "@/lib/t"
import { region } from "@/lib/runtime"

/**
 * Rahmen aller Charakter-Unterseiten als Heldenakte (Warband-Übergabe,
 * Band 3): Bandkopf mit Titel und Reitern, Aktenrahmen mit Kopf (Medaillon,
 * Name in Fraktionsfarbe, Unterzeile, aktiver Bereich), Inhalt, Aktenfuss
 * mit der Quelle. Die Unterseiten liefern nur noch Inhalt.
 *
 * Seit WoW Forever ist ein Charakter `{name}-{surname}` – kein Realm, kein
 * Spielmodus im Pfad. Statt des Realms steht das Ruleset im Kopf, wenn das
 * Profil es nennt.
 */
export default async function CharacterLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { character: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const t = await getT()
  const f = await getFormat()
  const ref = characterFromParam(params.character)

  const [mediaResult, profileResult] = await Promise.all([
    attempt(() => media(ref, session.accessToken!)),
    attempt(() => profile(ref, session.accessToken!)),
  ])

  const avatar = mediaResult.value?.avatar ?? null
  const prof = profileResult.value

  // Name aus dem Profil; fehlt es, ist der Slug die beste Schreibweise
  const characterName =
    prof?.name && prof?.surname
      ? `${prof.name} ${prof.surname}`
      : displayNameFromSlug(ref.slug)

  const stale = mediaResult.stale || profileResult.stale

  const faction = prof?.factionType ?? null
  const factionText = faction === "HORDE" ? "var(--wb-horde-lit)" : faction === "ALLIANCE" ? "var(--wb-ally-lit)" : "var(--wb-gold-lit)"

  // Unterzeile: nur, was belegt ist – fehlt alles, steht „—"
  const subline =
    [
      prof?.className ?? null,
      prof?.level != null ? t("character.levelClass", { level: prof.level }) : null,
      prof?.rulesetName ?? null,
      // Ob Forever eine Gegenstandsstufe führt, war nicht belegt – ohne Wert kein Eintrag statt „0"
      prof?.equippedItemLevel != null
        ? `${t("character.itemLevel")} ${f.number(prof.equippedItemLevel)}${
            prof.averageItemLevel != null ? ` (${t("character.averageItemLevel")} ${f.number(prof.averageItemLevel)})` : ""
          }`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—"

  return (
    <div className="min-h-screen">
      <Header battleTag={session.battleTag} />

      <section
        className="pb-8"
        style={{
          background: "linear-gradient(180deg, var(--wb-stone), var(--wb-deep))",
          borderTop: "2px solid var(--wb-gold-faint)",
        }}
      >
        {/* Bandkopf */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 px-[34px] pb-4 pt-5">
          <div className="mr-auto">
            <Link href="/dashboard" className="eyebrow no-underline hover:underline">
              {t("weekly.back")}
            </Link>
            <h1 className="mt-1" style={{ fontSize: 24, letterSpacing: "0.1em" }}>
              {t("akte.title")}
            </h1>
            <p className="mt-0.5 text-[13px] italic" style={{ color: "var(--wb-ink-dim)" }}>
              <SectionCount slug={ref.slug} />
            </p>
          </div>
          <CharacterTabs slug={ref.slug} />
        </div>

        {/* Aktenrahmen */}
        <div className="wb-plate mx-[34px]">
          {/* Aktenkopf */}
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-[22px] py-3"
            style={{
              borderColor: "var(--wb-gold-faint)",
              background: "linear-gradient(180deg, rgba(201,161,75,0.12), transparent)",
            }}
          >
            {faction ? (
              <FactionMedallion faction={faction} size={32} />
            ) : avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-9 w-9 flex-none border" style={{ borderColor: "var(--wb-gold-faint)" }} />
            ) : null}
            <div className="mr-auto min-w-0">
              <h2
                className="truncate"
                style={{ fontSize: 19, letterSpacing: "0.06em", color: factionText }}
              >
                {characterName}
              </h2>
              <span className="text-[11px] uppercase" style={{ letterSpacing: "0.08em", color: "var(--wb-ink-dim)" }}>
                {subline}
              </span>
            </div>
            <ActiveSectionLabel slug={ref.slug} />
          </div>

          {/* Offen sagen, wenn die Werte aus dem Speicher kommen, weil die API
              gerade nicht erreichbar war – sonst wirken alte Zahlen wie aktuelle. */}
          {stale && (
            <div className="border-b px-[22px] py-1.5" style={{ borderColor: "var(--wb-gold-faint)" }}>
              <span className="eyebrow" style={{ color: "var(--wb-horde-lit)" }}>
                {t("character.staleNotice")}
              </span>
            </div>
          )}

          {/* Profil mit 404: bei Forever fast immer „noch keine Daten", kein Fehler */}
          {profileResult.notFound && (
            <div className="border-b px-[22px] py-3" style={{ borderColor: "var(--wb-gold-faint)" }}>
              <NoDataYet />
            </div>
          )}

          <main style={{ minHeight: 352 }}>{children}</main>

          {/* Aktenfuss */}
          <div
            className="flex flex-wrap justify-between gap-3 border-t px-[22px] py-3 text-[12px]"
            style={{
              borderColor: "var(--wb-gold-faint)",
              background: "linear-gradient(180deg, var(--wb-plate), transparent)",
            }}
          >
            <span>
              <span className="eyebrow mr-2">{t("akte.source")}</span>
              {t("akte.sourceText", { region: region().toUpperCase() })}
            </span>
            <span className="italic" style={{ color: "var(--wb-ink-dim)" }}>
              {t("akte.sourceNote")}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
