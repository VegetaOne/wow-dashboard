"use client"

import { factionIconUrl, hideIfBroken } from "@/lib/gameIcons"

/**
 * Fraktionsmedaillon der Warband-Übergabe: Sechseck mit dem offiziellen
 * Fraktionswappen (`ui_hordeicon`, `ui_allianceicon`, Herkunft siehe
 * `gameIcons.ts`).
 *
 * Lädt das Bild nicht, wird es ausgeblendet und das Sechseck bleibt in
 * Fraktionsfarbe stehen. Client-Komponente nur dafür (`ref`/`onError`, siehe
 * `hideIfBroken`).
 *
 * `framed`: mit der goldenen Fahne dahinter, wie oben rechts auf den
 * Bühnenkarten.
 */

const MEDAL_CLIP = "polygon(50% 0, 100% 22%, 100% 70%, 50% 100%, 0 70%, 0 22%)"
const FRAME_CLIP = "polygon(24% 0, 100% 0, 100% 76%, 50% 100%, 0 24%)"

export function FactionMedallion({
  faction,
  framed = false,
  size = 34,
}: {
  faction: "HORDE" | "ALLIANCE"
  framed?: boolean
  /** Breite des Medaillons; die Höhe folgt im Verhältnis der Übergabe */
  size?: number
}) {
  const horde = faction === "HORDE"
  const medal = (
    <span
      className="block overflow-hidden"
      style={{
        width: size,
        height: Math.round(size * 1.06),
        clipPath: MEDAL_CLIP,
        background: horde
          ? "radial-gradient(circle at 50% 30%, #8e2113, #3d0f07)"
          : "radial-gradient(circle at 50% 30%, #26507f, #12253c)",
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={factionIconUrl(faction)}
        alt=""
        className="h-full w-full object-cover"
        ref={hideIfBroken}
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />
    </span>
  )

  if (!framed) return medal

  return (
    <span
      className="grid place-items-center"
      style={{
        width: Math.round(size * 1.59),
        height: Math.round(size * 1.7),
        clipPath: FRAME_CLIP,
        background: "linear-gradient(150deg, var(--wb-gold-lit) 0%, var(--wb-gold) 42%, #6d5117 100%)",
        filter: "drop-shadow(-2px 2px 8px var(--wb-plate-2))",
      }}
      aria-hidden
    >
      <span style={{ transform: "translate(4px, -4px)" }}>{medal}</span>
    </span>
  )
}
