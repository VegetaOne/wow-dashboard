"use client"

import { useT } from "./I18nProvider"

/**
 * Hinweis für ein 404 der Forever-API.
 *
 * Bei WoW Forever heisst ein 404 meist nicht „kaputt", sondern „noch keine
 * Daten": Charaktere erscheinen erst ab Stufe 10 und erst nach dem ersten
 * Ausloggen, Bilder fehlen eine Weile nach dem ersten Auftauchen. Eine
 * gemeinsame Darstellung dafür, damit nicht jede Ansicht eigen reagiert und
 * ein solcher Fall nie wie ein Fehler aussieht.
 */
export function NoDataYet({ detail }: { detail?: string }) {
  const t = useT()
  return (
    <div className="border-2 border-line px-4 py-3 text-[13px]">
      <span className="eyebrow block">{t("core.noDataYet")}</span>
      <span className="opacity-75">{detail ?? t("core.noDataYetText")}</span>
    </div>
  )
}
