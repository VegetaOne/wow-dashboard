"use client"

import { createContext, useContext, useMemo } from "react"
import type { Language } from "@/lib/config-cache"
import { translator, type Translate } from "@/lib/i18n"
import { createFormat, type Format } from "@/lib/format"

/**
 * Sprache für Client-Komponenten.
 *
 * Die Sprache steht in der Datenbank, an die eine Client-Komponente nicht
 * herankommt. Das Wurzel-Layout liest sie einmal auf dem Server und reicht
 * sie hier hinein; alles darunter holt sie sich mit `useT()` / `useFormat()`.
 */
const I18nContext = createContext<{ language: Language; t: Translate; f: Format }>({
  language: "en",
  t: translator("en"),
  f: createFormat("en"),
})

export function I18nProvider({
  language,
  children,
}: {
  language: Language
  children: React.ReactNode
}) {
  const value = useMemo(
    () => ({ language, t: translator(language), f: createFormat(language) }),
    [language]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** Übersetzungsfunktion in einer Client-Komponente. */
export function useT(): Translate {
  return useContext(I18nContext).t
}

/** Zahlen- und Datumsformatierung in einer Client-Komponente. */
export function useFormat(): Format {
  return useContext(I18nContext).f
}

/** Eingestellte Sprache, etwa für den Umschalter selbst. */
export function useLanguage(): Language {
  return useContext(I18nContext).language
}
