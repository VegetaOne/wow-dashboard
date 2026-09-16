/**
 * Laufzeitwerte, die früher Konstanten waren.
 *
 * Region und Sprache stehen jetzt in der Datenbank und können sich zur
 * Laufzeit ändern. Sie dürfen deshalb nicht mehr beim Laden des Moduls
 * eingefroren werden – `const API_BASE = ...` am Dateianfang wäre genau
 * das. Diese Funktionen werden bei jedem Aufruf ausgewertet.
 *
 * Gelesen wird aus dem Zwischenspeicher der Konfiguration; die
 * Einstiegspunkte (Dashboard-Layout, API-Routen, Auth-Route) warten
 * `loadConfig()` ab, bevor hier etwas gebraucht wird.
 */

import { configSnapshot, LANGUAGES } from "./config-cache"

export function region(): string {
  return configSnapshot()?.region || "eu"
}

/** Locale für die API – abgeleitet aus der eingestellten Sprache. */
export function locale(): string {
  const language = configSnapshot()?.language ?? "en"
  return LANGUAGES.find((l) => l.id === language)?.locale ?? "en_GB"
}

export function apiBase(): string {
  return `https://${region()}.api.blizzard.com`
}

/** Basis der OAuth-Endpunkte, ebenfalls regionsabhängig. */
export function oauthBase(): string {
  return `https://${region()}.battle.net`
}
