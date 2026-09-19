import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CollectionPanel } from "@/components/CollectionPanel"
import { TitleList } from "@/components/TitleList"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, toys, titles } from "@/lib/character"
import { parseToys, parseTitles, getToyIndex } from "@/lib/collections"
import { getT, getFormat } from "@/lib/t"

/**
 * Charakterbezogene Sammlungen: Titel und Spielzeug.
 * Reittiere und Begleiter hängen am Account und stehen dort.
 */
export default async function CollectionsPage({
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

  const [titleResult, toyResult, toyIndex] = await Promise.all([
    attempt(() => titles(ref, token)),
    attempt(() => toys(ref, token)),
    getToyIndex(token, mode),
  ])

  const titleView = parseTitles(titleResult.value, name)
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
        {titleResult.failed ? (
          <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
            {t("collections.titlesLoadFailed")}
          </div>
        ) : (
          <TitleList view={titleView} />
        )}

        {toyResult.failed ? (
          <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
            {t("collections.toysLoadFailed")}
            {mode !== "retail" && (
              <span className="mt-1 block opacity-65">
                {t("collections.classicNoToys")}
              </span>
            )}
          </div>
        ) : (
          <CollectionPanel view={toyView} />
        )}
      </div>
    </div>
  )
}
