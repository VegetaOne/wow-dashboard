/**
 * BlizzardAdapter – Retail WoW via Battle.net API
 * Implementiert WoWDataAdapter für den aktuellen Retail-Client.
 */

import type {
  WoWDataAdapter,
  Character,
  CharacterEquipmentData,
  EquipmentItem,
  EquipmentIssue,
  ItemQuality,
} from "./interface"

const REGION = process.env.BNET_REGION || "eu"
const API_BASE = `https://${REGION}.api.blizzard.com`
const NS_PROFILE = `profile-${REGION}`
const LOCALE = "de_DE"

// ─── Interne Fetch-Hilfsfunktion ──────────────────────────────────────────────

async function bnetFetch<T>(path: string, token: string, namespace = NS_PROFILE): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  url.searchParams.set("namespace", namespace)
  url.searchParams.set("locale", LOCALE)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`Battle.net ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

// ─── Adapter-Implementierung ──────────────────────────────────────────────────

export class BlizzardAdapter implements WoWDataAdapter {
  readonly id = "retail"
  readonly displayName = "World of Warcraft"

  async getAccountCharacters(token: string): Promise<Character[]> {
    const data = await bnetFetch<{
      wow_accounts: {
        characters: {
          id: number
          name: string
          realm: { slug: string; name: string }
          level: number
          faction: { type: string }
          playable_class: { id: number; name: string }
          playable_race: { id: number; name: string }
          gender: { type: string }
        }[]
      }[]
    }>("/profile/user/wow", token)

    const chars = data.wow_accounts.flatMap((acc) => acc.characters)

    const enriched = await Promise.all(
      chars
        .filter((c) => c.level >= 10)
        .sort((a, b) => b.level - a.level)
        .map(async (c) => {
          try {
            const [profile, avatarUrl] = await Promise.all([
              this._getProfile(c.realm.slug, c.name, token),
              this.getCharacterMedia(c.realm.slug, c.name, token),
            ])
            return {
              id: c.id,
              name: c.name,
              realm: c.realm,
              level: c.level,
              faction: (c.faction.type === "ALLIANCE" ? "ALLIANCE" : "HORDE") as "ALLIANCE" | "HORDE",
              classId: c.playable_class.id,
              className: c.playable_class.name,
              raceName: c.playable_race.name,
              gender: (c.gender.type === "MALE" ? "MALE" : "FEMALE") as "MALE" | "FEMALE",
              ...profile,
              avatarUrl,
            } satisfies Character
          } catch {
            return {
              id: c.id,
              name: c.name,
              realm: c.realm,
              level: c.level,
              faction: (c.faction.type === "ALLIANCE" ? "ALLIANCE" : "HORDE") as "ALLIANCE" | "HORDE",
              classId: c.playable_class.id,
              className: c.playable_class.name,
              raceName: c.playable_race.name,
              gender: (c.gender.type === "MALE" ? "MALE" : "FEMALE") as "MALE" | "FEMALE",
            } satisfies Character
          }
        })
    )

    return enriched
  }

  private async _getProfile(realm: string, name: string, token: string) {
    const data = await bnetFetch<{
      average_item_level: number
      equipped_item_level: number
    }>(`/profile/wow/character/${realm}/${name.toLowerCase()}`, token)
    return {
      averageItemLevel: data.average_item_level,
      equippedItemLevel: data.equipped_item_level,
    }
  }

  async getCharacterMedia(realm: string, name: string, token: string): Promise<string | null> {
    try {
      const data = await bnetFetch<{ assets: { key: string; value: string }[] }>(
        `/profile/wow/character/${realm}/${name.toLowerCase()}/character-media`,
        token
      )
      return data.assets.find((a) => a.key === "avatar")?.value ?? null
    } catch {
      return null
    }
  }

  async getCharacterEquipment(realm: string, name: string, token: string): Promise<CharacterEquipmentData> {
    const raw = await bnetFetch<{
      character: { name: string; realm: { slug: string } }
      equipped_items: {
        slot: { type: string; name: string }
        item: { id: number; name: string }
        quality: { type: string }
        level: { value: number }
        enchantments?: { display_string: string }[]
        sockets?: { socket_type: { type: string }; item?: { id: number; name: string } }[]
      }[]
    }>(`/profile/wow/character/${realm}/${name.toLowerCase()}/equipment`, token)

    const items: EquipmentItem[] = raw.equipped_items.map((i) => ({
      slotType: i.slot.type,
      itemId: i.item.id,
      itemName: i.item.name,
      itemLevel: i.level.value,
      quality: (i.quality?.type ?? "COMMON") as ItemQuality,
      enchanted: (i.enchantments?.length ?? 0) > 0,
      enchantDescription: i.enchantments?.[0]?.display_string,
      sockets: (i.sockets ?? []).map((s) => ({
        filled: !!s.item,
        gemName: s.item?.name,
      })),
    }))

    const issues: EquipmentIssue[] = []
    for (const item of items) {
      const emptyGems = item.sockets.filter((s) => !s.filled).length
      if (emptyGems > 0) {
        issues.push({ slotType: item.slotType, itemName: item.itemName, type: "MISSING_GEM", count: emptyGems })
      }
    }

    const equippedItemLevel =
      items.length > 0
        ? Math.round(items.reduce((sum, i) => sum + i.itemLevel, 0) / items.length)
        : 0

    return {
      characterName: raw.character.name,
      realmSlug: raw.character.realm.slug,
      equippedItemLevel,
      items,
      issues,
    }
  }
}
