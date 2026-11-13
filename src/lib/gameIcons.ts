/**
 * Offizielle Spiel-Icons direkt von Blizzards Bild-CDN – dieselbe Quelle wie
 * die Gegenstands-Icons aus der API.
 *
 * Für Fraktionen gibt es keinen Medien-Endpunkt, für Klassen liefert
 * `/data/wow/media/playable-class/{id}` genau diese `classicon_*`-Adressen.
 * Fest verdrahtet statt abgefragt, weil sich die Namen nicht ändern und die
 * Bühne sonst für ein Icon auf den Forever-Static-Namespace warten müsste.
 *
 * Bewusst nicht ins Repo kopiert: geschützte Marken, das Repo ist öffentlich.
 * `eu` im Pfad ist nur das Verzeichnis des CDN, kein Bezug zur eingestellten
 * Region. Rein, ohne Server-Abhängigkeit – darf in Client-Komponenten.
 */

const CDN = "https://render.worldofwarcraft.com/eu/icons/56"

export function factionIconUrl(faction: "HORDE" | "ALLIANCE"): string {
  return `${CDN}/${faction === "HORDE" ? "ui_hordeicon" : "ui_allianceicon"}.jpg`
}

/** Blizzards Klassen-ID → Dateiname des Icons. */
const CLASS_ICON_NAMES: Record<number, string> = {
  1: "warrior",
  2: "paladin",
  3: "hunter",
  4: "rogue",
  5: "priest",
  6: "deathknight",
  7: "shaman",
  8: "mage",
  9: "warlock",
  10: "monk",
  11: "druid",
  12: "demonhunter",
  13: "evoker",
}

/** `null` bei einer unbekannten Klassen-ID – dann lieber kein Bild als ein falsches. */
export function classIconUrl(classId: number): string | null {
  const name = CLASS_ICON_NAMES[classId]
  return name ? `${CDN}/classicon_${name}.jpg` : null
}

/**
 * Als `ref` an ein Icon-`<img>`, zusammen mit `onError`: blendet ein Bild aus,
 * das schon vor dem Hydrieren gescheitert ist – dessen `error`-Ereignis kam,
 * bevor React zuhörte. Ein leeres `alt` allein reicht nicht, bei fester Grösse
 * zeichnet Chrome trotzdem das Kaputt-Symbol.
 */
export function hideIfBroken(img: HTMLImageElement | null): void {
  if (img && img.complete && img.naturalWidth === 0) img.style.display = "none"
}
