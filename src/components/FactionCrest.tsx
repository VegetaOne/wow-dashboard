/**
 * Eigene, generische Fraktionssymbole:
 * Allianz = Schild, Horde = gezackter Stern.
 * Bewusst keine Nachbildung der offiziellen Blizzard-Wappen.
 */

interface FactionCrestProps {
  faction: "ALLIANCE" | "HORDE"
  className?: string
}

export function FactionCrest({ faction, className = "w-4 h-4" }: FactionCrestProps) {
  if (faction === "ALLIANCE") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M12 2.5 4.5 5.4v6.4c0 4.7 3.1 8.2 7.5 9.7 4.4-1.5 7.5-5 7.5-9.7V5.4L12 2.5Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 7.5v8M8.5 11h7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5 14.4 7l4.9-.6-2.2 4.4 3 3.8-4.8 1.2L14.4 21 12 18.1 9.6 21l-.9-5.2-4.8-1.2 3-3.8L4.7 6.4 9.6 7 12 2.5Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
