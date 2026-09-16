import NextAuth from "next-auth"
import type { NextRequest } from "next/server"
import { getAuthOptions } from "@/lib/auth"

/**
 * Auth-Route.
 *
 * Zwei Dinge passieren hier vor NextAuth:
 *
 * 1. **Konfiguration laden.** Die Zugangsdaten stehen in der Datenbank,
 *    nicht in der Umgebung. Erst danach darf NextAuth die Provider-Felder
 *    lesen. Ein Neustart nach dem Setup entfällt damit.
 *
 * 2. **Basisadresse bestimmen.** NextAuth baut die Callback-Adresse aus
 *    `NEXTAUTH_URL`. Die soll nicht mehr von Hand gesetzt werden müssen,
 *    also wird sie aus der Anfrage abgeleitet, wenn nichts gesetzt ist.
 *    Angenehmer Nebeneffekt im Heimnetz: dieselbe Instanz funktioniert
 *    über `localhost` und über die lokale IP, ohne Umkonfigurieren –
 *    vorausgesetzt, beide Adressen stehen als Redirect-URI bei Battle.net.
 *    Ein selbst gesetztes `NEXTAUTH_URL` gewinnt weiterhin.
 */
const EXPLICIT_URL = process.env.NEXTAUTH_URL

function applyBaseUrl(req: NextRequest): void {
  if (EXPLICIT_URL) return

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  if (!host) return

  const proto = req.headers.get("x-forwarded-proto") ?? "http"
  process.env.NEXTAUTH_URL = `${proto}://${host}`
}

async function handler(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  applyBaseUrl(req)
  const options = await getAuthOptions()

  // NextAuth kennt im App Router die Form (req, context, options); die
  // Typen von v4 bilden nur die Pages-Router-Signatur ab.
  return (NextAuth as unknown as (
    req: NextRequest,
    context: { params: { nextauth: string[] } },
    options: Awaited<ReturnType<typeof getAuthOptions>>
  ) => Promise<Response>)(req, context, options)
}

export { handler as GET, handler as POST }
