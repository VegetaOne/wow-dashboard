# WoW Dashboard – Setup-Modus

> Stand: 2026-09-16 · gebaut, noch nicht im laufenden Betrieb geprüft
> Vorüberlegungen und Einordnung: [Reihenfolge und Entscheide](./reihenfolge.md)

## Entscheide

| Thema | Entscheid |
| --- | --- |
| **Ablageort** | Datenbank, nicht `.env`. Übrig bleibt als Umgebungsvariable nur `DATABASE_URL`. |
| **Secret** | Verschlüsselt (AES-256-GCM), Schlüssel als `config.key` neben der Datenbank. |
| **Rechte** | Eine Instanz, ein Besitzer: wer den Setup abschliesst, darf danach als Einziger ändern. |
| **Migration** | Kein Rückfall auf die `.env`. Wer aktualisiert, durchläuft den Setup einmal. |

## Warum zwei Stufen

Der ursprüngliche Wunsch war: erst mit Battle.net anmelden, dann den Setup. Das geht
nicht — der Battle.net-Login braucht Client ID und Secret, die der Setup erst einsammelt.
Aufgelöst in zwei Stufen:

**Stufe 1, `/setup`, ohne Anmeldung.** Sprache, Region, Client ID, Secret. Zeigt die
exakte Redirect-URI zum Kopieren, aus der Adresse gebildet, unter der der Browser die
Seite gerade aufgerufen hat. Prüft die Zugangsdaten vor dem Speichern gegen den
Token-Endpunkt (Client-Credentials-Fluss). Schlägt die Prüfung nur wegen eines
Netzproblems fehl, lässt sich trotzdem fortfahren — ein Netzausfall sagt nichts über die
Daten. Erreichbar ausschliesslich, solange der Setup offen ist; danach 403 und Weiterleitung.

**Stufe 2, `/setup/schritt-2`, nach der Anmeldung.** Spielmodi, Startansicht,
Abrufintervall, optional Warcraft Logs. Wer hier ankommt, hat sich erfolgreich
angemeldet — der Beweis, dass Stufe 1 stimmt. Der Account wird als Besitzer festgehalten,
danach ist der Setup gesperrt.

**Schranke:** `src/app/dashboard/layout.tsx` leitet alles unter `/dashboard` auf den
Setup um, solange er offen ist. Die Prüfung steht dort und nicht in der Middleware: die
läuft in der Edge-Laufzeit, wo kein Datenbankzugriff möglich ist.

## Kein Neustart nötig

Der ursprüngliche Einwand — `.env`-Werte werden beim Start gelesen, also bräuchte es
einen Neustart — ist gelöst, ohne die Konfiguration pro Anfrage neu zu lesen:

- Alle laufzeitabhängigen Felder in `authOptions` sind **Getter**, keine festen Werte.
  Als Konstanten wären sie beim Laden des Moduls eingefroren.
- Dasselbe für die Namespaces in `GAME_MODES` und für `apiBase()` / `locale()`, die die
  in elf Dateien wiederholten Konstanten `REGION`, `API_BASE` und `LOCALE` ersetzen.
- Die Auth-Route lädt die Konfiguration vor jeder Anfrage, damit der Zwischenspeicher
  gefüllt ist, bevor NextAuth die Getter liest.
- `NEXTAUTH_URL` wird, wenn nicht gesetzt, aus der Anfrage abgeleitet. Nebeneffekt: die
  Instanz funktioniert über `localhost` und über die lokale IP, ohne Umkonfigurieren.

## Was das Secret schützt — und was nicht

Verschlüsselt liegt es in der Datenbank, der Schlüssel als Datei mit Rechten `600`
daneben. Damit ist die Datenbankdatei für sich geschützt: ein kopiertes Backup, ein
weitergegebenes Volume nützen ohne Schlüssel nichts. Wer Zugriff aufs Dateisystem hat,
hat beides. Das ist die Grenze des Verfahrens und wird auch so im README benannt.

Angezeigt wird das Secret nie. Das Einstellungsformular sendet es auch nicht zurück:
ein leeres Feld bedeutet „unverändert".

## Offen und ungeprüft

- **Der OAuth-Durchlauf selbst.** Ohne gültige Zugangsdaten nicht nachstellbar. Das
  grösste Risiko liegt bei `NEXTAUTH_URL`: falls die Ableitung aus der Anfrage nicht
  greift, hilft ein gesetztes `NEXTAUTH_URL` in `docker-compose.yml`.
- **Sprache betrifft bisher nur die API-Locale**, nicht die Oberfläche. Der
  Sprachumschalter für die Oberfläche bleibt eigene Arbeit.
- **Hauptcharakter** ist noch nicht im Setup — `UserPreference` führt die Felder bereits.
- **Region umstellen** lässt alte Snapshots liegen; sie zeigen dann Charaktere der alten
  Region. Noch kein Aufräumen dafür.
- Eine Datei liess sich nicht schreiben, weil sie zu tief im Verzeichnisbaum liegt:
  `src/app/api/wow/character/[realm]/[name]/equipment/route.ts`. Dort ist `authOptions`
  von Hand auf `await getAuthOptions()` umzustellen.

## Dateien

| Datei | Zweck |
| --- | --- |
| `prisma/migrations/0006_app_config/` | Tabelle `AppConfig`, eine Zeile |
| `src/lib/secrets.ts` | Verschlüsselung, Schlüsseldatei, Sitzungsschlüssel |
| `src/lib/config-cache.ts` | Zwischenspeicher und reine Daten — ohne Prisma, damit nichts davon im Browser-Bündel landet |
| `src/lib/config.ts` | Lesen und Schreiben, Besitzerprüfung |
| `src/lib/runtime.ts` | `region()`, `locale()`, `apiBase()`, `oauthBase()` |
| `src/app/setup/` | Stufe 1 und 2 |
| `src/app/api/setup/` | Speichern, Prüfen, Abschliessen |
| `src/app/dashboard/einstellungen/` | Einstellungsseite |
| `src/app/api/settings/` | Änderungen, nur für den Besitzer |
| `src/app/dashboard/layout.tsx` | Schranke vor dem Dashboard |

## Geprüft

Die Verschlüsselung mit 14 Fällen: Rückweg, zwei Verschlüsselungen desselben Werts
unterscheiden sich, manipuliertes Chiffrat wird abgelehnt, Schlüsseldatei landet neben
der Datenbank mit Rechten 600, Maske gibt nichts preis. Alle grün. `next build`
kompiliert und typprüft durch.

**Nicht geprüft:** der Setup mit echten Zugangsdaten und der Login danach.
