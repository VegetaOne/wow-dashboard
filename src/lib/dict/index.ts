/**
 * Alle Wörterbücher an einer Stelle zusammengeführt.
 *
 * Aufgeteilt nach Bereichen, damit an zwei Ansichten gleichzeitig gearbeitet
 * werden kann, ohne sich in einer einzigen riesigen Datei in die Quere zu
 * kommen. Ein neuer Bereich braucht eine Datei daneben und eine Zeile hier.
 *
 * Die Schlüssel dürfen sich zwischen den Bereichen nicht überschneiden: beim
 * Zusammenführen gewinnt sonst stillschweigend der spätere Eintrag. Die
 * Bereichspräfixe (`equipment.`, `guild.`, …) halten sie auseinander.
 */

import * as core from "./core"
import * as setup from "./setup"
import * as equipment from "./equipment"
import * as professions from "./professions"
import * as progress from "./progress"
import * as collections from "./collections"
import * as achievements from "./achievements"
import * as reputation from "./reputation"
import * as pvp from "./pvp"
import * as guild from "./guild"
import * as economy from "./economy"
import * as history from "./history"
import * as loot from "./loot"

export const EN = {
  ...core.en,
  ...setup.en,
  ...equipment.en,
  ...professions.en,
  ...progress.en,
  ...collections.en,
  ...achievements.en,
  ...reputation.en,
  ...pvp.en,
  ...guild.en,
  ...economy.en,
  ...history.en,
  ...loot.en,
}

export type TranslationKey = keyof typeof EN

export const DE: Record<TranslationKey, string> = {
  ...core.de,
  ...setup.de,
  ...equipment.de,
  ...professions.de,
  ...progress.de,
  ...collections.de,
  ...achievements.de,
  ...reputation.de,
  ...pvp.de,
  ...guild.de,
  ...economy.de,
  ...history.de,
  ...loot.de,
}
