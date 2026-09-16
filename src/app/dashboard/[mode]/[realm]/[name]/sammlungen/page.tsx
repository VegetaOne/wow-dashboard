import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CollectionPanel } from "@/components/CollectionPanel"
import { TitleList } from "@/components/TitleList"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, toys, titles } from "@/lib/character"
import { parseToys, parseTitles, getToyIndex } from "@/lib/collections"

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
        <h3>Sammlungen</h3>
        <p className="mt-1 text-[13px] opacity-60">
          Titel und Spielzeug dieses Charakters. Reittiere und Begleiter gelten
          für den ganzen Account —{" "}
          <Link href="/dashboard/account" className="btn btn-ghost text-[13px]">
            zur Account-Übersicht
          </Link>
        </p>
      </div>

      {stale && (
        <div className="mb-4 border-2 border-line px-4 py-2">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            Letzter bekannter Stand
            {fetchedAt && ` vom ${fetchedAt.toLocaleDateString("de-CH")}`}
          </span>
        </div>
      )}

      <div className="space-y-8">
        {titleResult.failed ? (
          <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
            Titel konnten nicht geladen werden.
          </div>
        ) : (
          <TitleList view={titleView} />
        )}

        {toyResult.failed ? (
          <div className="border-2 border-line px-4 py-3 text-[13px] opacity-75">
            Spielzeug konnte nicht geladen werden.
            {mode !== "retail" && (
              <span className="mt-1 block opacity-65">
                Die Classic-Namespaces führen Spielzeug nicht.
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
