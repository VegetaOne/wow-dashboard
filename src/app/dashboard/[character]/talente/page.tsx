import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CharacterTalents, type BuildOption, type CharacterGroupView } from "@/components/CharacterTalents"
import { NoDataYet } from "@/components/NoDataYet"
import { attempt, characterFromParam, profile, specializations } from "@/lib/character"
import { getClassTalents } from "@/lib/talents"
import { getTargets, listBuilds } from "@/lib/talent-builds"
import { allocationFromRanks, groupsFromCharacter } from "@/lib/talent-tree"
import { getOrCreateUser } from "@/lib/db"
import { getT, getFormat } from "@/lib/t"
import { region } from "@/lib/runtime"

export default async function TalentsPage({
  params,
}: {
  params: { character: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const t = await getT()
  const f = await getFormat()
  const ref = characterFromParam(params.character)
  const token = session.accessToken

  const [specResult, profileResult] = await Promise.all([
    attempt(() => specializations(ref, token)),
    attempt(() => profile(ref, token)),
  ])

  // Spezialisierungen mit Punkten verraten die Bäume; ohne Punkte die Klasse
  const specIds = (specResult.value?.specialization_groups ?? [])
    .flatMap((g) => g.specializations ?? [])
    .map((s) => s.specialization?.id)
    .filter((id): id is number => typeof id === "number")

  const talents = await getClassTalents(token, {
    classId: profileResult.value?.classId ?? null,
    specIds,
  }).catch((error) => {
    console.error("Talentbäume nicht abrufbar:", error)
    return null
  })

  const classId = talents?.classId ?? profileResult.value?.classId ?? null

  // Builds der Klasse und aktivierte Ziele – Nutzerdaten, nicht aus der API
  const user = await getOrCreateUser(session.battleTag ?? "unknown")
  const [saved, targets] = await Promise.all([
    classId !== null ? listBuilds(user.id, region(), classId) : Promise.resolve([]),
    getTargets(user.id, region(), ref.slug),
  ])

  const groups: CharacterGroupView[] = talents
    ? groupsFromCharacter(specResult.value).map((g) => ({
        index: g.index,
        active: g.active,
        ...allocationFromRanks(talents.trees, g.ranks),
      }))
    : []
  const builds: BuildOption[] = talents
    ? saved.map((b) => ({ id: b.id, name: b.name, allocation: allocationFromRanks(talents.trees, b.ranks).allocation }))
    : []

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>{t("tab.talents")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("talents.intro")}</p>
      </div>

      {specResult.stale && (
        <div className="mb-4 border-2 border-line px-4 py-2">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            {specResult.fetchedAt
              ? t("weekly.lastKnownFrom", { date: f.date(specResult.fetchedAt.getTime()) })
              : t("weekly.lastKnown")}
          </span>
        </div>
      )}

      {specResult.notFound ? (
        <NoDataYet />
      ) : !talents || talents.trees.length === 0 ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">{t("talents.unavailable")}</span>
          {t("talents.unavailableText")}
        </div>
      ) : (
        <CharacterTalents
          slug={ref.slug}
          classId={classId}
          talents={talents}
          groups={groups}
          builds={builds}
          initialTargets={targets}
        />
      )}
    </div>
  )
}
