import { redirect } from "next/navigation"
import { loadConfig } from "@/lib/config"
import { getT } from "@/lib/t"
import { SetupForm } from "@/components/SetupForm"
import { LanguageToggle } from "@/components/LanguageToggle"

/**
 * Stufe 1 des Setups.
 *
 * Bewusst **ohne** Anmeldung: der Battle.net-Login braucht Client ID und
 * Secret, die hier erst eingegeben werden. Ein Setup hinter dem Login wäre
 * nie erreichbar.
 *
 * Abgesichert ist die Seite dadurch, dass sie nur existiert, solange der
 * Setup offen ist. Sobald er abgeschlossen ist, leitet sie weiter und
 * Änderungen laufen über die Einstellungsseite hinter dem Login.
 */
export default async function SetupPage() {
  const config = await loadConfig()
  if (config.setupComplete) redirect("/dashboard")

  const t = await getT()

  return (
    <div className="flex min-h-screen flex-col bg-ground">
      <header className="flex items-baseline gap-2.5 border-b-2 border-line px-6 py-3.5">
        <span className="font-heading text-[19px] font-extrabold tracking-[-0.02em] text-ink">
          {t("app.brand")}
        </span>
        <span className="eyebrow">{t("setup.eyebrow")}</span>
        <div className="ml-auto self-center">
          <LanguageToggle />
        </div>
      </header>

      <main className="flex flex-1 justify-center px-6 py-12">
        <div className="w-full max-w-[640px]">
          <span className="eyebrow">{t("setup.firstStart")}</span>
          <h1 className="mt-2 text-[42px]">{t("setup.heading")}</h1>
          <p className="mt-3 max-w-[65ch] text-[13px] opacity-60">{t("setup.intro")}</p>

          <hr className="rule my-8" />

          <SetupForm
            initialLanguage={config.language}
            initialRegion={config.region}
            initialClientId={config.bnetClientId ?? ""}
          />
        </div>
      </main>
    </div>
  )
}
