import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TrendChart } from "@/components/TrendChart"
import { characterTrends } from "@/lib/history"
import { characterFromParam } from "@/lib/character"
import { getT } from "@/lib/t"

export default async function HistoryPage({
  params,
}: {
  params: { character: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const ref = characterFromParam(params.character)
  const t = await getT()

  const series = await characterTrends(ref.slug)

  const withTrend = series.filter((s) => s.points.length >= 2)
  const tooFew = series.filter((s) => s.points.length === 1)

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h3>{t("history.heading")}</h3>
        <p className="mt-1 text-[13px] opacity-60">{t("history.intro")}</p>
      </div>

      {series.length === 0 ? (
        <div className="border-2 border-line px-4 py-4">
          <span className="eyebrow block">{t("history.noHistory")}</span>
          <p className="mt-1 max-w-[60ch] text-[13px] opacity-75">
            {t("history.noHistoryText")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {withTrend.length === 0 && (
            <div className="border-2 border-line px-4 py-3">
              <span className="eyebrow block">{t("history.onePointEach")}</span>
              <span className="text-[13px] opacity-75">
                {t("history.onePointEachText")}
              </span>
            </div>
          )}

          {withTrend.map((s) => (
            <TrendChart key={s.key} series={s} />
          ))}

          {/* Messgrössen mit nur einem Stand nicht verschweigen */}
          {tooFew.length > 0 && withTrend.length > 0 && (
            <div className="border-2 border-line px-4 py-3">
              <span className="eyebrow block">{t("history.noTrendYet")}</span>
              <span className="text-[13px] opacity-75">
                {t("history.onlyOneSnapshot", {
                  labels: tooFew.map((s) => t(s.labelKey)).join(", "),
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
