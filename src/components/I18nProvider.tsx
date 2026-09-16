"use client"

import { createContext, useContext, useMemo } from "react"
import type { Language } from "@/lib/config-cache"
import { translator, type Translate } from "@/lib/i18n"

/**
 * Sprache für Client-Komponenten.
 *
 * Die Sprache steht in der Datenbank, an die eine Client-Komponente nicht
 * herankommt. Das Wurzel-Layout liest sie einmal auf dem Server und reicht
 * sie hier hinein; alles darunter holt sie sich mit `useT()`.
 */
const I18nContext = createContext<{ language: Language; t: Translate }>({
  language: "en",
  t: translator("en"),
})

export function I18nProvider({
  language,
  children,
}: {
  language: Language
  children: React.ReactNode
}) {
  const value = useMemo(
    () => ({ language, t: translator(language) }),
    [language]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** Übersetzungsfunktion in einer Client-Komponente. */
export function useT(): Translate {
  return useContext(I18nContext).t
}

/** Eingestellte Sprache, etwa für den Umschalter selbst. */
export function useLanguage(): Language {
  return useContext(I18nContext).language
}
