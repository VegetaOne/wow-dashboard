/**
 * Wörterbuch: Bereich `refresh` – Knopf „neu laden" in der Heldenakte.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten.
 */

export const en = {
  "refresh.label": "Reload",
  "refresh.busy": "Loading…",
  "refresh.failed": "Reload failed",
  "refresh.hint": "Fetch this character's data fresh from Battle.net. Battle.net only updates a profile after the character logs out.",
}

export const de: Record<keyof typeof en, string> = {
  "refresh.label": "Neu laden",
  "refresh.busy": "Lädt …",
  "refresh.failed": "Neu laden fehlgeschlagen",
  "refresh.hint": "Die Daten dieses Charakters frisch von Battle.net holen. Battle.net aktualisiert ein Profil erst, wenn sich der Charakter ausloggt.",
}
