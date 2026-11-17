/**
 * Tooltip eines angelegten Gegenstands als Zeilenliste, so aufgebaut wie im
 * Spiel: Name, Bindung, Art, Waffenwerte, Rüstung, Werte, Verzauberung,
 * Sockel, Haltbarkeit, Anforderungen, Effekte, Set, Beschreibung, Preis.
 *
 * Rein und ohne Importe – testbar mit `tests/load-ts.mjs`. Gelesen wird
 * tolerant: die Forever-API ist nicht dokumentiert, jedes Feld darf fehlen,
 * und ein fehlendes Feld ergibt keine Zeile statt einer leeren.
 *
 * Fast jeder Text kommt fertig formuliert und in der API-Sprache von
 * Battle.net (`display_string`, `description`). Übersetzt wird hier darum
 * nichts; nur wo die API keinen Text liefert, trägt die Zeile einen
 * Wörterbuchschlüssel, den die Anzeige auflöst.
 */

/** Farbton einer Zeile – die Anzeige legt die Farben fest. */
export type TooltipTone =
  | "plain"
  /** Grün im Spiel: Sekundärwerte, Verzauberung, Effekte, aktive Setboni */
  | "green"
  /** Gold: Beschreibungstext, Setname */
  | "gold"
  /** Grau: inaktive Werte, nicht angelegte Setteile, inaktive Setboni */
  | "dim"
  /** Hervorgehoben im Stil der Kopfzeile, etwa die Gegenstandsstufe */
  | "heading"

export interface TooltipLine {
  /** Linker Text; leer, wenn `key` gesetzt ist */
  text: string
  /** Rechtsbündiger Zusatz wie die Waffengeschwindigkeit */
  right?: string
  tone: TooltipTone
  /** Farbe aus der API (`display.color`), hat Vorrang vor dem Ton */
  color?: string
  /** Wörterbuchschlüssel statt Text, wo die API keinen liefert */
  key?: "equipment.emptySocket" | "equipment.itemLevelValue"
  /** Platzhalter zum Schlüssel */
  params?: Record<string, string | number>
  /** Sockelzeile: gefüllt oder leer – die Anzeige zeichnet das Kästchen */
  socket?: "filled" | "empty"
  /** Neuer Abschnitt: etwas Abstand davor */
  gap?: boolean
}

export interface TooltipPrice {
  header: string | null
  gold: number
  silver: number
  copper: number
}

export interface ItemTooltipModel {
  lines: TooltipLine[]
  /** Verkaufspreis, nur wenn die API ihn nennt */
  price: TooltipPrice | null
  /** true, wenn eine Zeile den Platz nennt (Kopf, Brust …) – dann nicht doppelt zeigen */
  hasSlotLine: boolean
}

type Raw = Record<string, unknown>

function obj(value: unknown): Raw | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** `display_string` direkt oder unter `display` – die API kennt beides. */
function displayString(value: unknown): string | null {
  const o = obj(value)
  if (!o) return str(value)
  return str(o.display_string) ?? str(obj(o.display)?.display_string)
}

/** API-Farbe `{ r, g, b, a }` als CSS. Weiss ist die Grundfarbe und fällt weg. */
function apiColor(value: unknown): string | undefined {
  const c = obj(obj(value)?.color) ?? obj(value)
  if (!c) return undefined
  const r = num(c.r)
  const g = num(c.g)
  const b = num(c.b)
  if (r == null || g == null || b == null) return undefined
  if (r === 255 && g === 255 && b === 255) return undefined
  return `rgb(${r}, ${g}, ${b})`
}

export function buildItemTooltip(raw: unknown): ItemTooltipModel {
  const item = obj(raw) ?? {}
  const lines: TooltipLine[] = []
  const push = (line: TooltipLine) => lines.push(line)
  let section = false
  /** Erste Zeile eines neuen Abschnitts bekommt Abstand */
  const startSection = () => {
    section = lines.length > 0
  }
  const add = (line: TooltipLine) => {
    push(section ? { ...line, gap: true } : line)
    section = false
  }

  // ── Kopf: Zusatzname, Stufe, Bindung, Einzigartigkeit ─────────────────────
  const nameDescription = displayString(item.name_description)
  if (nameDescription) add({ text: nameDescription, tone: "green" })

  const level = obj(item.level)
  const levelValue = num(level?.value)
  const levelText = str(level?.display_string)
  if (levelText) add({ text: levelText, tone: "heading" })
  else if (levelValue != null) add({ text: "", tone: "heading", key: "equipment.itemLevelValue", params: { level: levelValue } })

  const binding = str(obj(item.binding)?.name)
  if (binding) add({ text: binding, tone: "plain" })

  const unique = displayString(item.unique_equipped)
  if (unique) add({ text: unique, tone: "plain" })

  const limit = displayString(item.limit_category)
  if (limit) add({ text: limit, tone: "plain" })

  // ── Art: Platz links, Gegenstandsart rechts ───────────────────────────────
  const slotName = str(obj(item.inventory_type)?.name)
  const subclass = item.is_subclass_hidden === true ? null : str(obj(item.item_subclass)?.name)
  if (slotName || subclass) add({ text: slotName ?? "", right: subclass ?? undefined, tone: "plain" })

  // ── Waffe ─────────────────────────────────────────────────────────────────
  const weapon = obj(item.weapon)
  if (weapon) {
    const damage = displayString(weapon.damage)
    const speed = displayString(weapon.attack_speed)
    if (damage || speed) add({ text: damage ?? "", right: speed ?? undefined, tone: "plain" })
    const dps = displayString(weapon.dps)
    if (dps) add({ text: dps, tone: "plain" })
  }

  // ── Rüstung und Werte ─────────────────────────────────────────────────────
  const armor = obj(item.armor)
  const armorText = displayString(armor)
  if (armorText) add({ text: armorText, tone: "plain", color: apiColor(obj(armor?.display)) })

  for (const s of arr(item.stats)) {
    const stat = obj(s)
    const display = obj(stat?.display)
    const text = displayString(stat)
    if (!text) continue
    // `is_negated`: der Wert greift gerade nicht (etwa falsche Spezialisierung)
    const negated = stat?.is_negated === true
    add({ text, tone: negated ? "dim" : "plain", color: negated ? undefined : apiColor(display) })
  }

  // ── Verzauberung und Sockel ───────────────────────────────────────────────
  startSection()
  for (const e of arr(item.enchantments)) {
    const text = displayString(e)
    if (text) add({ text, tone: "green" })
  }

  for (const s of arr(item.sockets)) {
    const socket = obj(s)
    if (!socket) continue
    const gem = str(obj(socket.item)?.name)
    const bonus = displayString(socket)
    if (gem) add({ text: bonus ? `${gem} – ${bonus}` : gem, tone: "plain", socket: "filled" })
    else add({ text: "", tone: "plain", key: "equipment.emptySocket", socket: "empty" })
  }

  // ── Haltbarkeit und Anforderungen ─────────────────────────────────────────
  startSection()
  const durability = displayString(item.durability)
  if (durability) add({ text: durability, tone: "plain" })

  const requirements = obj(item.requirements)
  if (requirements) {
    // Jede Anforderung (Stufe, Klasse, Beruf, Ruf …) trägt ihren eigenen Text
    for (const value of Object.values(requirements)) {
      const text = displayString(value)
      if (text) add({ text, tone: "plain" })
    }
  }

  // ── Effekte: „Anlegen:", „Benutzen:", „Trefferchance:" ────────────────────
  startSection()
  for (const s of arr(item.spells)) {
    const spell = obj(s)
    const text = str(spell?.description) ?? str(obj(spell?.spell)?.name)
    if (text) add({ text, tone: "green" })
  }

  // ── Set ───────────────────────────────────────────────────────────────────
  const set = obj(item.set)
  if (set) {
    startSection()
    const setName = displayString(set) ?? str(obj(set.item_set)?.name)
    if (setName) add({ text: setName, tone: "gold" })
    for (const i of arr(set.items)) {
      const part = obj(i)
      const name = str(obj(part?.item)?.name)
      if (name) add({ text: `  ${name}`, tone: part?.is_equipped === true ? "plain" : "dim" })
    }
    startSection()
    for (const e of arr(set.effects)) {
      const effect = obj(e)
      const text = displayString(effect)
      if (text) add({ text, tone: effect?.is_active === true ? "green" : "dim" })
    }
  }

  // ── Beschreibung ──────────────────────────────────────────────────────────
  const description = str(item.description)
  if (description) {
    startSection()
    // Gerade Anführungszeichen wie im Spiel – unabhängig von der Sprache
    add({ text: `"${description}"`, tone: "gold" })
  }

  // ── Verkaufspreis ─────────────────────────────────────────────────────────
  let price: TooltipPrice | null = null
  const sell = obj(item.sell_price)
  const sellValue = num(sell?.value)
  if (sellValue != null && sellValue > 0) {
    price = {
      header: str(obj(sell?.display_strings)?.header),
      gold: Math.floor(sellValue / 10000),
      silver: Math.floor(sellValue / 100) % 100,
      copper: sellValue % 100,
    }
  }

  return { lines, price, hasSlotLine: !!slotName }
}
