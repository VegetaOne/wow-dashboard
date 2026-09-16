"use client"

import { Suspense, useCallback, useState } from "react"
import { Header } from "./Header"
import { GameModeTabs } from "./GameModeTabs"
import { CharacterGrid, POLL_MS } from "./CharacterGrid"
import type { GameMode } from "@/lib/battlenet"
import { WeeklyLink } from "./WeeklyLink"
import { useT } from "./I18nProvider"

/**
 * Client-Hülle: hält den Sync-Zeitpunkt, damit die Kopfzeile den Poll-Status
 * zeigen kann, ohne dass CharacterGrid die Kopfzeile kennt.
 */
export function DashboardShell({
  battleTag,
  modes,
  defaultMode = "retail",
  pollSeconds = POLL_MS / 1000,
  isOwner = false,
}: {
  battleTag?: string
  /** Im Setup gewählte Spielmodi */
  modes?: GameMode[]
  defaultMode?: GameMode
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
    <div className="min-h-screen bg-ground">
      <Header
        battleTag={battleTag}
        lastSync={sync.at}
        pollSeconds={pollSeconds}
        characterCount={sync.count}
        canChangeLanguage={isOwner}
      />

      <Suspense fallback={<div className="h-[70px] border-b-2 border-line" />}>
        <GameModeTabs modes={modes} defaultMode={defaultMode} />
      </Suspense>

      <main>
        <div className="flex flex-wrap items-center gap-4 border-b-2 border-line px-6 py-5">
          <div>
            <h2>{t("dashboard.myCharacters")}</h2>
            <p className="mt-1 text-[13px] opacity-60">
              {t("dashboard.myCharactersHint")}
            </p>
          </div>

          <div className="ml-auto">
            <Suspense fallback={null}>
              <WeeklyLink />
            </Suspense>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="px-6 py-12 text-[13px] opacity-55">
              {t("dashboard.loading")}
            </div>
          }
        >
          <CharacterGrid
            onSync={handleSync}
            pollMs={pollSeconds * 1000}
            defaultMode={defaultMode}
          />
        </Suspense>
      </main>
    </div>
  )
}
