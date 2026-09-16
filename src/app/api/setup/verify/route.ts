import { NextRequest, NextResponse } from "next/server"
import { loadConfig } from "@/lib/config"

/**
 * Eingegebene Zugangsdaten sofort gegen Battle.net prüfen.
 *
 * Ein Setup, der falsche Werte stillschweigend annimmt, verschiebt den
 * Fehler nur auf den ersten Login – und dort ist er viel schwerer zu
 * deuten. Geprüft wird mit dem Client-Credentials-Fluss: er braucht keinen
 * Nutzer und sagt genau das, was hier interessiert – ob ID und Secret ein
 * gültiges Paar sind.
 *
 * Erreichbar ohne Anmeldung, aber nur solange der Setup offen ist.
 */
export async function POST(req: NextRequest) {
  const config = await loadConfig()
  if (config.setupComplete) {
    return NextResponse.json({ error: "Setup ist abgeschlossen" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const clientId = String(body?.clientId ?? "").trim()
  const clientSecret = String(body?.clientSecret ?? "").trim()
  const region = String(body?.region ?? "eu").trim().toLowerCase()

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: "Client ID und Secret sind nötig." },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`https://${region}.battle.net/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
    })

    if (res.ok) {
      return NextResponse.json({ ok: true })
    }

    // 401 heisst hier fast immer: ID oder Secret stimmen nicht.
    const detail = await res.text()
    return NextResponse.json({
      ok: false,
      error:
        res.status === 401
          ? "Battle.net weist die Zugangsdaten zurück – ID oder Secret stimmen nicht."
          : `Battle.net antwortet mit ${res.status}.`,
      detail: detail.slice(0, 300),
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error:
        "Battle.net war nicht erreichbar. Das sagt nichts über die Zugangsdaten – nur, dass die Prüfung nicht stattfinden konnte.",
      detail: String(error).slice(0, 300),
    })
  }
}
