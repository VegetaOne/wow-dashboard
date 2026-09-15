import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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

/**
 * Account-weite Sammlungen. Reittiere und Begleiter gelten für alle
 * Charaktere gemeinsam – sie gehören deshalb nicht in die Charakteransicht.
 */
export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect("/login")

  const token = session.accessToken

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
      <Header battleTag={session.battleTag} />

      <div className="border-b border-line px-6 py-2.5">
        <Link href="/dashboard" className="btn btn-ghost text-[13px]">
          ← Zurück zur Kaderliste
        </Link>
      </div>

      <div className="border-b-2 border-line px-6 py-6">
        <span className="eyebrow">Account</span>
        <h2 className="mt-0.5">Sammlungen</h2>
        <p className="mt-1 text-[13px] opacity-60">
          Reittiere und Begleiter gelten für den ganzen Account, nicht für einen
          einzelnen Charakter.
        </p>
      </div>

      {stale && (
        <div className="border-b border-line px-6 py-1.5">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            Letzter bekannter Stand
            {fetchedAt && ` vom ${fetchedAt.toLocaleDateString("de-CH")}`}
          </span>
        </div>
      )}

      <main className="space-y-8 px-6 py-6">
        {mountResult.failed && petResult.failed ? (
          <div className="border-2 border-accent px-4 py-3 text-[13px]">
            <span className="eyebrow block">Sammlungen nicht abrufbar</span>
            Beide Endpunkte haben nicht geantwortet, und es liegt kein früherer
            Stand vor.
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
