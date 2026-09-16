import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getAuthOptions } from "@/lib/auth"
import { Header } from "@/components/Header"
import { SettingsForm } from "@/components/SettingsForm"
import { isOwner, loadConfig, toView } from "@/lib/config"
import { translator } from "@/lib/i18n"

/**
 * Einstellungen der Instanz.
 *
 * Dieselben Werte wie im Setup, nur hinter der Anmeldung und ohne die
 * Schritt-für-Schritt-Führung. Ändern darf nur der Besitzer – der Account,
 * der den Setup abgeschlossen hat.
 */
export default async function SettingsPage() {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const config = await loadConfig()
  const view = toView(config)
  const owner = isOwner(view, session.battleTag)
  const t = translator(config.language)

  return (
    <div className="min-h-screen bg-ground">
      <Header battleTag={session.battleTag} canChangeLanguage={owner} />

      <div className="border-b border-line px-6 py-2.5">
        <Link href="/dashboard" className="btn btn-ghost text-[13px]">
          {t("weekly.back")}
        </Link>
      </div>

      <div className="border-b-2 border-line px-6 py-6">
        <span className="eyebrow">{t("settings.instance")}</span>
        <h2 className="mt-0.5">{t("settings.heading")}</h2>
        <p className="mt-1 max-w-[70ch] text-[13px] opacity-60">
          {t("settings.intro")}
          {config.ownerBattleTag &&
            ` ${t("settings.owner", { owner: config.ownerBattleTag })}`}
        </p>
      </div>

      <main className="px-6 py-6">
        {owner ? (
          <div className="max-w-[640px]">
            <SettingsForm config={view} />
          </div>
        ) : (
          <div className="max-w-[640px] border-2 border-accent px-4 py-3 text-[13px]">
            <span className="eyebrow block">{t("settings.noPermission")}</span>
            {t("settings.notOwner", {
              owner: config.ownerBattleTag ?? t("settings.anotherAccount"),
            })}
          </div>
        )}
      </main>
    </div>
  )
}
