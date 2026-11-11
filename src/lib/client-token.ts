/**
 * App-Token (Client-Credentials-Flow) für Abrufe ohne angemeldeten Nutzer.
 *
 * Gebraucht vom Hintergrund-Auffrischer. Battle.net stellt beim
 * Authorization-Code-Flow **keine Refresh-Tokens** aus; ein Nutzertoken
 * lebt 24 Stunden und lässt sich ohne erneute Anmeldung nicht verlängern.
 * Ein gespeichertes Nutzertoken taugte für einen täglichen Lauf also nicht.
 * Das App-Token holt sich die App selbst aus Client ID und Secret.
 *
 * Grenze: Es ist an keinen Account gebunden. Die Account-Liste
 * (`/profile/user/wow`) liefert es nicht; Charakter-Endpunkte unter
 * `/profile/wow/character/…` tun es bei Retail. Ob Forever das genauso hält,
 * ist ungeprüft – der Auffrischer meldet es, wenn nicht.
 */

import { configSnapshot } from "./config-cache"
import { oauthBase } from "./runtime"

interface CachedToken {
  token: string
  /** Millisekunden seit Epoche */
  expiresAt: number
  /** Region, für die das Token geholt wurde */
  region: string
}

// An globalThis, nicht auf Modulebene: Next bündelt src/lib je Route einzeln
const KEY = Symbol.for("wow-dashboard.client-token")
const store = globalThis as unknown as { [KEY]?: CachedToken }

/** Fünf Minuten Puffer vor dem Ablauf, damit kein Abruf mitten hinein fällt. */
const MARGIN_MS = 5 * 60 * 1000

export async function clientCredentialsToken(): Promise<string> {
  const config = configSnapshot()
  const id = config?.bnetClientId
  const secret = config?.clientSecret
  if (!id || !secret) throw new Error("Keine Zugangsdaten konfiguriert")

  const region = config.region
  const cached = store[KEY]
  if (cached && cached.region === region && Date.now() < cached.expiresAt - MARGIN_MS) {
    return cached.token
  }

  const response = await fetch(`${oauthBase()}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  })

  // Antwort nie ins Log: sie enthält das Token
  if (!response.ok) throw new Error(`App-Token abgelehnt (${response.status})`)

  const body = (await response.json().catch(() => null)) as {
    access_token?: unknown
    expires_in?: unknown
  } | null
  if (!body || typeof body.access_token !== "string") {
    throw new Error("App-Token: unerwartete Antwort")
  }

  const seconds = typeof body.expires_in === "number" ? body.expires_in : 3600
  store[KEY] = {
    token: body.access_token,
    expiresAt: Date.now() + seconds * 1000,
    region,
  }
  return body.access_token
}
