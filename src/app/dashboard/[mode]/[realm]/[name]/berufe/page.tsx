import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProfessionsPanel } from "@/components/ProfessionsPanel"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, professions } from "@/lib/character"
import { parseProfessions } from "@/lib/professions"

export default async function ProfessionsPage({
  params,
}: {
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect("/login")

  const { realm, name } = params
  const mode = (GAME_MODES.find((m) => m.id === params.mode)?.id ??
    "retail") as GameMode

  const result = await attempt(() =>
    professions({ realm, name, mode }, session.accessToken!)
  )

  const parsed = parseProfessions(result.value)

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>Berufe</h3>
        <p className="mt-1 text-[13px] opacity-60">
          Fertigkeitsstufen und bekannte Rezepte. Eine Stufe aufklappen lädt die
          vollständige Rezeptliste — damit wird sichtbar, was noch fehlt.
        </p>
      </div>

      {result.failed ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">Berufe nicht abrufbar</span>
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

          <ProfessionsPanel professions={parsed} mode={mode} />
        </>
      )}
    </div>
  )
}
