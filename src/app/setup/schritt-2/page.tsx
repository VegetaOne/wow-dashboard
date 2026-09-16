import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getAuthOptions } from "@/lib/auth"
import { loadConfig } from "@/lib/config"
import { getT } from "@/lib/t"
import { SetupStep2Form } from "@/components/SetupStep2Form"
import { LanguageToggle } from "@/components/LanguageToggle"

/**
 * Stufe 2 des Setups, hinter der Anmeldung.
 *
 * Wer hier landet, hat sich erfolgreich mit Battle.net angemeldet – der
 * Beweis, dass die Zugangsdaten aus Stufe 1 stimmen. Der Account, der diese
 * Seite abschliesst, wird als Besitzer der Instanz festgehalten.
 */
export default async function SetupStepTwoPage() {
  const config = await loadConfig()

  // Ohne Zugangsdaten gibt es nichts zu bestätigen – zurück auf Stufe 1.
  if (!config.hasCredentials) redirect("/setup")
  if (config.setupComplete) redirect("/dashboard")

  const session = await getServerSession(await getAuthOptions())
  if (!session?.battleTag) redirect("/login")

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
          <span className="eyebrow">
            {t("setup.signedInAs", { battleTag: session.battleTag })}
          </span>
          <h1 className="mt-2 text-[42px]">{t("setup.almostDone")}</h1>
          <p className="mt-3 max-w-[65ch] text-[13px] opacity-60">
            {t("setup.step2Intro")}
          </p>

          <hr className="rule my-8" />

          <SetupStep2Form
            initialModes={config.gameModes}
            initialDefaultMode={config.defaultMode}
            initialPollSeconds={config.pollSeconds}
          />
        </div>
      </main>
    </div>
  )
}
