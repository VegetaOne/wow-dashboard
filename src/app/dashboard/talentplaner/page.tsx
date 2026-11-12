import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { TalentPlanner, type PlannerSource } from "@/components/TalentPlanner"
import { getCharacters, isCharacterSlug, isNotFound, type WoWCharacter } from "@/lib/battlenet"
import { getOrCreateUser } from "@/lib/db"
import { getClassTalents, listTalentClasses, type TalentClass } from "@/lib/talents"
import { listBuilds } from "@/lib/talent-builds"
import { getT } from "@/lib/t"
import { region } from "@/lib/runtime"

/**
 * Talentplaner (Wunsch 2026-11-12): eine eigene Seite in der Kopfzeile, die
 * Klasse frei wählbar – auch ohne eigenen Charakter dieser Klasse. Builds
 * gehören der Klasse; aktiviert werden sie je Charakter im Bereich „Talente".
 *
 * Adresse: `?class=<id>` wählt die Klasse, `?build=<id>` den Build,
 * `?from=<slug>&group=<n>` beginnt einen neuen Build aus dem Spiel.
 */
export default async function TalentPlannerPage({
  searchParams,
}: {
  searchParams: { class?: string; build?: string; from?: string; group?: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")
  const token = session.accessToken

  const t = await getT()

  // Charaktere nur als Ausgangspunkt für neue Builds und für die Vorwahl
  // der Klasse. Ein Account ohne Forever-Charakter antwortet mit 404.
  let characters: WoWCharacter[] = []
  try {
    characters = await getCharacters(token, new Set<string>())
  } catch (error) {
    if (!isNotFound(error)) console.error("Charaktere für den Talentplaner nicht abrufbar:", error)
  }

  const classes: TalentClass[] = await listTalentClasses(token).catch((error) => {
    console.error("Klassen für den Talentplaner nicht abrufbar:", error)
    return []
  })

  const requested = Number(searchParams.class)
  const classId =
    classes.find((c) => c.classId === requested)?.classId ??
    classes.find((c) => c.classId === characters[0]?.playable_class.id)?.classId ??
    classes[0]?.classId ??
    null

  const talents =
    classId !== null
      ? await getClassTalents(token, { classId }).catch((error) => {
          console.error("Talentbäume nicht abrufbar:", error)
          return null
        })
      : null

  const user = await getOrCreateUser(session.battleTag ?? "unknown")
  const builds = classId !== null ? await listBuilds(user.id, region(), classId) : []

  const sources: PlannerSource[] = characters
    .filter((c) => c.playable_class.id === classId)
    .map((c) => ({ slug: c.slug, name: c.surname ? `${c.name} ${c.surname}` : c.name, level: c.level }))

  const from = (searchParams.from ?? "").toLowerCase()
  const group = Number(searchParams.group)
  const startFrom =
    isCharacterSlug(from) && sources.some((s) => s.slug === from)
      ? { slug: from, group: group === 1 || group === 2 ? group : null }
      : null

  const className = classes.find((c) => c.classId === classId)?.className ?? talents?.className ?? null

  return (
    <div className="min-h-screen">
      <Header battleTag={session.battleTag} />

      <section
        className="pb-8"
        style={{ background: "linear-gradient(180deg, var(--wb-stone), var(--wb-deep))", borderTop: "2px solid var(--wb-gold-faint)" }}
      >
        <div className="px-[34px] pb-4 pt-5">
          <Link href="/dashboard" className="eyebrow no-underline hover:underline">
            {t("weekly.back")}
          </Link>
          <h1 className="mt-1" style={{ fontSize: 24, letterSpacing: "0.1em" }}>
            {t("planner.title")}
          </h1>
          <p className="mt-0.5 max-w-3xl text-[13px] italic" style={{ color: "var(--wb-ink-dim)" }}>
            {t("planner.intro")}
          </p>
        </div>

        <div className="wb-plate mx-[34px]">
          {/* Klassen */}
          <nav
            className="flex flex-wrap items-center gap-2 border-b px-[22px] py-3"
            style={{ borderColor: "var(--wb-gold-faint)", background: "linear-gradient(180deg, rgba(201,161,75,0.12), transparent)" }}
            aria-label={t("planner.classes")}
          >
            <span className="eyebrow mr-2">{t("planner.classes")}</span>
            <div className="flex flex-wrap">
              {classes.map((c) => (
                <Link
                  key={c.classId}
                  href={`/dashboard/talentplaner?class=${c.classId}`}
                  className="wb-tab"
                  aria-current={c.classId === classId ? "page" : undefined}
                >
                  {c.className}
                </Link>
              ))}
            </div>
          </nav>

          {classId === null || !talents || talents.trees.length === 0 ? (
            <div className="px-[22px] py-6 text-[13px]">
              <span className="eyebrow block">{t("talents.unavailable")}</span>
              {t("planner.unavailableText")}
            </div>
          ) : (
            // key: Klassenwechsel beginnt den Planer frisch, ohne Zustand der alten Klasse
            <TalentPlanner
              key={classId}
              talents={talents}
              classId={classId}
              className={className}
              classes={classes}
              initialBuilds={builds}
              initialBuildId={searchParams.build ?? null}
              sources={sources}
              startFrom={startFrom}
            />
          )}
        </div>
      </section>
    </div>
  )
}
