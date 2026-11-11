import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { CharacterTabs } from "@/components/CharacterTabs"
import { NoDataYet } from "@/components/NoDataYet"
import { GAME_LABEL, displayNameFromSlug } from "@/lib/battlenet"
import { attempt, characterFromParam, media, profile } from "@/lib/character"
import { getT } from "@/lib/t"

/**
 * Rahmen aller Charakter-Unterseiten: Kopfzeile, Charakterkopf, Tabs.
 * Die Unterseiten liefern nur noch Inhalt.
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

  return (
    <div className="min-h-screen bg-ground">
      <Header battleTag={session.battleTag} />

      {/* Brotkrume */}
      <div className="border-b border-line px-6 py-2.5">
        <Link href="/dashboard" className="btn btn-ghost text-[13px]">
          {t("weekly.back")}
        </Link>
      </div>

      {/* Charakterkopf */}
      <div className="flex flex-wrap items-center gap-5 border-b-2 border-line px-6 py-6">
        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-16 w-16 flex-none border border-line" />
        )}

        <div className="min-w-0">
          <span className="eyebrow">{GAME_LABEL}</span>
          <h2 className="mt-0.5">{characterName}</h2>
          <span className="text-[13px] opacity-60">
            {[
              prof?.level != null ? t("character.levelClass", { level: prof.level }) : null,
              prof?.rulesetName ?? null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </span>
        </div>

        {/* Ob Forever eine Gegenstandsstufe im Profil führt, ist nicht belegt –
            fehlt sie, erscheint der Block gar nicht statt mit „0". */}
        {prof?.equippedItemLevel != null && (
          <div className="ml-auto flex gap-8 border-l-2 border-line pl-6">
            <div>
              <span className="eyebrow">{t("character.itemLevel")}</span>
              <div className="font-heading text-[30px] font-extrabold leading-none tracking-[-0.02em]">
                {prof.equippedItemLevel}
              </div>
            </div>
            {prof.averageItemLevel != null && (
              <div>
                <span className="eyebrow">{t("character.averageItemLevel")}</span>
                <div className="font-heading text-[30px] font-extrabold leading-none tracking-[-0.02em] opacity-60">
                  {prof.averageItemLevel}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offen sagen, wenn die Werte aus dem Speicher kommen, weil die API
          gerade nicht erreichbar war – sonst wirken alte Zahlen wie aktuelle. */}
      {stale && (
        <div className="border-b border-line px-6 py-1.5">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            {t("character.staleNotice")}
          </span>
        </div>
      )}

      {/* Profil mit 404: bei Forever fast immer „noch keine Daten", kein Fehler */}
      {profileResult.notFound && (
        <div className="border-b border-line px-6 py-3">
          <NoDataYet />
        </div>
      )}

      <CharacterTabs slug={ref.slug} />

      <main>{children}</main>
    </div>
  )
}
