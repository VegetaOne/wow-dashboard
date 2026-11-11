import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EquipmentPanel } from "@/components/EquipmentPanel"
import { LootIndexPanel } from "@/components/LootIndexPanel"
import { SlotCandidates } from "@/components/SlotCandidates"
import { NoDataYet } from "@/components/NoDataYet"
import { getItemIcons } from "@/lib/battlenet"
import { attempt, characterFromParam, equipment, media } from "@/lib/character"
import { getT } from "@/lib/t"

export default async function CharacterEquipmentPage({
  params,
}: {
  params: { character: string }
}) {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) redirect("/login")

  const t = await getT()
  const ref = characterFromParam(params.character)

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
        session.accessToken
      )
    : {}

  return (
    <div className="px-6 py-6">
      <LootIndexPanel />

      <div className="mb-8">
        <SlotCandidates slug={ref.slug} />
      </div>

      {eq ? (
        <EquipmentPanel equipment={eq} icons={icons} renderUrl={renderUrl} />
      ) : equipmentResult.notFound ? (
        <NoDataYet />
      ) : (
        <div className="border-2 border-accent px-4 py-3 text-[13px]">
          <span className="eyebrow block">{t("equipment.noData")}</span>
          {t("equipment.loadFailedText")}
        </div>
      )}
    </div>
  )
}
