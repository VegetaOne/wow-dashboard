import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getAuthOptions } from "@/lib/auth"
import { Header } from "@/components/Header"
import { SettingsForm } from "@/components/SettingsForm"
import { isOwner, loadConfig, toView } from "@/lib/config"
import { translator, type Translate } from "@/lib/i18n"
import { createFormat, type Format } from "@/lib/format"
import { lastRefresh, type RefreshStatus } from "@/lib/refresher"
import { nextRefreshAt, resetConfig } from "@/lib/reset"

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
  const f = createFormat(config.language)
  const refresh = owner ? await lastRefresh() : null

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
            <RefreshInfo
              status={refresh}
              next={nextRefreshAt(new Date(), resetConfig(config.region))}
              t={t}
              f={f}
            />
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

/** Datum und Uhrzeit in UTC – der Container läuft in UTC, die Resets auch. */
function stamp(date: Date, f: Format): string {
  const hh = String(date.getUTCHours()).padStart(2, "0")
  const mm = String(date.getUTCMinutes()).padStart(2, "0")
  return `${f.date(date.getTime())} ${hh}:${mm} UTC`
}

/**
 * Stand der Hintergrund-Auffrischung – nur Auskunft, nichts zum Einstellen.
 * Ein ausgefallener Lauf sagt, warum; eine stille Lücke im Verlauf wäre
 * sonst nicht zu erklären.
 */
function RefreshInfo({
  status,
  next,
  t,
  f,
}: {
  status: RefreshStatus | null
  next: Date
  t: Translate
  f: Format
}) {
  const off = process.env.WOW_REFRESH === "off"

  return (
    <div className="mt-8 border-2 border-line px-4 py-3 text-[13px]">
      <span className="eyebrow block">{t("settings.refresh.heading")}</span>
      <p className="mt-1 max-w-[70ch] opacity-75">{t("settings.refresh.intro")}</p>
      <p className="mt-2">
        {off
          ? t("settings.refresh.off")
          : !status
            ? t("settings.refresh.never")
            : status.reason && status.reason !== "unauthorized"
              ? `${stamp(status.startedAt, f)}: ${t(`settings.refresh.reason.${status.reason}`)}`
              : t("settings.refresh.last", {
                  date: stamp(status.startedAt, f),
                  refreshed: f.number(status.refreshed),
                  total: f.number(status.total),
                })}
      </p>
      {!off && status?.reason === "unauthorized" && (
        <p className="mt-1">{t("settings.refresh.reason.unauthorized")}</p>
      )}
      {!off && status && !status.reason && status.failed > 0 && (
        <p className="mt-1">
          {t("settings.refresh.failed", { failed: f.number(status.failed) })}
        </p>
      )}
      {!off && (
        <p className="mt-1 opacity-60">
          {t("settings.refresh.next", { date: stamp(next, f) })}
        </p>
      )}
    </div>
  )
}
