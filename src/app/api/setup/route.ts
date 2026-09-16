import { NextRequest, NextResponse } from "next/server"
import { loadConfig, saveConfig, REGIONS, type Language } from "@/lib/config"

/**
 * Stufe 1 des Setups: die Werte, die der Login selbst braucht.
 *
 * Diese Route ist **ohne Anmeldung** erreichbar – anders geht es nicht, denn
 * ohne Client ID und Secret gibt es keinen Battle.net-Login, hinter dem sie
 * liegen könnte. Abgesichert ist sie dadurch, dass sie nur antwortet,
 * solange der Setup offen ist: sobald Stufe 2 durch ist, gibt sie 403 und
 * Änderungen laufen über die Einstellungsseite hinter dem Login.
 */
export async function POST(req: NextRequest) {
  const config = await loadConfig()
  if (config.setupComplete) {
    return NextResponse.json(
      { error: "Setup ist abgeschlossen – Änderungen über die Einstellungen." },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  const clientId = String(body?.clientId ?? "").trim()
  const clientSecret = String(body?.clientSecret ?? "").trim()
  const region = String(body?.region ?? "eu").trim().toLowerCase()
  const language = String(body?.language ?? "en").trim() as Language

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Client ID und Secret sind nötig." },
      { status: 400 }
    )
  }

  if (!REGIONS.includes(region as (typeof REGIONS)[number])) {
    return NextResponse.json({ error: "Unbekannte Region." }, { status: 400 })
  }

  await saveConfig({
    bnetClientId: clientId,
    bnetClientSecret: clientSecret,
    region,
    language: language === "de" ? "de" : "en",
  })

  return NextResponse.json({ ok: true })
}
