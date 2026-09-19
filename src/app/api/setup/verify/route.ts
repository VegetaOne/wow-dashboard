import { NextRequest, NextResponse } from "next/server"
import { loadConfig } from "@/lib/config"
import { getT } from "@/lib/t"

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
  const t = await getT()
  const config = await loadConfig()
  if (config.setupComplete) {
    return NextResponse.json({ error: t("setup.alreadyComplete") }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const clientId = String(body?.clientId ?? "").trim()
  const clientSecret = String(body?.clientSecret ?? "").trim()
  const region = String(body?.region ?? "eu").trim().toLowerCase()

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: t("setup.credentialsRequired") },
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
          ? t("setup.credentialsRejected")
          : t("setup.bnetStatus", { status: res.status }),
      detail: detail.slice(0, 300),
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: t("setup.bnetUnreachable"),
      detail: String(error).slice(0, 300),
    })
  }
}
