"use client"

import { useState } from "react"
import { NOTE_MAX_LENGTH, type CharacterNoteView } from "@/lib/notes"
import { useT } from "./I18nProvider"

/**
 * Angeheftete Notizen in der Heldenakte: kurze, abhakbare Merkzettel je
 * Charakter, in jedem Bereich unter dem Aktenkopf sichtbar.
 *
 * Abgehakte Einträge bleiben durchgestrichen an ihrem Platz, statt sofort
 * ans Ende zu springen – sonst rutscht beim Klicken die Liste unter dem
 * Mauszeiger weg. Beim nächsten Laden stehen die offenen oben (`sortNotes`).
 *
 * `initialNotes: null` heisst: konnten nicht geladen werden. Dann steht das
 * da, statt eine leere Liste vorzutäuschen.
 */
export function CharacterNotes({
  slug,
  initialNotes,
}: {
  slug: string
  initialNotes: CharacterNoteView[] | null
}) {
  const t = useT()
  const [notes, setNotes] = useState<CharacterNoteView[]>(initialNotes ?? [])
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const unavailable = initialNotes === null

  async function send(method: "POST" | "PATCH" | "DELETE", body: object): Promise<Record<string, unknown> | null> {
    setError(null)
    try {
      const res = await fetch("/api/character-notes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("notes.saveFailed"))
        return null
      }
      return data ?? {}
    } catch {
      setError(t("notes.saveFailed"))
      return null
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || busy) return
    setBusy(true)
    const data = await send("POST", { slug, text: draft })
    setBusy(false)
    const note = data?.note as CharacterNoteView | undefined
    if (!note) return
    // Neue Notiz ans Ende der offenen, vor die erledigten
    setNotes((all) => {
      const firstDone = all.findIndex((n) => n.done)
      return firstDone === -1 ? [...all, note] : [...all.slice(0, firstDone), note, ...all.slice(firstDone)]
    })
    setDraft("")
  }

  async function toggle(note: CharacterNoteView) {
    const flip = (done: boolean) =>
      setNotes((all) => all.map((n) => (n.id === note.id ? { ...n, done } : n)))
    flip(!note.done)
    if (!(await send("PATCH", { id: note.id, done: !note.done }))) flip(note.done)
  }

  async function remove(note: CharacterNoteView) {
    const before = notes
    setNotes((all) => all.filter((n) => n.id !== note.id))
    if (!(await send("DELETE", { id: note.id }))) setNotes(before)
  }

  return (
    <div className="flex gap-4 border-b px-[22px] py-2.5" style={{ borderColor: "var(--wb-gold-faint)" }}>
      <span className="eyebrow flex-none pt-[7px]">{t("notes.title")}</span>

      <div className="min-w-0 flex-1">
        {unavailable ? (
          <p className="pt-[5px] text-[12px] italic" style={{ color: "var(--wb-ink-dim)" }}>
            {t("notes.loadFailed")}
          </p>
        ) : (
          <>
            {notes.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {notes.map((note) => (
                  <li key={note.id} className="flex items-start gap-2.5 text-[13px]">
                    <input
                      type="checkbox"
                      checked={note.done}
                      onChange={() => toggle(note)}
                      aria-label={note.done ? t("notes.markOpen") : t("notes.markDone")}
                      title={note.done ? t("notes.markOpen") : t("notes.markDone")}
                      className="mt-[3px] h-3.5 w-3.5 flex-none cursor-pointer"
                      style={{ accentColor: "var(--wb-gold)" }}
                    />
                    <span
                      className="min-w-0 flex-1 break-words"
                      style={note.done ? { textDecoration: "line-through", color: "var(--wb-ink-dim)" } : undefined}
                    >
                      {note.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(note)}
                      aria-label={t("notes.delete")}
                      title={t("notes.delete")}
                      className="flex-none px-1 text-[15px] leading-none opacity-50 transition-opacity hover:opacity-100"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={add} className="flex items-center gap-2">
              <input
                className="input min-w-0 flex-1 text-[13px]"
                value={draft}
                maxLength={NOTE_MAX_LENGTH}
                placeholder={t("notes.placeholder")}
                aria-label={t("notes.placeholder")}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary flex-none" disabled={busy || !draft.trim()}>
                {t("notes.add")}
              </button>
            </form>

            {error && (
              <p className="mt-1.5 text-[12px]" style={{ color: "var(--wb-horde-lit)" }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
