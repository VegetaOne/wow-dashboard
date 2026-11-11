import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { WeeklyOverview } from "@/components/WeeklyOverview"
import { ResetCountdown } from "@/components/ResetCountdown"
import { GAME_LABEL, getCharacters, isNotFound, type WoWCharacter } from "@/lib/battlenet"
import { buildWeeklyOverview } from "@/lib/weekly"
import { isOwner, loadConfig, toView } from "@/lib/config"
import { translator } from "@/lib/i18n"

/**
 * Wochenübersicht über alle Forever-Charaktere des Accounts.
 *
 * Account-Seite, kein Charakter-Tab: die Frage „was steht diese Woche noch
 * an" stellt sich für den ganzen Kader auf einmal, nicht je Charakter.
 */
export default async function WeeklyPage() {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const config = await loadConfig()
  const t = translator(config.language)

  // Favoriten spielen hier keine Rolle – leeres Set statt eines
  // Datenbankzugriffs, den die Seite nicht braucht. Ein Account ohne
  // Forever-Charakter antwortet mit 404: das ist eine leere Liste.
  let characters: WoWCharacter[] = []
  try {
    characters = await getCharacters(session.accessToken, new Set<string>())
  } catch (error) {
    if (!isNotFound(error)) throw error
  }

  const data = await buildWeeklyOverview(characters, session.accessToken)

  const totalOpen = data.characters.reduce(
    (sum, c) => sum + c.instances.filter((i) => i.open).length,
    0
  )

  return (
    <div className="min-h-screen bg-ground">
      <Header
        battleTag={session.battleTag}
        canChangeLanguage={isOwner(toView(config), session.battleTag)}
      />

      <div className="border-b border-line px-6 py-2.5">
        <Link href="/dashboard" className="btn btn-ghost text-[13px]">
          {t("weekly.back")}
        </Link>
      </div>

      <div className="border-b-2 border-line px-6 py-6">
        <span className="eyebrow">
          {t("weekly.account", { mode: GAME_LABEL })}
        </span>
        <h2 className="mt-0.5">{t("weekly.heading")}</h2>
        <p className="mt-1 max-w-[70ch] text-[13px] opacity-60">
          {t("weekly.intro")}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-10 border-b-2 border-line px-6 py-5">
        <ResetCountdown
          targetIso={data.weekEnd.toISOString()}
          label={t("weekly.weeklyResetIn")}
        />
        <ResetCountdown
          targetIso={data.dailyEnd.toISOString()}
          label={
            data.config.dailyUncertain
              ? t("weekly.dailyResetInUncertain")
              : t("weekly.dailyResetIn")
          }
        />
        <div>
          <span className="eyebrow">{t("weekly.openInstances")}</span>
          <div className="font-heading text-[22px] font-extrabold leading-none tracking-[-0.02em]">
            {totalOpen}
          </div>
        </div>
        <div className="max-w-[46ch]">
          <span className="eyebrow">
            {t("weekly.region", { region: data.config.region.toUpperCase() })}
          </span>
          <p className="mt-0.5 text-[12px] opacity-55">
            {data.config.assumed
              ? t("weekly.regionAssumed")
              : t("weekly.regionKnown")}
          </p>
        </div>
      </div>

      <main className="px-6 py-6">
        <WeeklyOverview
          characters={data.characters}
          generatedAtMs={data.generatedAt.getTime()}
          language={config.language}
        />
      </main>
    </div>
  )
}
