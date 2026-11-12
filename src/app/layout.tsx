import type { Metadata } from "next"
// Schriften der Warband-Übergabe, selbst gehostet – kein Abruf bei Google
import "@fontsource/cinzel/500.css"
import "@fontsource/cinzel/700.css"
import "@fontsource/cinzel/800.css"
import "@fontsource/cinzel/900.css"
import "@fontsource/spectral/400.css"
import "@fontsource/spectral/400-italic.css"
import "@fontsource/spectral/600.css"
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

/**
 * Jede Seite wird je Anfrage gerendert, nie beim Bauen.
 *
 * Gefunden 2026-11-11 beim ersten echten Setup im Container: Next hielt `/`,
 * `/login`, `/setup` und `/setup/schritt-2` für statisch und rechnete sie beim
 * `next build` vor. Zu dem Zeitpunkt gibt es keine Datenbank und damit keine
 * Zugangsdaten – die Weiterleitung `redirect("/setup")` landete fest im
 * HTML. Nach dem Speichern im Setup schickte jede dieser Seiten deshalb
 * wieder zum Setup zurück, egal was in der Datenbank stand.
 *
 * Alles hier hängt an der Konfiguration in der Datenbank (Sprache, Setup-
 * Stand, Anmeldung). Eine vorgerechnete Seite wäre immer falsch.
 */
export const dynamic = "force-dynamic"

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
