/**
 * WoWForeverAdapter – WoW Forever (angekündigt BlizzCon '26)
 *
 * TODO: Ausfüllen sobald die Beta-API-Dokumentation verfügbar ist.
 *
 * Mögliche Szenarien (noch unbekannt):
 *  A) Eigener Namespace in der bestehenden Battle.net API
 *     → Dann nur REGION/NAMESPACE anpassen, Rest bleibt gleich
 *  B) Völlig neue API-Endpunkte
 *     → Dann bnetFetch durch eigene fetch-Logik ersetzen
 *  C) Gleiche API, andere Datenstruktur
 *     → Dann nur die Mapping-Funktionen unten anpassen
 */

import type {
  WoWDataAdapter,
  Character,
  CharacterEquipmentData,
} from "./interface"

// Platzhalter – wird befüllt sobald API-Doku verfügbar
const FOREVER_API_BASE = process.env.WOW_FOREVER_API_BASE ?? "https://TBD.api.blizzard.com"
const FOREVER_NAMESPACE = process.env.WOW_FOREVER_NAMESPACE ?? "profile-forever"

export class WoWForeverAdapter implements WoWDataAdapter {
  readonly id = "wow-forever"
  readonly displayName = "WoW Forever"

  async getAccountCharacters(_token: string): Promise<Character[]> {
    // TODO: Implementieren sobald Beta-API verfügbar
    // Wahrscheinlich ähnlich wie BlizzardAdapter, evtl. anderer Namespace:
    //
    // const data = await foreverFetch<...>("/profile/user/wow", token)
    // return data.wow_accounts.flatMap(acc => acc.characters).map(mapCharacter)

    throw new NotImplementedError("WoW Forever API noch nicht verfügbar")
  }

  async getCharacterEquipment(
    _realm: string,
    _name: string,
    _token: string
  ): Promise<CharacterEquipmentData> {
    // TODO: Implementieren sobald Beta-API verfügbar
    throw new NotImplementedError("WoW Forever API noch nicht verfügbar")
  }

  async getCharacterMedia(
    _realm: string,
    _name: string,
    _token: string
  ): Promise<string | null> {
    // TODO: Implementieren sobald Beta-API verfügbar
    return null
  }
}

// ─── Hilfsfunktion (vorbereitet) ──────────────────────────────────────────────

// Entfernen und mit echter Logik ersetzen wenn API bekannt:
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function foreverFetch<T>(path: string, token: string): Promise<T> {
  const url = new URL(`${FOREVER_API_BASE}${path}`)
  url.searchParams.set("namespace", FOREVER_NAMESPACE)
  url.searchParams.set("locale", "de_DE")

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error(`WoW Forever API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

class NotImplementedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotImplementedError"
  }
}
