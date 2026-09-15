import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TrendChart } from "@/components/TrendChart"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { characterTrends } from "@/lib/history"

export default async function HistoryPage({
  params,
}: {
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect("/login")

  const { realm, name } = params
  const mode = (GAME_MODES.find((m) => m.id === params.mode)?.id ??
    "retail") as GameMode

  const series = await characterTrends(mode, realm, name)

  const withTrend = series.filter((s) => s.points.length >= 2)
  const tooFew = series.filter((s) => s.points.length === 1)

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>Verlauf</h3>
        <p className="mt-1 text-[13px] opacity-60">
          Entwicklung über Zeit, aus den täglich gespeicherten Ständen. Ein
          Diagramm je Messgrösse — zwei Maßstäbe in einem Bild wären
          irreführend.
        </p>
      </div>

      {series.length === 0 ? (
        <div className="border-2 border-line px-4 py-4">
          <span className="eyebrow block">Noch keine Historie</span>
          <p className="mt-1 max-w-[60ch] text-[13px] opacity-75">
            Der Verlauf beginnt mit dem ersten Abruf. Öffne die anderen Reiter
            dieses Charakters — Ausrüstung, Berufe, Fortschritt, Erfolge — dann
            wird je Tag ein Stand festgehalten, und ab dem zweiten Tag entstehen
            hier Linien.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {withTrend.length === 0 && (
            <div className="border-2 border-line px-4 py-3">
              <span className="eyebrow block">Erst ein Stand je Messgrösse</span>
              <span className="text-[13px] opacity-75">
                Die Aufzeichnung läuft. Ab dem zweiten Tag erscheinen hier
                Verlaufslinien.
              </span>
            </div>
          )}

          {withTrend.map((s) => (
            <TrendChart key={s.key} series={s} />
          ))}

          {/* Messgrössen mit nur einem Stand nicht verschweigen */}
          {tooFew.length > 0 && withTrend.length > 0 && (
            <div className="border-2 border-line px-4 py-3">
              <span className="eyebrow block">Noch ohne Verlauf</span>
              <span className="text-[13px] opacity-75">
                {`${tooFew.map((s) => s.label).join(", ")} — bisher nur ein Stand.`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
