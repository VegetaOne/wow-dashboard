import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { CollectionPanel } from "@/components/CollectionPanel"
import { attempt, accountMounts, accountPets } from "@/lib/character"
import {
  parseMounts,
  parsePets,
  getMountIndex,
  getPetIndex,
} from "@/lib/collections"
import { isOwner, loadConfig, toView } from "@/lib/config"
import { dateLocale, translator } from "@/lib/i18n"

/**
 * Account-weite Sammlungen. Reittiere und Begleiter gelten für alle
 * Charaktere gemeinsam – sie gehören deshalb nicht in die Charakteransicht.
 */
export default async function AccountPage() {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const token = session.accessToken
  const config = await loadConfig()
  const t = translator(config.language)

  const [mountResult, petResult, mountIndex, petIndex] = await Promise.all([
    attempt(() => accountMounts(token)),
    attempt(() => accountPets(token)),
    getMountIndex(token),
    getPetIndex(token),
  ])

  const mounts = parseMounts(mountResult.value, mountIndex)
  const pets = parsePets(petResult.value, petIndex)

  const stale = mountResult.stale || petResult.stale
  const fetchedAt = mountResult.fetchedAt ?? petResult.fetchedAt

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
        <span className="eyebrow">{t("account.eyebrow")}</span>
        <h2 className="mt-0.5">{t("account.heading")}</h2>
        <p className="mt-1 text-[13px] opacity-60">{t("account.intro")}</p>
      </div>

      {stale && (
        <div className="border-b border-line px-6 py-1.5">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            {fetchedAt
              ? t("weekly.lastKnownFrom", {
                  date: fetchedAt.toLocaleDateString(dateLocale(config.language)),
                })
              : t("weekly.lastKnown")}
          </span>
        </div>
      )}

      <main className="space-y-8 px-6 py-6">
        {mountResult.failed && petResult.failed ? (
          <div className="border-2 border-accent px-4 py-3 text-[13px]">
            <span className="eyebrow block">{t("account.unavailable")}</span>
            {t("account.unavailableText")}
          </div>
        ) : (
          <>
            {!mountResult.failed && <CollectionPanel view={mounts} />}
            {!petResult.failed && <CollectionPanel view={pets} />}
          </>
        )}
      </main>
    </div>
  )
}
