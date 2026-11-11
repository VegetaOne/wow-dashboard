import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProfessionsPanel } from "@/components/ProfessionsPanel"
import { NoDataYet } from "@/components/NoDataYet"
import { attempt, characterFromParam, professions } from "@/lib/character"
import { parseProfessions } from "@/lib/professions"
import { getT, getFormat } from "@/lib/t"

export default async function ProfessionsPage({
  params,
}: {
  params: { character: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const t = await getT()
  const f = await getFormat()
  const ref = characterFromParam(params.character)

  const result = await attempt(() =>
    professions(ref, session.accessToken!)
  )

  const parsed = parseProfessions(result.value)

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>{t("professions.eyebrow")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("professions.intro")}</p>
      </div>

      {result.notFound ? (
        <NoDataYet />
      ) : result.failed ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">{t("professions.unavailable")}</span>
          {t("professions.unavailableText")}
        </div>
      ) : (
        <>
          {result.stale && (
            <div className="mb-4 border-2 border-line px-4 py-2">
              <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
                {result.fetchedAt
                  ? t("weekly.lastKnownFrom", { date: f.date(result.fetchedAt.getTime()) })
                  : t("weekly.lastKnown")}
              </span>
            </div>
          )}

          <ProfessionsPanel professions={parsed} />
        </>
      )}
    </div>
  )
}
