# WoW Dashboard — Konzeptdokumentation

Self-hosted Dashboard für den eigenen World-of-Warcraft-Account: alle Charaktere,
Ausrüstung, verfügbare Upgrades, Fortschritt, Berufe, Sammlungen und Wochenaufgaben.
Mehrbenutzerfähig über Battle.net OAuth, später erweiterbar auf **WoW Forever**.

Betrieb, Features und Grenzen der API stehen im [README](../README.md) des Projekts.
Arbeitsregeln für Claude Code in [CLAUDE.md](../CLAUDE.md). Hier liegt das Warum:
Entscheide, Reihenfolge, offene Fragen.

| Datei | Inhalt |
| --- | --- |
| [stand.md](./stand.md) | Rahmenbedingungen, was steht, gelernte Fallen, Haltung bei Datenlücken, Sicherheit |
| [roadmap.md](./roadmap.md) | Was die APIs hergeben und was nicht, Architekturentscheide, Phasen 0–6 |
| [reihenfolge.md](./reihenfolge.md) | **Verbindliche Reihenfolge**, gefallene Entscheide, Talentbuilds, Auktionshaus, Korrekturen aus dem Code |
| [i18n.md](./i18n.md) | Sprachumschalter: Aufbau, Regeln, Restliste |
| [setup-modus.md](./setup-modus.md) | Zweistufiger Setup, Konfiguration in der Datenbank, Verschlüsselung |
| [wochenuebersicht.md](./wochenuebersicht.md) | Reset-Tracker, Lockout-Längen in Classic Era |
| [auftraege/i18n-abschluss.md](./auftraege/i18n-abschluss.md) | **Nächster Auftrag**: Sprachumschalter fertigstellen, mit Schlüsseltabellen und Abnahme |

## Stand auf einen Blick

**Fertig:** Charakterübersicht · Ausrüstung mit Paperdoll und Tooltips · Upgrades und
Loot-Kandidaten · Berufe · Fortschritt (Raids, Dungeons, Mythisch+) · Sammlungen ·
Erfolge · Ansehen · PvP · Gilde · Auktionshaus-Preisindex und Berufs-Wirtschaft · Verlauf.

**Gebaut, aber nicht mit echten Daten geprüft:** Wochenübersicht, Setup-Modus.

**In Arbeit:** Sprachumschalter, etwa zur Hälfte — Aufbau in [i18n.md](./i18n.md),
die Restarbeit als Auftrag in [auftraege/i18n-abschluss.md](./auftraege/i18n-abschluss.md).

**Als Nächstes:** Sprachumschalter fertig → Talentbuilds → Hintergrund-Auffrischer →
Setup-Modus abschliessen → Warcraft Logs → WoW Forever.

**Zurückgestellt:** Charaktervergleich — mögliche Erweiterung später, siehe
[reihenfolge.md](./reihenfolge.md).

## Entscheide, die noch offen sind

- **Hintergrund-Auffrischer** — braucht verschlüsselt persistierte Refresh-Tokens
- **Warcraft Logs** — eigene App-Registrierung bei warcraftlogs.com nötig
- **Talentbuilds** — liefert die Classic-Spieldaten-API überhaupt Talentbäume?
- **Battle.net Client Secret** — einmal offengelegt, muss neu generiert werden
- **`src/lib/adapters/`** — löschen oder auf den aktuellen Modusbegriff ziehen

## Verhältnis zum Obsidian-Vault

Dieser Ordner ist die **Quelle**. Im Vault liegt unter
`10_Projekte/Gaming/WorldOfWarcraft/WoW Dashboard/` ein **Spiegel** zum Lesen und
Verlinken — mit Frontmatter und Wikilinks, inhaltlich identisch.

Änderungen gehören hierher, nicht in den Vault. Danach den Spiegel nachziehen:

```bash
node tools/mirror-vault.mjs "F:/Obsidian/Obsidian"
```

Das Skript schreibt ausschliesslich in den Projektordner des Vaults und überschreibt
die dortigen Notizen. Wer im Vault etwas ändert, verliert es beim nächsten Lauf.
