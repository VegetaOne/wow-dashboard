"use client"

import { Suspense, useCallback, useState } from "react"
import { Header } from "./Header"
import { CharacterGrid, POLL_MS } from "./CharacterGrid"
import { useT } from "./I18nProvider"

/**
 * Client-Hülle: hält den Sync-Zeitpunkt, damit die Kopfzeile den Poll-Status
 * zeigen kann, ohne dass CharacterGrid die Kopfzeile kennt.
 */
export function DashboardShell({
  battleTag,
  pollSeconds = POLL_MS / 1000,
  isOwner = false,
}: {
  battleTag?: string
  pollSeconds?: number
  /** Besitzer der Instanz – nur er darf die Sprache umstellen. */
  isOwner?: boolean
}) {
  const t = useT()
  const [sync, setSync] = useState<{ at: Date | null; count: number }>({ at: null, count: 0 })

  // Stabile Identität: als Inline-Funktion würde sie CharacterGrid
  // bei jedem Render einen neuen Callback geben und das Laden neu auslösen.
  const handleSync = useCallback((at: Date, count: number) => {
    setSync({ at, count })
  }, [])

  return (
    <div className="min-h-screen">
      <Header
        battleTag={battleTag}
        lastSync={sync.at}
        pollSeconds={pollSeconds}
        characterCount={sync.count}
        canChangeLanguage={isOwner}
      />

      {/* Bühne und übrige Charaktere – die Wochenübersicht steht in der Kopfzeile */}
      <main>
        <Suspense
          fallback={
            <div className="px-6 py-12 text-[13px]" style={{ color: "var(--wb-ink-dim)" }}>
              {t("dashboard.loading")}
            </div>
          }
        >
          <CharacterGrid onSync={handleSync} pollMs={pollSeconds * 1000} />
        </Suspense>
      </main>
    </div>
  )
}
