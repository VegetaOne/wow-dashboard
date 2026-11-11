-- Umstellung auf WoW Forever (Entscheid 2026-11-11, siehe docs/reihenfolge.md).
--
-- Retail, Classic und Classic Era sind aus der App entfernt. Alle Daten, die
-- nach Spielmodus und Realm getrennt lagen, werden darum GELÖSCHT, nicht
-- umgeschrieben: Snapshots, Favoriten, Loot-Index und Auktionspreise der alten
-- Modi haben in Forever keine Entsprechung (andere Charaktere, kein Realm).
--
-- Das ist nicht rückgängig zu machen. Vor dem Einspielen die Datenbankdatei
-- UND prisma/config.key sichern – beides gehört zusammen.
--
-- SQLite kann Schlüssel nicht ändern; die Tabellen werden neu angelegt.

PRAGMA foreign_keys=OFF;

-- ─── Snapshots: Region + Charakter-Slug statt Modus + Realm + Name ─────────
DROP TABLE "CharacterSnapshot";

CREATE TABLE "CharacterSnapshot" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "region"    TEXT NOT NULL,
    "charSlug"  TEXT NOT NULL,
    "dataset"   TEXT NOT NULL,
    "day"       TEXT NOT NULL,
    "payload"   TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "CharacterSnapshot_region_charSlug_dataset_day_key"
    ON "CharacterSnapshot"("region", "charSlug", "dataset", "day");
CREATE INDEX "CharacterSnapshot_region_charSlug_dataset_idx"
    ON "CharacterSnapshot"("region", "charSlug", "dataset");
CREATE INDEX "CharacterSnapshot_dataset_day_idx"
    ON "CharacterSnapshot"("dataset", "day");

-- ─── Favoriten ─────────────────────────────────────────────────────────────
DROP TABLE "Favorite";

CREATE TABLE "Favorite" (
    "id"       TEXT NOT NULL PRIMARY KEY,
    "userId"   TEXT NOT NULL,
    "region"   TEXT NOT NULL,
    "charSlug" TEXT NOT NULL,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Favorite_userId_region_charSlug_key"
    ON "Favorite"("userId", "region", "charSlug");

-- ─── Loot-Index: je Region statt je Modus ──────────────────────────────────
DROP TABLE "LootItem";

CREATE TABLE "LootItem" (
    "id"            TEXT NOT NULL PRIMARY KEY,
    "region"        TEXT NOT NULL,
    "itemId"        INTEGER NOT NULL,
    "name"          TEXT NOT NULL,
    "inventoryType" TEXT NOT NULL,
    "itemLevel"     INTEGER,
    "quality"       TEXT,
    "instanceName"  TEXT NOT NULL,
    "encounterName" TEXT NOT NULL
);

CREATE UNIQUE INDEX "LootItem_region_itemId_encounterName_key"
    ON "LootItem"("region", "itemId", "encounterName");
CREATE INDEX "LootItem_region_inventoryType_idx"
    ON "LootItem"("region", "inventoryType");

DROP TABLE "LootIndexRun";

CREATE TABLE "LootIndexRun" (
    "id"                 TEXT NOT NULL PRIMARY KEY,
    "region"             TEXT NOT NULL,
    "status"             TEXT NOT NULL DEFAULT 'PENDING',
    "totalInstances"     INTEGER NOT NULL DEFAULT 0,
    "indexedInstances"   INTEGER NOT NULL DEFAULT 0,
    "itemCount"          INTEGER NOT NULL DEFAULT 0,
    "pendingInstanceIds" TEXT NOT NULL DEFAULT '[]',
    "error"              TEXT,
    "startedAt"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          DATETIME NOT NULL
);

CREATE UNIQUE INDEX "LootIndexRun_region_key" ON "LootIndexRun"("region");

-- ─── Auktionshaus: Haus statt verbundener Realm ────────────────────────────
-- Forever führt Häuser je Ruleset, aber jedes Ruleset liefert dieselben
-- Häuser. Schlüssel ist darum Region + Haus.
DROP TABLE "AuctionPrice";

CREATE TABLE "AuctionPrice" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "region"       TEXT NOT NULL,
    "houseId"      INTEGER NOT NULL,
    "itemId"       INTEGER NOT NULL,
    "minUnitPrice" INTEGER NOT NULL,
    "quantity"     INTEGER NOT NULL,
    "listings"     INTEGER NOT NULL,
    "fetchedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "AuctionPrice_region_houseId_itemId_key"
    ON "AuctionPrice"("region", "houseId", "itemId");
CREATE INDEX "AuctionPrice_region_houseId_idx"
    ON "AuctionPrice"("region", "houseId");

DROP TABLE "AuctionRun";

CREATE TABLE "AuctionRun" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "region"       TEXT NOT NULL,
    "rulesetId"    INTEGER,
    "houseId"      INTEGER NOT NULL,
    "houseName"    TEXT,
    "status"       TEXT NOT NULL DEFAULT 'PENDING',
    "auctionCount" INTEGER NOT NULL DEFAULT 0,
    "itemCount"    INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "error"        TEXT,
    "startedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AuctionRun_region_houseId_key"
    ON "AuctionRun"("region", "houseId");

-- ─── Konfiguration: Spielmodus-Auswahl entfällt ────────────────────────────
ALTER TABLE "AppConfig" DROP COLUMN "gameModes";
ALTER TABLE "AppConfig" DROP COLUMN "defaultMode";

PRAGMA foreign_keys=ON;
