import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "WoW Dashboard",
  description: "World of Warcraft Account-Übersicht",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen bg-ground text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
