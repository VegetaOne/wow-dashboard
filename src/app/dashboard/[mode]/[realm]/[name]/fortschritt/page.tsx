import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProgressPanel } from "@/components/ProgressPanel"
import { MythicPanel } from "@/components/MythicPanel"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, raids, dungeons, mythicKeystone } from "@/lib/character"
import { parseProgress, parseMythicProfile } from "@/lib/progress"
import { getT, getFormat } from "@/lib/t"

export default async function ProgressPage({
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
  const ref = { realm, name, mode }
  const token = session.accessToken

  // Mythisch+ gibt es nur in Retail – in Classic gar nicht anfragen
  const [raidResult, dungeonResult, mythicResult] = await Promise.all([
    attempt(() => raids(ref, token)),
    attempt(() => dungeons(ref, token)),
    mode === "retail"
      ? attempt(() => mythicKeystone(ref, token))
      : Promise.resolve({ value: null, fetchedAt: null, stale: false, failed: false }),
  ])

  const raidProgress = parseProgress(raidResult.value)
  const dungeonProgress = parseProgress(dungeonResult.value)
  const mythic = parseMythicProfile(mythicResult.value)

  const stale = raidResult.stale || dungeonResult.stale || mythicResult.stale
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
        {mythic && (
          <section>
            <MythicPanel profile={mythic} />
          </section>
        )}

        <section>
          <h4 className="mb-3">{t("progress.raids")}</h4>
          <ProgressPanel
            expansions={raidProgress}
            emptyLabel={
              raidResult.failed
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
              dungeonResult.failed
                ? t("progress.dungeonEndpointFailed")
                : t("progress.noDungeonProgress")
            }
          />
        </section>
      </div>
    </div>
  )
}
