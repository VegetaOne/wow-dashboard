"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useFormat, useT } from "./I18nProvider"
import type { TranslationKey } from "@/lib/i18n"
import {
  allocationFromRanks,
  parseBuildImport,
  type ImportError,
  type TalentRanks,
  type TalentTree,
} from "@/lib/talent-tree"

/**
 * Austausch von Talentbuilds als Popup (Wunsch 2026-11-12): Export zeigt das
 * JSON mit „Kopieren", Import nimmt eingefügten Text oder eine Datei. So
 * muss für einen Austausch keine Datei entstehen; die Datei bleibt Option.
 */

const IMPORT_ERROR: Record<ImportError, TranslationKey> = {
  json: "planner.importErrorJson",
  format: "planner.importErrorFormat",
  version: "planner.importErrorVersion",
  content: "planner.importErrorContent",
}

/**
 * Natives `<dialog>` mit `showModal()`: Fokus bleibt im Popup, Escape
 * schliesst, der Rest der Seite ist gesperrt – ohne eigene Fokusfalle.
 */
function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Klick auf den Hintergrund (das dialog-Element selbst) schliesst
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="w-[min(600px,92vw)] p-0 backdrop:bg-black/70"
      style={{ background: "var(--wb-panel)", color: "var(--wb-ink)", border: "2px solid var(--wb-gold-faint)" }}
    >
      <div
        className="flex items-center gap-3 border-b px-5 py-3"
        style={{ borderColor: "var(--wb-gold-faint)", background: "linear-gradient(180deg, rgba(201,161,75,0.12), transparent)" }}
      >
        <h2 className="mr-auto font-heading text-[16px] font-bold" style={{ letterSpacing: "0.08em" }}>
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="wb-tab"
          style={{ minWidth: 34, height: 34, padding: 0, fontSize: 16, letterSpacing: 0 }}
          aria-label={t("akte.menuClose")}
          title={t("akte.menuClose")}
        >
          ✕
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  )
}

/**
 * Kopieren in die Zwischenablage. `navigator.clipboard` gibt es nur in
 * sicherem Kontext (https oder localhost) – im Heimnetz über `http://<IP>`
 * fehlt es. Dann der alte Weg über die markierte Textarea.
 */
async function copyText(text: string, area: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // weiter mit dem Rückfall
  }
  if (!area) return false
  area.focus()
  area.select()
  try {
    return document.execCommand("copy")
  } catch {
    return false
  }
}

export function ExportDialog({
  open,
  onClose,
  json,
  fileName,
}: {
  open: boolean
  onClose: () => void
  json: string
  fileName: string
}) {
  const t = useT()
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [copied, setCopied] = useState<boolean | null>(null)

  useEffect(() => {
    if (open) setCopied(null)
  }, [open])

  const download = () => {
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} title={t("planner.exportTitle")} onClose={onClose}>
      <p className="mb-2 text-[12px] italic" style={{ color: "var(--wb-ink-dim)" }}>
        {t("planner.exportHint")}
      </p>
      <textarea
        ref={areaRef}
        readOnly
        value={json}
        className="input h-64 w-full resize-y font-mono text-[12px]"
        onFocus={(e) => e.currentTarget.select()}
        aria-label={t("planner.exportTitle")}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => setCopied(await copyText(json, areaRef.current))}
        >
          {t("planner.copy")}
        </button>
        <button type="button" className="btn btn-secondary" onClick={download}>
          {t("planner.saveFile")}
        </button>
        {copied !== null && (
          <span role="status" className="text-[12px]" style={{ color: copied ? "var(--color-gain)" : "var(--color-loss)" }}>
            {copied ? t("planner.copied") : t("planner.copyFailed")}
          </span>
        )}
      </div>
    </Dialog>
  )
}

interface Parsed {
  classId: number
  name: string
  ranks: TalentRanks
}

/**
 * Import in zwei Schritten: erst Text einfügen oder Datei wählen und
 * prüfen, dann den Namen festlegen und speichern (Wunsch 2026-11-12).
 * Ein Build einer anderen Klasse wird bei seiner Klasse angelegt.
 */
export function ImportDialog({
  open,
  onClose,
  classId,
  classes,
  trees,
  busy,
  onImport,
}: {
  open: boolean
  onClose: () => void
  classId: number
  classes: { classId: number; className: string }[]
  trees: TalentTree[]
  busy: boolean
  /** `true` bei Erfolg, sonst die Meldung, die im Popup erscheint */
  onImport: (build: Parsed) => Promise<true | string>
}) {
  const t = useT()
  const f = useFormat()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [name, setName] = useState("")

  // Jedes Öffnen beginnt leer
  useEffect(() => {
    if (!open) return
    setText("")
    setError(null)
    setParsed(null)
    setName("")
  }, [open])

  const check = () => {
    const result = parseBuildImport(text)
    if (!result.ok) {
      setError(t(IMPORT_ERROR[result.error]))
      return
    }
    // Nur Klassen, die der Planer kennt – sonst wäre der Build danach unerreichbar
    if (!classes.some((c) => c.classId === result.classId)) {
      setError(t("planner.importUnknownClass"))
      return
    }
    setError(null)
    setParsed({ classId: result.classId, name: result.name, ranks: result.ranks })
    setName(result.name)
  }

  const points = parsed ? Object.values(parsed.ranks).reduce((a, b) => a + b, 0) : 0
  // Gegen die Bäume prüfen lässt sich nur die offene Klasse
  const unmatched = parsed && parsed.classId === classId ? allocationFromRanks(trees, parsed.ranks).unmatched : 0
  const targetClass = parsed ? classes.find((c) => c.classId === parsed.classId)?.className ?? null : null

  return (
    <Dialog open={open} title={t("planner.importTitle")} onClose={onClose}>
      {!parsed ? (
        <>
          <p className="mb-2 text-[12px] italic" style={{ color: "var(--wb-ink-dim)" }}>
            {t("planner.importHint")}
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            className="input h-56 w-full resize-y font-mono text-[12px]"
            placeholder='{ "format": "wow-dashboard/talent-build", … }'
            aria-label={t("planner.importTitle")}
            autoFocus
          />
          {error && (
            <p role="alert" className="mt-2 text-[12px]" style={{ color: "var(--color-loss)" }}>
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" onClick={check} disabled={!text.trim()}>
              {t("planner.importCheck")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              {t("planner.importFile")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (!file) return
                // Die Datei landet im Textfeld – geprüft wird wie beim Einfügen
                setText(await file.text())
                setError(null)
              }}
            />
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-[13px]" style={{ color: "var(--color-gain)" }}>
            {t("planner.importValid", { points: f.number(points), className: targetClass ?? "—" })}
          </p>
          {parsed.classId !== classId && (
            <p className="mb-3 text-[12px]" style={{ color: "var(--wb-gold-lit)" }}>
              {t("planner.importOtherClass", { className: targetClass ?? "—" })}
            </p>
          )}
          {unmatched > 0 && (
            <p className="mb-3 text-[12px] opacity-75">{t("talents.unmatched", { count: f.number(unmatched) })}</p>
          )}
          <label className="flex flex-col gap-1">
            <span className="eyebrow">{t("planner.name")}</span>
            <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          {error && (
            <p role="alert" className="mt-2 text-[12px]" style={{ color: "var(--color-loss)" }}>
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !name.trim()}
              onClick={async () => {
                const result = await onImport({ ...parsed, name: name.trim() })
                if (result === true) onClose()
                else setError(result)
              }}
            >
              {t("planner.save")}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setParsed(null)
                setError(null)
              }}
              disabled={busy}
            >
              {t("planner.importBack")}
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}
