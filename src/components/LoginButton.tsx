"use client"

import { signIn } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import { useT } from "./I18nProvider"

/**
 * `autoStart`: nach abgelaufener Sitzung gleich neu anmelden. Ist man bei
 * Battle.net noch angemeldet, ist das ein Hin und Zurück ohne Eingabe.
 * Nur einmal – scheitert die Anmeldung, landet man mit `?error=` wieder
 * hier, und dann ist autoStart aus (siehe login/page.tsx).
 */
export function LoginButton({ autoStart = false }: { autoStart?: boolean }) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const started = useRef(false)

  async function handleLogin() {
    setLoading(true)
    await signIn("battlenet", { callbackUrl: "/dashboard" })
  }

  useEffect(() => {
    if (!autoStart || started.current) return
    started.current = true
    void handleLogin()
    // handleLogin ist stabil genug: es liest keinen Zustand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="btn btn-primary w-full justify-center py-3 text-[15px]"
    >
      {loading ? t("login.connecting") : t("login.button")}
    </button>
  )
}
