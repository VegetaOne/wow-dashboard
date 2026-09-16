/**
 * Wörterbuch: Anmeldung, Einrichtung, Einstellungen und Account-Seite.
 *
 * Englisch definiert die Schlüssel, Deutsch muss sie vollständig bedienen –
 * das erzwingt der Typ unten. Platzhalter stehen in geschweiften Klammern.
 */

export const en = {
  "login.eyebrow": "Sign in",
  "login.heading": "Connect account",
  "login.intro":
    "Sign in with your Battle.net account to see your characters, gear and open to-dos.",
  "login.failed": "Sign-in failed",
  "login.errorCallback":
    "The Battle.net callback could not be processed. Please try again.",
  "login.errorUnknown": "An unexpected error occurred.",
  "login.access": "Access",
  "login.accessValue": "Read only",
  "login.scope": "Scope",
  "login.scopeValue": "Character profiles",
  "login.footer": "Private home-network tool",
  "login.button": "Sign in with Battle.net",
  "login.connecting": "Connecting…",

  // ─── Einrichtung ─────────────────────────────────────────────────────────
  "setup.eyebrow": "Setup",
  "setup.firstStart": "First start",
  "setup.heading": "Setup",
  "setup.intro":
    "These values replace the configuration file: they go into the database and can be changed at any time. No container restart needed.",
  "setup.almostDone": "Almost done",
  "setup.signedInAs": "Signed in as {battleTag}",
  "setup.step2Intro":
    "Sign-in worked, so your credentials are correct. Now: what you want to see.",

  // ─── Zeit ────────────────────────────────────────────────────────────────
  "setup.step": "Step {current} of {total}",
  "setup.language": "Language",
  "setup.languageHint":
    "Also determines the language Blizzard sends item and instance names in. The interface follows the same setting.",
  "setup.region": "Region",
  "setup.regionHint":
    "The region of your account. It governs both the sign-in and every API address.",
  "setup.bnetApp": "Battle.net application",
  "setup.bnetAppHintBefore": "Create a client at",
  "setup.bnetAppHintAfter":
    "and enter this redirect URI there — exactly like this:",
  "setup.redirectHint":
    "If you want to reach the app from another device on your home network later, add the same address with the local IP there as well. Battle.net allows several redirect URIs per client.",
  "setup.clientId": "Client ID",
  "setup.clientSecret": "Client secret",
  "setup.secretHint": "Stored encrypted and never shown again.",
  "setup.verifyHeading": "Verify and sign in",
  "setup.verifying": "Verifying…",
  "setup.verify": "Verify credentials",
  "setup.saving": "Saving…",
  "setup.saveAnyway": "Save and sign in anyway",
  "setup.saveAndSignIn": "Save and sign in",
  "setup.verifyOk": "Battle.net accepts the credentials.",
  "setup.verifyFailed": "Verification failed.",
  "setup.verifyUnavailable": "The check could not be carried out.",
  "setup.saveFailed": "Saving failed.",

  // ─── Einrichtung, Stufe 2 ────────────────────────────────────────────────
  "setup2.modesHeading": "Which game modes interest you?",
  "setup2.modesHint":
    "Modes you leave out disappear from the tabs. This can be changed at any time.",
  "setup2.startHeading": "Which one should the roster start with?",
  "setup2.pickModeFirst": "Pick at least one mode first.",
  "setup2.pollHeading": "How often should the roster catch up?",
  "setup2.pollHint":
    "More often than every few minutes demonstrably gains nothing: Blizzard's profile API only updates once the character logs out.",
  "setup2.seconds": "Seconds",
  "setup2.wclHeading": "Warcraft Logs",
  "setup2.wclHint":
    "Optional and skippable. Needs its own application at warcraftlogs.com. The part of the app that uses it is not built yet — you can safely leave these fields empty.",
  "setup2.wclClientId": "Client ID (optional)",
  "setup2.wclClientSecret": "Client secret (optional)",
  "setup2.finish": "Finish setup",
  "setup2.finishHint":
    "After this the setup is locked; changes go through the settings.",

  // ─── Einstellungen ───────────────────────────────────────────────────────
  "settings.instance": "Instance",
  "settings.heading": "Settings",
  "settings.intro":
    "These values live in the database, not in a file. Changes take effect at once — no container restart needed.",
  "settings.owner": "Owner of this instance: {owner}.",
  "settings.noPermission": "No permission",
  "settings.notOwner":
    "This instance belongs to {owner}. Only that account can change the settings.",
  "settings.anotherAccount": "another account",
  "settings.languageHint":
    "Sets the language of the interface and of the names coming from Blizzard.",
  "settings.regionHint":
    "Changing it switches every API address and the sign-in. Stored snapshots stay, but show characters of the old region.",
  "settings.bnetCredentials": "Battle.net credentials",
  "settings.secretSet": "(set)",
  "settings.secretMissing": "(missing)",
  "settings.leaveEmpty": "Leave empty to keep it unchanged",
  "settings.enterSecret": "Enter secret",
  "settings.secretNeverReturned":
    "Stored secrets are never sent back and never displayed.",
  "settings.gameModes": "Game modes",
  "settings.startView": "Start view",
  "settings.pollInterval": "Fetch interval",
  "settings.wclHint": "Optional. The part of the app that uses it is not built yet.",
  "settings.save": "Save",
  "settings.saved": "Saved.",

  // ─── Account-Sammlungen ──────────────────────────────────────────────────
  "account.eyebrow": "Account",
  "account.heading": "Collections",
  "account.intro":
    "Mounts and battle pets belong to the whole account, not to a single character.",
  "account.unavailable": "Collections not available",
  "account.unavailableText":
    "Neither endpoint answered, and no earlier state is on file.",
} as const

export const de: Record<keyof typeof en, string> = {

  "login.eyebrow": "Anmeldung",
  "login.heading": "Account verbinden",
  "login.intro":
    "Melde dich mit deinem Battle.net-Account an, um deine Charaktere, Ausrüstung und offenen To-Dos zu sehen.",
  "login.failed": "Anmeldung fehlgeschlagen",
  "login.errorCallback":
    "Der Battle.net-Rückruf konnte nicht verarbeitet werden. Bitte erneut versuchen.",
  "login.errorUnknown": "Ein unerwarteter Fehler ist aufgetreten.",
  "login.access": "Zugriff",
  "login.accessValue": "Nur lesend",
  "login.scope": "Umfang",
  "login.scopeValue": "Charakterprofile",
  "login.footer": "Privates Heimnetz-Werkzeug",
  "login.button": "Mit Battle.net anmelden",
  "login.connecting": "Verbinde…",

  "setup.eyebrow": "Einrichtung",
  "setup.firstStart": "Erster Start",
  "setup.heading": "Einrichtung",
  "setup.intro":
    "Diese Angaben ersetzen die Konfigurationsdatei: sie landen in der Datenbank und lassen sich später jederzeit ändern. Ein Neustart des Containers ist dafür nicht nötig.",
  "setup.almostDone": "Fast fertig",
  "setup.signedInAs": "Angemeldet als {battleTag}",
  "setup.step2Intro":
    "Die Anmeldung hat funktioniert – deine Zugangsdaten stimmen also. Jetzt noch, was du sehen willst.",
  "setup.step": "Schritt {current} von {total}",
  "setup.language": "Sprache",
  "setup.languageHint":
    "Bestimmt zugleich, in welcher Sprache die Namen von Gegenständen und Instanzen von Blizzard kommen. Die Oberfläche folgt derselben Einstellung.",
  "setup.region": "Region",
  "setup.regionHint":
    "Die Region deines Accounts. Sie bestimmt sowohl den Login als auch alle API-Adressen.",
  "setup.bnetApp": "Battle.net-Anwendung",
  "setup.bnetAppHintBefore": "Lege unter",
  "setup.bnetAppHintAfter":
    "einen Client an und trage dort diese Redirect-URI ein – exakt so:",
  "setup.redirectHint":
    "Willst du die App später von einem anderen Gerät im Heimnetz erreichen, trage dort zusätzlich dieselbe Adresse mit der lokalen IP ein. Battle.net erlaubt mehrere Redirect-URIs je Client.",
  "setup.clientId": "Client ID",
  "setup.clientSecret": "Client Secret",
  "setup.secretHint": "Wird verschlüsselt gespeichert und danach nie wieder angezeigt.",
  "setup.verifyHeading": "Prüfen und anmelden",
  "setup.verifying": "Prüfe…",
  "setup.verify": "Zugangsdaten prüfen",
  "setup.saving": "Speichere…",
  "setup.saveAnyway": "Trotzdem speichern und anmelden",
  "setup.saveAndSignIn": "Speichern und anmelden",
  "setup.verifyOk": "Battle.net akzeptiert die Zugangsdaten.",
  "setup.verifyFailed": "Die Prüfung ist fehlgeschlagen.",
  "setup.verifyUnavailable": "Die Prüfung konnte nicht durchgeführt werden.",
  "setup.saveFailed": "Speichern fehlgeschlagen.",

  "setup2.modesHeading": "Welche Spielmodi interessieren dich?",
  "setup2.modesHint":
    "Nicht gewählte Modi verschwinden aus den Tabs. Das lässt sich jederzeit ändern.",
  "setup2.startHeading": "Womit soll die Kaderliste starten?",
  "setup2.pickModeFirst": "Wähle zuerst mindestens einen Modus.",
  "setup2.pollHeading": "Wie oft soll die Kaderliste nachziehen?",
  "setup2.pollHint":
    "Häufiger als ein paar Minuten bringt nachweislich nichts: die Profil-API von Blizzard aktualisiert erst, wenn der Charakter ausloggt.",
  "setup2.seconds": "Sekunden",
  "setup2.wclHeading": "Warcraft Logs",
  "setup2.wclHint":
    "Optional und überspringbar. Braucht eine eigene Anwendung bei warcraftlogs.com. Der Teil der App, der das nutzt, ist noch nicht gebaut – du kannst die Felder also getrost leer lassen.",
  "setup2.wclClientId": "Client ID (optional)",
  "setup2.wclClientSecret": "Client Secret (optional)",
  "setup2.finish": "Einrichtung abschliessen",
  "setup2.finishHint":
    "Danach ist der Setup gesperrt; Änderungen laufen über die Einstellungen.",
  "settings.instance": "Instanz",
  "settings.heading": "Einstellungen",
  "settings.intro":
    "Diese Werte liegen in der Datenbank, nicht in einer Datei. Änderungen greifen sofort – ein Neustart des Containers ist nicht nötig.",
  "settings.owner": "Besitzer dieser Instanz: {owner}.",
  "settings.noPermission": "Keine Berechtigung",
  "settings.notOwner":
    "Diese Instanz gehört {owner}. Nur dieser Account kann die Einstellungen ändern.",
  "settings.anotherAccount": "einem anderen Account",
  "settings.languageHint":
    "Bestimmt die Sprache der Oberfläche und der Namen, die von Blizzard kommen.",
  "settings.regionHint":
    "Eine Umstellung ändert alle API-Adressen und den Login. Bereits gespeicherte Stände bleiben liegen, zeigen aber Charaktere der alten Region.",
  "settings.bnetCredentials": "Battle.net-Zugangsdaten",
  "settings.secretSet": "(gesetzt)",
  "settings.secretMissing": "(fehlt)",
  "settings.leaveEmpty": "Leer lassen, um es unverändert zu lassen",
  "settings.enterSecret": "Secret eintragen",
  "settings.secretNeverReturned":
    "Gespeicherte Secrets werden nie zurückgesendet und nie angezeigt.",
  "settings.gameModes": "Spielmodi",
  "settings.startView": "Startansicht",
  "settings.pollInterval": "Abrufintervall",
  "settings.wclHint": "Optional. Der Teil der App, der das nutzt, ist noch nicht gebaut.",
  "settings.save": "Speichern",
  "settings.saved": "Gespeichert.",

  "account.eyebrow": "Account",
  "account.heading": "Sammlungen",
  "account.intro":
    "Reittiere und Begleiter gelten für den ganzen Account, nicht für einen einzelnen Charakter.",
  "account.unavailable": "Sammlungen nicht abrufbar",
  "account.unavailableText":
    "Beide Endpunkte haben nicht geantwortet, und es liegt kein früherer Stand vor.",
}
