import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AchievementsPanel } from "@/components/AchievementsPanel"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, achievements } from "@/lib/character"

export default async function AchievementsPage({
  params,
}: {
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const { realm, name } = params
  const mode = (GAME_MODES.find((m) => m.id === params.mode)?.id ??
    "retail") as GameMode

  const result = await attempt(() =>
    achievements({ realm, name, mode }, session.accessToken!)
  )

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>Erfolge</h3>
        <p className="mt-1 text-[13px] opacity-60">
          Punkte, zuletzt erreichte Erfolge und Fortschritt je Kategorie. Eine
          Kategorie aufklappen lädt ihre vollständige Liste — damit wird
          sichtbar, was noch fehlt.
        </p>
      </div>

      {result.failed || !result.value ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">Erfolge nicht abrufbar</span>
          Der Endpunkt hat nicht geantwortet, und es liegt kein früherer Stand vor.
        </div>
      ) : (
        <>
          {result.stale && (
            <div className="mb-4 border-2 border-line px-4 py-2">
              <span className="eyebrow" style={{ color: "var(--color-accent)" }}>
                Letzter bekannter Stand
                {result.fetchedAt &&
                  ` vom ${result.fetchedAt.toLocaleDateString("de-CH")}`}
              </span>
            </div>
          )}

          <AchievementsPanel summary={result.value} mode={mode} />
        </>
      )}
    </div>
  )
}
