/**
 * WoW Dashboard – Adapter Interface
 *
 * Jede WoW-Version implementiert dieses Interface.
 * Das Frontend kennt nur dieses Interface – nie den konkreten Adapter.
 *
 * Implementierungen:
 *  - BlizzardAdapter  → Retail (battle.net API)
 *  - WoWForeverAdapter → WoW Forever (TBD, BlizzCon '26)
 */

// ─── Basis-Typen ──────────────────────────────────────────────────────────────

export interface Realm {
  slug: string
  name: string
}

export interface Character {
  id: number
  name: string
  realm: Realm
  level: number
  faction: "ALLIANCE" | "HORDE" | "NEUTRAL"
  classId: number
  className: string
  raceName: string
  gender: "MALE" | "FEMALE"
  /** Direkt angelegtes ilvl */
  equippedItemLevel?: number
  /** Durchschnitt inkl. Bag */
  averageItemLevel?: number
  /** Avatar-URL */
  avatarUrl?: string | null
}

export interface ItemSocket {
  filled: boolean
  gemName?: string
}

export interface EquipmentItem {
  slotType: string          // z.B. "HEAD", "CHEST", "MAIN_HAND"
  itemId: number
  itemName: string
  itemLevel: number
  quality: ItemQuality
  enchanted: boolean
  enchantDescription?: string
  sockets: ItemSocket[]
  iconUrl?: string
}

export type ItemQuality =
  | "POOR"
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "ARTIFACT"
  | "HEIRLOOM"

export interface CharacterEquipmentData {
  characterName: string
  realmSlug: string
  equippedItemLevel: number
  items: EquipmentItem[]
  /** Slots mit fehlenden Gems oder Enchants */
  issues: EquipmentIssue[]
}

export interface EquipmentIssue {
  slotType: string
  itemName: string
  type: "MISSING_GEM" | "MISSING_ENCHANT"
  count?: number
}

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface WoWDataAdapter {
  /** Identifier für diesen Adapter (z.B. "retail", "wow-forever") */
  readonly id: string

  /** Anzeigename (z.B. "World of Warcraft", "WoW Forever") */
  readonly displayName: string

  /**
   * Alle Charaktere des eingeloggten Battle.net Accounts.
   * @param token  OAuth Access Token des Users
   */
  getAccountCharacters(token: string): Promise<Character[]>

  /**
   * Ausrüstung eines einzelnen Charakters, inkl. Issues-Analyse.
   * @param realm  Realm-Slug (z.B. "argent-dawn")
   * @param name   Charaktername (lowercase)
   * @param token  OAuth Access Token
   */
  getCharacterEquipment(
    realm: string,
    name: string,
    token: string
  ): Promise<CharacterEquipmentData>

  /**
   * Avatar-URL des Charakters. Gibt null zurück wenn nicht verfügbar.
   */
  getCharacterMedia(
    realm: string,
    name: string,
    token: string
  ): Promise<string | null>
}

// ─── Hilfs-Typen für Komponenten ─────────────────────────────────────────────

/** Welche WoW-Version ist aktiv */
export type GameMode = "retail" | "wow-forever"

export const GAME_MODES: Record<GameMode, { label: string; color: string }> = {
  "retail":      { label: "Retail",      color: "#1A6B9A" },
  "wow-forever": { label: "WoW Forever", color: "#8B5CF6" },
}
