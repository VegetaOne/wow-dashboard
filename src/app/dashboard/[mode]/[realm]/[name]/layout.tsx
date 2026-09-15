import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/Header"
import { CharacterTabs } from "@/components/CharacterTabs"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, media, profile } from "@/lib/character"

/**
 * Rahmen aller Charakter-Unterseiten: Kopfzeile, Charakterkopf, Tabs.
 * Die Unterseiten liefern nur noch Inhalt.
 *
 * Der Spielmodus steht im Pfad, nicht in der Query: derselbe Name auf
 * demselben Realm ist in Retail und Classic ein anderer Charakter.
 * Layouts bekommen keine searchParams – aus dem Pfad lesen sie ihn dagegen.
 */
export default async function CharacterLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect("/login")

  const { realm, name } = params
  const resolved = GAME_MODES.find((m) => m.id === params.mode)
  // Unbekannter Modus in der URL: auf Retail umleiten statt still falsch zu laden
  if (!resolved) redirect(`/dashboard/retail/${realm}/${name}`)
  const mode = resolved.id

  const ref = { realm, name, mode }
  const [mediaResult, profileResult] = await Promise.all([
    attempt(() => media(ref, session.accessToken!)),
    attempt(() => profile(ref, session.accessToken!)),
  ])

  const avatar = mediaResult.value?.avatar ?? null
  const prof = profileResult.value
  const modeConfig = GAME_MODES.find((m) => m.id === mode)!

  const characterName = name.charAt(0).toUpperCase() + name.slice(1)
  const realmName = realm
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

  const stale = mediaResult.stale || profileResult.stale

  return (
    <div className="min-h-screen bg-ground">
      <Header battleTag={session.battleTag} />

      {/* Brotkrume */}
      <div className="border-b border-line px-6 py-2.5">
        <Link href="/dashboard" className="btn btn-ghost text-[13px]">
          ← Zurück zur Kaderliste
        </Link>
      </div>

      {/* Charakterkopf */}
      <div className="flex flex-wrap items-center gap-5 border-b-2 border-line px-6 py-6">
        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-16 w-16 flex-none border border-line" />
        )}

        <div className="min-w-0">
          <span className="eyebrow">{modeConfig.label}</span>
          <h2 className="mt-0.5">{characterName}</h2>
          <span className="text-[13px] opacity-60">{realmName}</span>
        </div>

        {prof?.equippedItemLevel != null && (
          <div className="ml-auto flex gap-8 border-l-2 border-line pl-6">
            <div>
              <span className="eyebrow">Gegenstandsstufe</span>
              <div className="font-heading text-[30px] font-extrabold leading-none tracking-[-0.02em]">
                {prof.equippedItemLevel}
              </div>
            </div>
            {prof.averageItemLevel != null && (
              <div>
                <span className="eyebrow">Ø inkl. Tasche</span>
                <div className="font-heading text-[30px] font-extrabold leading-none tracking-[-0.02em] opacity-60">
                  {prof.averageItemLevel}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offen sagen, wenn die Werte aus dem Speicher kommen, weil die API
          gerade nicht erreichbar war – sonst wirken alte Zahlen wie aktuelle. */}
      {stale && (
        <div className="border-b border-line px-6 py-1.5">
          <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
            Battle.net ist gerade nicht erreichbar — angezeigt wird der letzte
            bekannte Stand
          </span>
        </div>
      )}

      <CharacterTabs realm={realm} name={name} mode={mode} />

      <main>{children}</main>
    </div>
  )
}
