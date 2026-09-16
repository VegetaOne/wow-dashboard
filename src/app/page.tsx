import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { loadConfig } from "@/lib/config"

export default async function Home() {
  // Ohne abgeschlossenen Setup führt kein Weg am Setup vorbei.
  const config = await loadConfig()
  if (!config.setupComplete) {
    redirect(config.hasCredentials ? "/setup/schritt-2" : "/setup")
  }

  const session = await getServerSession(await getAuthOptions())
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
