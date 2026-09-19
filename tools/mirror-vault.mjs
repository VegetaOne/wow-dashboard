#!/usr/bin/env node
/**
 * Spiegelt docs/ als Obsidian-Notizen in den Vault.
 *
 * docs/ ist die Quelle. Dieses Skript erzeugt daraus Notizen mit Frontmatter und
 * Wikilinks und legt sie im Vault ab — es liest den Vault nie und überschreibt die
 * Zieldateien vollständig.
 *
 * Aufruf:  node tools/mirror-vault.mjs "F:/Obsidian/Obsidian"
 */

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join, dirname, posix } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const VAULT = process.argv[2]

if (!VAULT) {
  console.error('Aufruf: node tools/mirror-vault.mjs "<Pfad zum Vault>"')
  process.exit(1)
}

/** Unterordner im Vault, in dem der Spiegel liegt. */
const TARGET_DIR = join(VAULT, "10_Projekte", "Gaming", "WorldOfWarcraft", "WoW Dashboard")

/** docs-Datei -> [Notizname, Unterordner, Datum im Frontmatter] */
const NOTES = {
  "README.md":            ["WoW Dashboard", "", "2026-09-19"],
  "stand.md":             ["WoW Dashboard - Konzept und Stand", "Konzept", "2026-09-15"],
  "roadmap.md":           ["WoW Dashboard - Roadmap", "Konzept", "2026-09-15"],
  "reihenfolge.md":       ["WoW Dashboard - Reihenfolge und Entscheide", "Konzept", "2026-09-19"],
  "i18n.md":              ["WoW Dashboard - i18n", "Konzept", "2026-09-19"],
  "setup-modus.md":       ["WoW Dashboard - Setup-Modus", "Konzept", "2026-09-16"],
  "wochenuebersicht.md":  ["WoW Dashboard - Wochenübersicht", "Konzept", "2026-09-16"],
  "auftraege/i18n-abschluss.md": ["WoW Dashboard - Auftrag i18n", "Aufträge", "2026-09-19"],
}

/**
 * Markdown-Links auf Wikilinks umschreiben.
 *
 * `target` steht relativ zum Ordner der Quelldatei; aufgelöst wird gegen `docs/`.
 * Nur Ziele innerhalb von docs/ werden Wikilinks — alles darüber (`../CLAUDE.md`,
 * `../README.md`) hat im Vault keine Notiz und wird als Text gesetzt, damit kein toter
 * Link entsteht. Trägt der Linktext noch den Dateinamen, wird der Notizname genommen.
 */
function toWikilinks(text, baseDir) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, target) => {
    if (/^https?:|^#/.test(target)) return match

    const resolved = posix.normalize(posix.join(baseDir, target))
    if (resolved.startsWith("..")) return `\`${label.replace(/\.md$/, "")}\``

    const note = NOTES[resolved]?.[0]
    if (!note) return match

    const display = label.endsWith(".md") ? note : label
    return display === note ? `[[${note}]]` : `[[${note}|${display}]]`
  })
}

const frontmatter = (title, date) =>
  `---\ntitle: ${title}\ndate: ${date}\ntags: [tech, wow, wow-dashboard]\ntype: projekt\nstatus: aktiv\n---\n\n`

const banner = (isIndex) =>
  isIndex
    ? "> [!info] Spiegel aus dem Repo\n> Erzeugt aus `docs/` im Repo `wow-dashboard`. Änderungen dort machen, nicht hier —\n> beim nächsten Abgleich wird diese Notiz überschrieben.\n\n"
    : "> [!info] Spiegel aus dem Repo · Teil von [[WoW Dashboard]]\n> Erzeugt aus `docs/` im Repo `wow-dashboard`. Änderungen dort machen, nicht hier.\n\n"

let written = 0
for (const [file, [title, sub, date]] of Object.entries(NOTES)) {
  const source = await readFile(join(ROOT, "docs", file), "utf8")
  const body = toWikilinks(source.replace(/^#\s+[^\n]+\n+/, ""), posix.dirname(file))
  const dir = sub ? join(TARGET_DIR, sub) : TARGET_DIR
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${title}.md`), frontmatter(title, date) + banner(!sub) + body, "utf8")
  written++
}

console.log(`${written} Notizen geschrieben nach ${TARGET_DIR}`)
