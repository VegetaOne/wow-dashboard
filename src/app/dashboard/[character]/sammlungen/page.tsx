import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CollectionPanel } from "@/components/CollectionPanel"
import { TitleList } from "@/components/TitleList"
import { NoDataYet } from "@/components/NoDataYet"
import { attempt, characterFromParam, profile, toys, titles } from "@/lib/character"
import { displayNameFromSlug } from "@/lib/battlenet"
import { parseToys, parseTitles, getToyIndex } from "@/lib/collections"
import { getT, getFormat } from "@/lib/t"

/**
 * Charakterbezogene Sammlungen: Titel und Spielzeug.
 * Reittiere und Begleiter hängen am Account und stehen dort.
 */
export default async function CollectionsPage({
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

  const [titleResult, toyResult, toyIndex, profileResult] = await Promise.all([
    attempt(() => titles(ref, token)),
    attempt(() => toys(ref, token)),
    getToyIndex(token),
    attempt(() => profile(ref, token)),
  ])

  // Titel setzen den Vornamen ein („%s der Unermüdliche") – der Nachname
  // gehört nicht hinein. Fehlt das Profil, ist der erste Teil des Slugs
  // die beste verfügbare Schreibweise.
  const firstName =
    profileResult.value?.name ?? displayNameFromSlug(ref.slug.split("-")[0])
  const titleView = parseTitles(titleResult.value, firstName)
  const toyView = parseToys(toyResult.value, toyIndex)

  const stale = titleResult.stale || toyResult.stale
  const fetchedAt = titleResult.fetchedAt ?? toyResult.fetchedAt

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>{t("tab.collections")}</h3>
        <p className="mt-1 text-[13px] opacity-60">
          {t("collections.intro")}{" "}
          <Link href="/dashboard/account" className="btn btn-ghost text-[13px]">
            {t("collections.accountOverviewLink")}
          </Link>
        </p>
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

      <div className="space-y-8">
        {titleResult.notFound ? (
          <NoDataYet />
        ) : titleResult.failed ? (
          <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
            {t("collections.titlesLoadFailed")}
          </div>
        ) : (
          <TitleList view={titleView} />
        )}

        {toyResult.notFound ? (
          <NoDataYet />
        ) : toyResult.failed ? (
          <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
            {t("collections.toysLoadFailed")}
          </div>
        ) : (
          <CollectionPanel view={toyView} />
        )}
      </div>
    </div>
  )
}
