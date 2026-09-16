import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EconomyPanel } from "@/components/EconomyPanel"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, professions as loadProfessions } from "@/lib/character"
import { parseProfessions } from "@/lib/professions"

export default async function EconomyPage({
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
    loadProfessions({ realm, name, mode }, session.accessToken!)
  )
  const professions = parseProfessions(result.value)

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>Wirtschaft</h3>
        <p className="mt-1 text-[13px] opacity-60">
          Herstellkosten gegen Verkaufspreis für die bekannten Rezepte dieses
          Charakters. Preise kommen aus dem Auktionshaus des verbundenen Realms
          und werden nur auf Anforderung eingelesen — die Rohantwort ist die
          grösste der ganzen API.
        </p>
      </div>

      <div className="mb-6 border-2 border-line px-4 py-3 text-[12px] opacity-75">
        <span className="eyebrow block">Was die Zahlen nicht enthalten</span>
        Auktionsgebühren, Verkaufsdauer, Marktsättigung und Berufsboni. Der
        Gewinn hier sagt, ob sich ein Rezept anzuschauen lohnt — nicht, was am
        Ende auf dem Konto landet. Erlös ist der Preis, zu dem man sich
        unterbieten müsste, nicht der sichere Verkaufspreis.
      </div>

      {result.failed ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">Berufe nicht abrufbar</span>
          Ohne die Rezepte des Charakters gibt es nichts zu rechnen. Der
          Berufe-Endpunkt hat nicht geantwortet, und es liegt kein früherer
          Stand vor.
        </div>
      ) : (
        <EconomyPanel mode={mode} realm={realm} professions={professions} />
      )}
    </div>
  )
}
