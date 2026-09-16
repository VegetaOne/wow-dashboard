"use client"

import { SessionProvider } from "next-auth/react"
import { I18nProvider } from "@/components/I18nProvider"
import type { Language } from "@/lib/config-cache"

export function Providers({
  language,
  children,
}: {
  language: Language
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <I18nProvider language={language}>{children}</I18nProvider>
    </SessionProvider>
  )
}
