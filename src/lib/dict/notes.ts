/**
 * Wörterbuch: Bereich `notes` – angeheftete Notizen in der Heldenakte.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  "notes.title": "Notes",
  "notes.placeholder": "Pin a to-do for this character…",
  "notes.add": "Pin",
  "notes.markDone": "Mark as done",
  "notes.markOpen": "Mark as open again",
  "notes.delete": "Delete note",
  "notes.invalid": "A note needs some text, up to {max} characters.",
  "notes.limitReached": "This character already has {max} notes. Delete a few first.",
  "notes.notFound": "This note no longer exists.",
  "notes.saveFailed": "Could not save – please try again.",
  "notes.loadFailed": "Notes could not be loaded right now.",
}

export const de: Record<keyof typeof en, string> = {
  "notes.title": "Notizen",
  "notes.placeholder": "Aufgabe für diesen Charakter anheften …",
  "notes.add": "Anheften",
  "notes.markDone": "Als erledigt markieren",
  "notes.markOpen": "Wieder öffnen",
  "notes.delete": "Notiz löschen",
  "notes.invalid": "Eine Notiz braucht Text, höchstens {max} Zeichen.",
  "notes.limitReached": "Dieser Charakter hat schon {max} Notizen. Erst ein paar löschen.",
  "notes.notFound": "Diese Notiz gibt es nicht mehr.",
  "notes.saveFailed": "Speichern hat nicht geklappt – bitte noch einmal.",
  "notes.loadFailed": "Die Notizen lassen sich gerade nicht laden.",
}
