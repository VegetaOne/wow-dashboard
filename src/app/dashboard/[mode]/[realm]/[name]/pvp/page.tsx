import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PvpPanel } from "@/components/PvpPanel"
import { GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, pvpSummary, pvpBrackets } from "@/lib/character"
import { PVP_BRACKETS, parsePvpSummary, parseBracket } from "@/lib/pvp"
import type { BracketView } from "@/lib/pvp"

export default async function PvpPage({
  params,
}: {
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect("/login")

  const { realm, name } = params
  const mode = (GAME_MODES.find((m) => m.id === params.mode)?.id ??
    "retail") as GameMode
  const ref = { realm, name, mode }
  const token = session.accessToken

  const [summaryResult, bracketResult] = await Promise.all([
    attempt(() => pvpSummary(ref, token)),
    attempt(() => pvpBrackets(ref, token)),
  ])

  const summary = parsePvpSummary(summaryResult.value)

  const raw = bracketResult.value ?? {}
  const brackets = PVP_BRACKETS.map((b) =>
    parseBracket(raw[b.slug] ?? null, b.slug, b.label)
  ).filter((b): b is BracketView => b !== null)

  const stale = summaryResult.stale || bracketResult.stale
  const fetchedAt = summaryResult.fetchedAt ?? bracketResult.fetchedAt

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>PvP</h3>
        <p className="mt-1 text-[13px] opacity-60">
          Ehre, gewertete Klassen und die Statistik je Schlachtfeld. Die Werte
          aktualisieren sich erst, wenn der Charakter sich ausloggt.
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

      {summaryResult.failed && bracketResult.failed ? (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">PvP nicht abrufbar</span>
          Die PvP-Endpunkte haben nicht geantwortet, und es liegt kein früherer
          Stand vor. In Classic führt die API diese Daten nicht durchgängig.
        </div>
      ) : (
        <PvpPanel summary={summary} brackets={brackets} />
      )}
    </div>
  )
}
