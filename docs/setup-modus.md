# WoW Dashboard – Setup-Modus

> Stand: 2026-11-11 · Durchlauf im Container geprüft; Einrichtungscode neu, noch nicht
> mit echten Daten geprüft
> Vorüberlegungen und Einordnung: [Reihenfolge und Entscheide](./reihenfolge.md)

## Entscheide

| Thema | Entscheid |
| --- | --- |
| **Ablageort** | Datenbank, nicht `.env`. Übrig bleibt als Umgebungsvariable nur `DATABASE_URL`. |
| **Secret** | Verschlüsselt (AES-256-GCM), Schlüssel als `config.key` neben der Datenbank. |
| **Rechte** | Eine Instanz, ein Besitzer: wer den Setup abschliesst, darf danach als Einziger ändern. |
| **Migration** | Kein Rückfall auf die `.env`. Wer aktualisiert, durchläuft den Setup einmal. |
| **Absicherung** | Einrichtungscode im Log des Containers (2026-11-11), siehe unten. |

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

**Stufe 2, `/setup/schritt-2`, nach der Anmeldung.** Abrufintervall, optional
Warcraft Logs. Wer hier ankommt, hat sich erfolgreich
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

## Schlüssel erneuern (seit 2026-11-11)

`prisma/config.key` und `dev.log` lagen bis 2026-11-11 im öffentlichen Repo – eingecheckt,
bevor `.gitignore` sie nannte. Seitdem sind sie aus der Versionsverwaltung genommen; in
älteren Commits stehen sie weiter. Die alte Schlüsseldatei passt nur zu einer
Datenbank, die mit ihr verschlüsselt wurde, und Datenbanken lagen nie im Repo. Trotzdem
gilt sie als offengelegt.

**Erneuern mit `node tools/rotate-key.mjs`** (bei gestoppter App, nach einem Backup von
Datenbank und Schlüssel). Das Skript entschlüsselt die Secrets mit dem alten Schlüssel,
verschlüsselt sie mit einem neuen und tauscht die Datei erst aus, wenn die Datenbank
geschrieben ist. Kann ein Secret nicht entschlüsselt werden, bricht es ab, bevor etwas
geschrieben wird.

Einfach die Schlüsseldatei zu löschen geht **nicht**: die App erzeugt dann einen neuen
Schlüssel, liest das gespeicherte Secret nicht mehr, und weil der Setup nach dem
Abschluss gesperrt ist, kommt man nicht mehr an die Einstellungen.

**Betroffen ist nur die Entwicklungsinstanz** (`npm run dev`, Schlüssel unter `prisma/`).
Der Docker-Container erzeugt seinen Schlüssel im Volume unter `/data`; `.dockerignore`
hält `*.key` aus dem Image. Der Container braucht keinen Tausch.

Getestet ist das Format gegen einen Vektor aus `secrets.ts` (`npm test`) und der Ablauf
mit einer nachgebildeten Datenbank. Gegen eine echte SQLite-Datei ist das Skript noch
nicht gelaufen.

## Behoben: Endlosschleife nach dem Speichern (2026-11-11)

Erster echter Durchlauf: Zugangsdaten eingeben, prüfen, speichern – und die App führte
immer wieder zurück zum Setup. Ursache: Next.js bündelt `config-cache.ts` in **jede**
Seite und jede API-Route einzeln, eine Modulvariable gab es also einmal pro Bündel. Der
Setup speicherte über `/api/setup` und aktualisierte nur dessen Kopie; `/setup/schritt-2`
und die Auth-Route lasen weiter ihren alten Stand ohne Zugangsdaten. Der Zwischenspeicher
hängt jetzt an `globalThis` und gilt damit einmal pro Prozess. Dasselbe für den
Prisma-Client und den gelernten Static-Namespace.

**Die eigentliche Ursache lag noch eine Ebene tiefer:** `next build` hielt `/`, `/login`,
`/setup` und `/setup/schritt-2` für statisch und rechnete sie vor – ohne Datenbank, also
ohne Zugangsdaten. Im Image stand damit fest `redirect("/setup")`, und die Setup-Seite
zeigte immer leere Felder. Das Root-Layout erzwingt jetzt `dynamic = "force-dynamic"`;
der Build zeigt alle Seiten als `ƒ`, keine als `○`. Im Entwicklungsmodus (`npm run dev`)
rechnet Next nichts vor – darum fiel es dort nie auf.

**Falle für später:** Zustand auf Modulebene ist in diesem Projekt nie geteilt. Wer etwas
zwischen Seiten und Routen teilen will, legt es an `globalThis` (mit `Symbol.for`) oder
liest es aus der Datenbank.

## Einrichtungscode (seit 2026-11-11)

Stufe 1 ist ohne Anmeldung erreichbar. Ohne weiteren Schutz konnte jeder im Heimnetz,
der die Seite vor dem Besitzer öffnet, eigene Zugangsdaten eintragen und sich in Stufe 2
zum Besitzer machen.

- Beim Start schreibt der Container, solange der Setup offen ist, einen Code ins Log:
  `docker compose logs app | grep setup` → `[setup] Einrichtungscode: ABCD-EFGH`.
  Acht Zeichen ohne verwechselbare (0/O, 1/I/L), Gross-/Kleinschreibung und Bindestrich
  egal.
- **Stufe 1** (`/api/setup`) und die **Prüfung** (`/api/setup/verify`) verlangen ihn. Die
  Prüfung auch, weil die Instanz sonst für jeden im Netz fremde Zugangsdaten testete.
- **Stufe 2** (`/api/setup/complete`) verlangt den Nachweis daraus: Stufe 1 setzt nach
  richtigem Code ein `httpOnly`-Cookie mit dem SHA-256-Hash des Codes. Nur wer es trägt,
  wird Besitzer. Danach wird der Code verworfen.
- Der Code lebt im Speicher des Prozesses (an `globalThis`) und **gilt bis zum Neustart**.
  Startet der Container zwischen Stufe 1 und 2 neu, meldet Stufe 2 das und schickt
  zurück zu Stufe 1.
- **Bewusste Ausnahme** von „nichts Geheimes ins Log": der Code ist einmalig, nach dem
  Setup wertlos, und das Log ist genau der Ort, an den nur kommt, wer die Maschine hat.

Erzeugt wird er in `src/instrumentation.ts` → `src/lib/startup.ts`, und zur Sicherheit
noch einmal, wenn jemand `/setup` öffnet und es noch keinen gibt.

## Hintergrund-Auffrischung – verworfen (2026-11-11)

Kurz gebaut, dann auf Wunsch entfernt: der Companion läuft, während gespielt wird, und
ohne Spielen ändert sich an den Profilen nichts. Festgehalten, was dabei herauskam:

- **Battle.net stellt keine Refresh-Tokens aus.** Ein Nutzertoken lebt 24 Stunden. Ein
  gespeichertes Token taugt für Arbeit ohne Nutzer darum nicht; es bliebe nur ein
  App-Token (Client-Credentials). Ob Forever Charakterdaten an ein App-Token herausgibt,
  wurde nie geprüft.
- Die Charakterliste (`/profile/user/wow`) gibt es nur mit Nutzertoken.
- Der Code steht in der Git-Historie (PR #7), die Tabelle `RefreshRun` ist mit
  `0010_auffrischer_entfernen` gelöscht.

**Falle, gilt weiter für den Einrichtungscode:** `src/instrumentation.ts` wird auch fürs Edge-Bündel übersetzt. Der Import der
Node-Module muss in genau der Form `if (process.env.NEXT_RUNTIME === "nodejs") { await
import(…) }` stehen; mit einem frühen `return` davor bricht der Bau an `crypto`.

**Nebenbefund:** `refreshBattleNetToken` in `src/lib/auth.ts` versucht einen
Refresh-Token-Fluss, den Battle.net nicht anbietet. Nach 24 Stunden endet die Sitzung
also mit `RefreshAccessTokenError`, und man meldet sich neu an. Nicht angefasst.

## Offen und ungeprüft

- ~~**Der OAuth-Durchlauf selbst.**~~ **Geprüft 2026-11-11** im Docker-Container über
  `localhost`: Setup Stufe 1 und 2, Anmeldung mit Battle.net, danach die Charakterliste.
  Die Ableitung von `NEXTAUTH_URL` aus der Anfrage greift. Über die lokale IP aus dem
  Heimnetz ist es noch nicht geprüft.
- **Hauptcharakter** ist noch nicht im Setup — `UserPreference` führt die Felder bereits.
- **Region umstellen** lässt alte Snapshots liegen. Sie sind nach Region getrennt und
  erscheinen erst wieder, wenn zurückgestellt wird; die Einstellungsseite sagt das. Kein
  Aufräumen dafür.
- **Der Einrichtungscode** ist ohne echte Zugangsdaten gebaut; geprüft sind Typen, Bau
  und die Ablehnung falscher Codes an der laufenden App.

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
| `src/lib/setup-code.ts` | Einrichtungscode und Nachweis für Stufe 2 |
| `src/instrumentation.ts`, `src/lib/startup.ts` | Was beim Start passiert |
| `prisma/migrations/0009_auffrischer/`, `0010_auffrischer_entfernen/` | Tabelle `RefreshRun`, angelegt und wieder gelöscht |

## Geprüft

Die Verschlüsselung mit 14 Fällen: Rückweg, zwei Verschlüsselungen desselben Werts
unterscheiden sich, manipuliertes Chiffrat wird abgelehnt, Schlüsseldatei landet neben
der Datenbank mit Rechten 600, Maske gibt nichts preis. Alle grün. `next build`
kompiliert und typprüft durch.

**Nicht geprüft:** der Setup mit echten Zugangsdaten und der Login danach.
