import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProgressPanel } from "@/components/ProgressPanel"
import { attempt, characterFromParam, raids, dungeons } from "@/lib/character"
import { parseProgress } from "@/lib/progress"
import { getT, getFormat } from "@/lib/t"

export default async function ProgressPage({
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

  const [raidResult, dungeonResult] = await Promise.all([
    attempt(() => raids(ref, token)),
    attempt(() => dungeons(ref, token)),
  ])

  const raidProgress = parseProgress(raidResult.value)
  const dungeonProgress = parseProgress(dungeonResult.value)

  const stale = raidResult.stale || dungeonResult.stale
  const fetchedAt = raidResult.fetchedAt ?? dungeonResult.fetchedAt

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>{t("tab.progress")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("progress.intro")}</p>
      </div>

      {stale && (
        <div className="mb-4 border-2 border-line px-4 py-2">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            {fetchedAt
              ? t("weekly.lastKnownFrom", { date: f.date(fetchedAt.getTime()) })
              : t("weekly.lastKnown")}
          </span>
        </div>
      )}

      <div className="space-y-10">
        <section>
          <h4 className="mb-3">{t("progress.raids")}</h4>
          <ProgressPanel
            expansions={raidProgress}
            emptyLabel={
              raidResult.notFound
                ? t("core.noDataYetText")
                : raidResult.failed
                ? t("progress.raidEndpointFailed")
                : t("progress.noRaidProgress")
            }
          />
        </section>

        <section>
          <h4 className="mb-3">{t("progress.dungeons")}</h4>
          <ProgressPanel
            expansions={dungeonProgress}
            emptyLabel={
              dungeonResult.notFound
                ? t("core.noDataYetText")
                : dungeonResult.failed
                ? t("progress.dungeonEndpointFailed")
                : t("progress.noDungeonProgress")
            }
          />
        </section>
      </div>
    </div>
  )
}
