"use client"

import { Suspense, useCallback, useState } from "react"
import { Header } from "./Header"
import { GameModeTabs } from "./GameModeTabs"
import { CharacterGrid, POLL_MS } from "./CharacterGrid"

/**
 * Client-Hülle: hält den Sync-Zeitpunkt, damit die Kopfzeile den Poll-Status
 * zeigen kann, ohne dass CharacterGrid die Kopfzeile kennt.
 */
export function DashboardShell({ battleTag }: { battleTag?: string }) {
  const [sync, setSync] = useState<{ at: Date | null; count: number }>({ at: null, count: 0 })

  // Stabile Identität: als Inline-Funktion würde sie CharacterGrid
  // bei jedem Render einen neuen Callback geben und das Laden neu auslösen.
  const handleSync = useCallback((at: Date, count: number) => {
    setSync({ at, count })
  }, [])

  return (
    <div className="min-h-screen bg-ground">
      <Header
        battleTag={battleTag}
        lastSync={sync.at}
        pollSeconds={POLL_MS / 1000}
        characterCount={sync.count}
      />

      <Suspense fallback={<div className="h-[70px] border-b-2 border-line" />}>
        <GameModeTabs />
      </Suspense>

      <main>
        <div className="border-b-2 border-line px-6 py-5">
          <h2>Meine Charaktere</h2>
          <p className="mt-1 text-[13px] opacity-60">
            Alle Charaktere des Accounts · Dev-API zieht automatisch nach
          </p>
        </div>

        <Suspense fallback={<div className="px-6 py-12 text-[13px] opacity-55">Lade…</div>}>
          <CharacterGrid onSync={handleSync} />
        </Suspense>
      </main>
    </div>
  )
}
