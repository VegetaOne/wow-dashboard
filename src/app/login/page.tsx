import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginButton } from "@/components/LoginButton"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="flex min-h-screen flex-col bg-ground">
      {/* Kopfzeile */}
      <header className="flex items-baseline gap-2.5 border-b-2 border-line px-6 py-3.5">
        <span className="font-heading text-[19px] font-extrabold tracking-[-0.02em] text-ink">
          WOW&nbsp;DASHBOARD
        </span>
        <span className="eyebrow">Kaderliste&nbsp;/&nbsp;lokal</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          <span className="eyebrow">Anmeldung</span>
          <h1 className="mt-2 text-[42px]">Account verbinden</h1>

          <hr className="rule my-6" />

          <p className="text-[14px] opacity-70">
            Melde dich mit deinem Battle.net-Account an, um deine Charaktere,
            Ausrüstung und offenen To-Dos zu sehen.
          </p>

          {searchParams.error && (
            <div className="mt-6 border-2 border-accent px-4 py-3 text-[13px]">
              <span className="eyebrow block">Anmeldung fehlgeschlagen</span>
              {searchParams.error === "OAuthCallback"
                ? "Der Battle.net-Rückruf konnte nicht verarbeitet werden. Bitte erneut versuchen."
                : "Ein unerwarteter Fehler ist aufgetreten."}
            </div>
          )}

          <div className="mt-8">
            <LoginButton />
          </div>

          <hr className="rule-thin my-6" />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="eyebrow">Zugriff</dt>
              <dd className="mt-0.5 text-[13px] opacity-75">Nur lesend</dd>
            </div>
            <div>
              <dt className="eyebrow">Umfang</dt>
              <dd className="mt-0.5 text-[13px] opacity-75">Charakterprofile</dd>
            </div>
          </dl>
        </div>
      </main>

      <footer className="border-t-2 border-line px-6 py-3">
        <span className="eyebrow">Privates Heimnetz-Werkzeug</span>
      </footer>
    </div>
  )
}
