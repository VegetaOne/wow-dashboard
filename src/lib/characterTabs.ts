/**
 * Unterseiten eines Charakters.
 *
 * `enabled` steuert, ob der Tab erscheint. Ein neues Feature schaltet hier
 * sein Flag um – so gibt es nie einen Tab, der auf eine leere Seite führt.
 */

export interface CharacterTab {
  /** Pfadsegment; leer = Übersichtsseite */
  slug: string
  label: string
  enabled: boolean
  /** Kurzer Hinweis, was der Tab zeigt – für die Titelzeile */
  note?: string
}

export const CHARACTER_TABS: CharacterTab[] = [
  { slug: "", label: "Ausrüstung", enabled: true, note: "Angelegte Gegenstände und Loot-Kandidaten" },
  { slug: "berufe", label: "Berufe", enabled: true, note: "Fertigkeitsstufen und Rezepte" },
  { slug: "fortschritt", label: "Fortschritt", enabled: true, note: "Raids, Dungeons, Mythisch+" },
  { slug: "sammlungen", label: "Sammlungen", enabled: true, note: "Titel und Spielzeug" },
  { slug: "erfolge", label: "Erfolge", enabled: true, note: "Erfolge nach Kategorie" },
  { slug: "ansehen", label: "Ansehen", enabled: true, note: "Ruf bei Fraktionen" },
  { slug: "pvp", label: "PvP", enabled: true, note: "Wertungen und Schlachtfelder" },
  { slug: "gilde", label: "Gilde", enabled: true, note: "Mitglieder, Erfolge, Ereignisse" },
  { slug: "wirtschaft", label: "Wirtschaft", enabled: true, note: "Herstellkosten gegen Verkaufspreis" },
  { slug: "logs", label: "Logs", enabled: false, note: "Warcraft Logs" },
  { slug: "verlauf", label: "Verlauf", enabled: true, note: "Entwicklung über Zeit" },
]

export function visibleTabs(): CharacterTab[] {
  return CHARACTER_TABS.filter((t) => t.enabled)
}

/** Basis-Pfad eines Charakters. Der Modus ist Teil der Adresse. */
export function characterBase(mode: string, realm: string, name: string): string {
  return `/dashboard/${mode}/${realm}/${name}`
}

export function tabHref(
  mode: string,
  realm: string,
  name: string,
  slug: string
): string {
  const base = characterBase(mode, realm, name)
  return slug ? `${base}/${slug}` : base
}
