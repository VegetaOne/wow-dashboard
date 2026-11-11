import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EconomyPanel } from "@/components/EconomyPanel"
import { NoDataYet } from "@/components/NoDataYet"
import { attempt, characterFromParam, professions as loadProfessions } from "@/lib/character"
import { parseProfessions } from "@/lib/professions"
import { getT } from "@/lib/t"

export default async function EconomyPage({
  params,
}: {
  params: { character: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const ref = characterFromParam(params.character)
  const t = await getT()

  const result = await attempt(() =>
    loadProfessions(ref, session.accessToken!)
  )
  const professions = parseProfessions(result.value)

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>{t("economy.heading")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("economy.intro")}</p>
      </div>

      <div className="mb-6 border-2 border-line px-4 py-3 text-[12px] opacity-75">
        <span className="eyebrow block">{t("economy.excludedTitle")}</span>
        {t("economy.excludedText")}
      </div>

      {result.notFound ? (
        <NoDataYet />
      ) : result.failed ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">{t("economy.professionsUnavailable")}</span>
          {t("economy.professionsUnavailableText")}
        </div>
      ) : (
        <EconomyPanel professions={professions} />
      )}
    </div>
  )
}
