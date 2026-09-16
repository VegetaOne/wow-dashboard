import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { loadConfig } from "@/lib/config"
import { htmlLang, translate } from "@/lib/i18n"

/**
 * Titel und Beschreibung folgen der eingestellten Sprache. Next ruft
 * `generateMetadata` je Anfrage auf – eine feste `metadata`-Konstante wäre
 * beim Laden des Moduls eingefroren und bliebe nach einem Sprachwechsel
 * stehen.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { language } = await loadConfig()
  return {
    title: translate(language, "app.title"),
    description: translate(language, "app.description"),
  }
}

// Setzt das Theme vor dem ersten Paint — verhindert Hell/Dunkel-Flackern.
const themeBootstrap = `
try {
  var t = localStorage.getItem("azeroth-theme") || "dark";
  document.documentElement.setAttribute("data-theme", t);
} catch (e) {
  document.documentElement.setAttribute("data-theme", "dark");
}
`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Einziger Ort, an dem die Sprache den Weg zu den Client-Komponenten
  // findet: von hier reicht der Provider sie nach unten durch.
  const { language } = await loadConfig()

  return (
    <html lang={htmlLang(language)} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen bg-ground text-ink antialiased">
        <Providers language={language}>{children}</Providers>
      </body>
    </html>
  )
}
