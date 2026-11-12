/**
 * Wörterbuch: Bereich `talents`.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  // ─── Seite ────────────────────────────────────────────────────────────────
  "talents.intro":
    "The talent trees of the class with the points this character has spent. Talents update only when the character logs out.",
  "talents.unavailable": "Talent trees not available",
  "talents.unavailableText":
    "The talent endpoints did not answer, or the class of this character could not be determined.",
  "talents.noneSpent": "No talent points spent yet.",
  "talents.spentTotal": "{points} points spent",
  "talents.inTree": "{points} in {tree}",
  "talents.unmatched":
    "{count} talent ranks of this character match no node in the trees — they are not shown.",

  // ─── Knoten ───────────────────────────────────────────────────────────────
  "talents.rank": "Rank {rank}/{max}",
  "talents.requires": "Requires {name} at full rank",
  "talents.nextRank": "Next rank",
}

export const de: Record<keyof typeof en, string> = {
  "talents.intro":
    "Die Talentbäume der Klasse mit den Punkten, die dieser Charakter verteilt hat. Talente aktualisieren sich erst, wenn der Charakter sich ausloggt.",
  "talents.unavailable": "Talentbäume nicht abrufbar",
  "talents.unavailableText":
    "Die Talent-Endpunkte haben nicht geantwortet, oder die Klasse dieses Charakters liess sich nicht bestimmen.",
  "talents.noneSpent": "Noch keine Talentpunkte verteilt.",
  "talents.spentTotal": "{points} Punkte verteilt",
  "talents.inTree": "{points} in {tree}",
  "talents.unmatched":
    "{count} Talentränge dieses Charakters passen zu keinem Knoten in den Bäumen – sie fehlen in der Anzeige.",

  "talents.rank": "Rang {rank}/{max}",
  "talents.requires": "Setzt {name} auf vollem Rang voraus",
  "talents.nextRank": "Nächster Rang",
}
