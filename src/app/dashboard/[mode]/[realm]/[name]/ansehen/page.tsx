import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReputationList } from "@/components/ReputationList"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, reputations } from "@/lib/character"
import { parseReputations } from "@/lib/reputations"
import { getT, getFormat } from "@/lib/t"

export default async function ReputationsPage({
  params,
}: {
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const t = await getT()
  const f = await getFormat()
  const { realm, name } = params
  const mode = (GAME_MODES.find((m) => m.id === params.mode)?.id ??
    "retail") as GameMode

  const result = await attempt(() =>
    reputations({ realm, name, mode }, session.accessToken!)
  )
  const reps = parseReputations(result.value)

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>{t("reputation.heading")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("reputation.intro")}</p>
      </div>

      {result.failed ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">{t("reputation.unavailable")}</span>
          {t("reputation.unavailableText")}
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

          <ReputationList reputations={reps} />
        </>
      )}
    </div>
  )
}
