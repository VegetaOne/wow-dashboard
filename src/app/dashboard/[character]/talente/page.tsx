import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TalentTrees } from "@/components/TalentTrees"
import { NoDataYet } from "@/components/NoDataYet"
import { attempt, characterFromParam, profile, specializations } from "@/lib/character"
import { getClassTalents } from "@/lib/talents"
import { allocationFromCharacter } from "@/lib/talent-tree"
import { getT, getFormat } from "@/lib/t"

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

  const { allocation, unmatched } = talents
    ? allocationFromCharacter(specResult.value, talents.trees)
    : { allocation: {}, unmatched: 0 }

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
        <TalentTrees talents={talents} allocation={allocation} unmatched={unmatched} />
      )}
    </div>
  )
}
