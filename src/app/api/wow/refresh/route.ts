import { getServerSession } from "next-auth"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { isCharacterSlug, PROFILE_FETCH_TAG } from "@/lib/battlenet"
import { ACCOUNT_SCOPE, characterKey, guildKey, latestStored, requestRefresh } from "@/lib/snapshot"
import type { GuildRef } from "@/lib/guild"

/**
 * „Neu laden" in der Heldenakte: setzt für diesen Charakter, die
 * account-weiten Sammlungen und seine Gilde eine Marke, ab der gespeicherte
 * Stände als abgelaufen gelten, und verwirft den Datencache der
 * Profil-Abrufe. Geholt wird hier nichts – das tut die Seite beim
 * anschliessenden `router.refresh()`, und zwar nur, was sie anzeigt
 * (Nachladen auf Abruf bleibt).
 */
export async function POST(req: NextRequest) {
  const t = await getT()
  const session = await getServerSession(await getAuthOptions())
  if (!session?.accessToken) {
    return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.toLowerCase() : ""
  if (!isCharacterSlug(slug)) {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }

  const scopes = [slug, ACCOUNT_SCOPE]
  // Die Gilde aus dem letzten Stand, ohne Abruf. Hat er gewechselt, holt die
  // Gildenseite die neue Zugehörigkeit ohnehin frisch – die Marke liegt ja
  // auch auf dem Charakter.
  try {
    const guild = await latestStored<GuildRef | null>(characterKey(slug, "character-guild"))
    if (guild?.slug) scopes.push(guildKey(guild.slug, "guild").charSlug)
  } catch {
    // Ohne Gilde neu laden ist besser als gar nicht
  }

  requestRefresh(scopes)
  revalidateTag(PROFILE_FETCH_TAG)
  return NextResponse.json({ ok: true })
}
