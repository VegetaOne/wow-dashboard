import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginButton } from "@/components/LoginButton"
import { loadConfig } from "@/lib/config"
import { getT } from "@/lib/t"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  // Ohne Zugangsdaten gäbe es hier nur einen Anmeldeknopf, der scheitert.
  const config = await loadConfig()
  if (!config.hasCredentials) redirect("/setup")

  const session = await getServerSession(await getAuthOptions())
  if (session) redirect(config.setupComplete ? "/dashboard" : "/setup/schritt-2")

  const t = await getT()

  return (
    <div className="flex min-h-screen flex-col bg-ground">
      {/* Kopfzeile */}
      <header className="flex items-baseline gap-2.5 border-b-2 border-line px-6 py-3.5">
        <span className="font-heading text-[19px] font-extrabold tracking-[-0.02em] text-ink">
          {t("app.brand")}
        </span>
        <span className="eyebrow">{t("app.tagline")}</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <span className="eyebrow">{t("login.eyebrow")}</span>
          <h1 className="mt-2 text-[42px]">{t("login.heading")}</h1>

          <hr className="rule my-6" />

          <p className="text-[14px] opacity-70">{t("login.intro")}</p>

          {searchParams.error && (
            <div className="mt-6 border-2 border-accent px-4 py-3 text-[13px]">
              <span className="eyebrow block">{t("login.failed")}</span>
              {searchParams.error === "OAuthCallback"
                ? t("login.errorCallback")
                : t("login.errorUnknown")}
            </div>
          )}

          <div className="mt-8">
            <LoginButton />
          </div>

          <hr className="rule-thin my-6" />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="eyebrow">{t("login.access")}</dt>
              <dd className="mt-0.5 text-[13px] opacity-75">{t("login.accessValue")}</dd>
            </div>
            <div>
              <dt className="eyebrow">{t("login.scope")}</dt>
              <dd className="mt-0.5 text-[13px] opacity-75">{t("login.scopeValue")}</dd>
            </div>
          </dl>
        </div>
      </main>

      <footer className="border-t-2 border-line px-6 py-3">
        <span className="eyebrow">{t("login.footer")}</span>
      </footer>
    </div>
  )
}
