import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAuthOptions } from "@/lib/auth"
import { getT } from "@/lib/t"
import { getOrCreateUser } from "@/lib/db"
import { isCharacterSlug } from "@/lib/battlenet"
import { region } from "@/lib/runtime"
import { cleanNoteText, NOTE_MAX_LENGTH, NOTES_PER_CHARACTER } from "@/lib/notes"
import { addNote, deleteNote, setNoteDone } from "@/lib/note-store"

/**
 * Angeheftete Notizen je Charakter: anlegen (POST), abhaken (PATCH),
 * löschen (DELETE). Gelesen wird serverseitig im Layout der Heldenakte,
 * darum kein GET. Alles nur für den angemeldeten Nutzer und die
 * eingestellte Region.
 */

async function currentUser() {
  const session = await getServerSession(await getAuthOptions())
  if (!session?.battleTag) return null
  return getOrCreateUser(session.battleTag)
}

export async function POST(req: NextRequest) {
  const t = await getT()
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })

  const body = await req.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug.toLowerCase() : ""
  if (!isCharacterSlug(slug)) {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }
  const text = cleanNoteText(body?.text)
  if (!text) {
    return NextResponse.json({ error: t("notes.invalid", { max: NOTE_MAX_LENGTH }) }, { status: 400 })
  }

  const note = await addNote(user.id, region(), slug, text)
  if (!note) {
    return NextResponse.json({ error: t("notes.limitReached", { max: NOTES_PER_CHARACTER }) }, { status: 409 })
  }
  return NextResponse.json({ note })
}

export async function PATCH(req: NextRequest) {
  const t = await getT()
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id : ""
  if (!id || typeof body?.done !== "boolean") {
    return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })
  }

  const ok = await setNoteDone(user.id, id, body.done)
  if (!ok) return NextResponse.json({ error: t("notes.notFound") }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const t = await getT()
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: t("core.notLoggedIn") }, { status: 401 })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: t("core.missingParameters") }, { status: 400 })

  // Schon weg ist für den Nutzer dasselbe wie gelöscht – kein Fehler
  await deleteNote(user.id, id)
  return NextResponse.json({ ok: true })
}
