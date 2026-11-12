/**
 * Fraktionsmedaillon der Warband-Übergabe: Sechseck in Fraktionsfarbe mit
 * einem eigenen heraldischen Zeichen. Bewusst keine Blizzard-Wappen – das
 * sind geschützte Marken (siehe Übergabe, „Assets").
 *
 * `framed`: mit der goldenen Fahne dahinter, wie oben rechts auf den
 * Bühnenkarten.
 */

const MEDAL_CLIP = "polygon(50% 0, 100% 22%, 100% 70%, 50% 100%, 0 70%, 0 22%)"
const FRAME_CLIP = "polygon(24% 0, 100% 0, 100% 76%, 50% 100%, 0 24%)"
const GLYPH = {
  HORDE: "polygon(50% 100%, 12% 62%, 0 18%, 24% 30%, 50% 0, 76% 30%, 100% 18%, 88% 62%)",
  ALLIANCE: "polygon(50% 0, 100% 16%, 100% 54%, 50% 100%, 0 54%, 0 16%, 50% 34%)",
}

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
      className="grid place-items-center"
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
      <span
        style={{
          width: Math.round(size * 0.47),
          height: Math.round(size * 0.47),
          clipPath: GLYPH[faction],
          background: horde ? "#f3a48c" : "#bcd6f4",
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
