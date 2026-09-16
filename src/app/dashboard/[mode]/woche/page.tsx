import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { WeeklyOverview } from "@/components/WeeklyOverview"
import { ResetCountdown } from "@/components/ResetCountdown"
import { GAME_MODES } from "@/lib/battlenet"
import { getCharacters } from "@/lib/battlenet"
import { buildWeeklyOverview } from "@/lib/weekly"
import { isOwner, loadConfig, toView } from "@/lib/config"
import { translator } from "@/lib/i18n"

/**
 * Wochenübersicht über alle Charaktere eines Spielmodus.
 *
 * Account-Seite, kein Charakter-Tab: die Frage „was steht diese Woche noch
 * an" stellt sich für den ganzen Kader auf einmal, nicht je Charakter.
 *
 * Der Modus steht im Pfad, wie bei den Charakterseiten – derselbe Kader
 * sieht in Retail und Classic anders aus.
 */
export default async function WeeklyPage({
  params,
}: {
  params: { mode: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const resolved = GAME_MODES.find((m) => m.id === params.mode)
  if (!resolved) redirect("/dashboard/retail/woche")
  const mode = resolved.id

  const config = await loadConfig()
  const t = translator(config.language)

  // Favoriten spielen hier keine Rolle – leeres Set statt eines
  // Datenbankzugriffs, den die Seite nicht braucht.
  const characters = await getCharacters(
    session.accessToken,
    mode,
    new Set<string>()
  )

  const data = await buildWeeklyOverview(characters, session.accessToken, mode)

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
          {t("weekly.account", { mode: resolved.label })}
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
          mode={mode}
          generatedAtMs={data.generatedAt.getTime()}
          language={config.language}
        />
      </main>
    </div>
  )
}
