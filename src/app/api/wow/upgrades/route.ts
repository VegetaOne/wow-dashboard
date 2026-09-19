import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import {
  getCharacterEquipment,
  GAME_MODES,
  SLOT_ORDER,
  SLOT_NAMES,
  type GameMode,
} from "@/lib/battlenet"
import { getIndexStatus, getSlotCandidates, type LootCandidate } from "@/lib/loot"
import { getT } from "@/lib/t"

export interface SlotUpgrades {
  slotType: string
  slotName: string
  equippedName: string | null
  equippedLevel: number | null
  /** Kandidaten aus den indexierten Loot-Tabellen, höchste Stufe zuerst */
  candidates: LootCandidate[]
}

/**
 * Loot-Kandidaten je Slot für einen Charakter.
 *
 * Das ist ausdrücklich KEINE Best-in-Slot-Liste: ohne Statgewichte
 * lässt sich nicht bewerten, ob ein Item für die Spezialisierung besser
 * ist. Geliefert wird, was für den Slot überhaupt droppt, plus Quelle.
 */
export async function GET(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const realm = params.get("realm")
  const name = params.get("name")
  const mode = (GAME_MODES.find((m) => m.id === params.get("mode"))?.id ??
    "retail") as GameMode

  if (!realm || !name) {
    return NextResponse.json({ error: t("loot.realmAndNameRequired") }, { status: 400 })
  }

  const indexStatus = await getIndexStatus(mode)

  // Ohne Index gibt es nichts zu vergleichen – das sagen wir offen,
  // statt eine leere Liste als "keine Upgrades" auszugeben.
  if (indexStatus.itemCount === 0) {
    return NextResponse.json({ indexStatus, slots: [] })
  }

  try {
    const equipment = await getCharacterEquipment(
      realm,
      name,
      session.accessToken,
      mode
    )
    const equipped = equipment.equipped_items ?? []

    const bySlot = new Map(
      equipped
        .filter((i) => i.slot?.type)
        .map((i) => [i.slot.type, i] as const)
    )

    const slots: SlotUpgrades[] = []

    for (const slotType of SLOT_ORDER) {
      const candidates = await getSlotCandidates(mode, slotType)
      if (candidates.length === 0) continue

      const item = bySlot.get(slotType)
      slots.push({
        slotType,
        slotName: SLOT_NAMES[slotType] ?? slotType,
        equippedName: item?.name ?? item?.item?.name ?? null,
        equippedLevel: item?.level?.value ?? null,
        candidates,
      })
    }

    return NextResponse.json({ indexStatus, slots })
  } catch (error) {
    console.error("Upgrade-Kandidaten fehlgeschlagen:", error)
    return NextResponse.json(
      { error: t("loot.candidatesFailed") },
      { status: 500 }
    )
  }
}
