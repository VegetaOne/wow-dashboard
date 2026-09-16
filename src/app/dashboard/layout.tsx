import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { loadConfig } from "@/lib/config"

/**
 * Schranke vor allem, was unter `/dashboard` liegt.
 *
 * Hier hängen zwei Prüfungen: der abgeschlossene Setup und die Anmeldung.
 * Beide stehen bewusst im Layout und nicht in einer Middleware – die läuft
 * in der Edge-Laufzeit, und dort gibt es weder Datenbankzugriff noch das
 * Sitzungsgeheimnis, das genau dort liegt. `withAuth` scheiterte deshalb
 * mit NO_SECRET und schickte die Anfrage in eine Endlosschleife zwischen
 * Fehlerseite und Anmeldung.
 *
 * Die API-Routen unter `/api/wow` brauchen keine Schranke davor: sie prüfen
 * die Session jeweils selbst und antworten mit 401.
 *
 * Nebenwirkung, die gewollt ist: das Layout lädt die Konfiguration einmal
 * pro Anfrage und füllt damit den Zwischenspeicher, aus dem Region und
 * Sprache gelesen werden.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await loadConfig()

  if (!config.setupComplete) {
    redirect(config.hasCredentials ? "/setup/schritt-2" : "/setup")
  }

  const session = await getServerSession(await getAuthOptions())
  if (!session) redirect("/login")

  return <>{children}</>
}
