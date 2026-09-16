import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EquipmentPanel } from "@/components/EquipmentPanel"
import { LootIndexPanel } from "@/components/LootIndexPanel"
import { SlotCandidates } from "@/components/SlotCandidates"
import { getItemIcons, GAME_MODES, type GameMode } from "@/lib/battlenet"
import { attempt, equipment, media } from "@/lib/character"

export default async function CharacterEquipmentPage({
  params,
}: {
  params: { mode: string; realm: string; name: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const { realm, name } = params
  const mode = (GAME_MODES.find((m) => m.id === params.mode)?.id ??
    "retail") as GameMode
  const ref = { realm, name, mode }

  const [equipmentResult, mediaResult] = await Promise.all([
    attempt(() => equipment(ref, session.accessToken!)),
    attempt(() => media(ref, session.accessToken!)),
  ])

  const eq = equipmentResult.value
  const renderUrl = mediaResult.value?.main ?? null

  // Icons erst nachladen, wenn die Ausrüstung da ist – wir brauchen die IDs.
  const icons = eq?.equipped_items?.length
    ? await getItemIcons(
        eq.equipped_items.map((i) => i.item.id),
        session.accessToken,
        mode
      )
    : {}

  return (
    <div className="px-6 py-6">
      <LootIndexPanel mode={mode} />

      <div className="mb-8">
        <SlotCandidates realm={realm} name={name} mode={mode} />
      </div>

      {eq ? (
        <EquipmentPanel
          equipment={eq}
          icons={icons}
          renderUrl={renderUrl}
          mode={mode}
        />
      ) : (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">Keine Ausrüstungsdaten</span>
          Die Ausrüstung konnte nicht geladen werden.
          {mode !== "retail" && (
            <span className="mt-1 block opacity-65">
              Die Classic-APIs liefern nicht für alle Charaktere Ausrüstungsdaten.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
