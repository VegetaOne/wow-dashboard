-- Vorberechnete Loot-Tabellen aus der Journal-API
CREATE TABLE "LootItem" (
    "id"            TEXT NOT NULL PRIMARY KEY,
    "gameMode"      TEXT NOT NULL,
    "itemId"        INTEGER NOT NULL,
    "name"          TEXT NOT NULL,
    "inventoryType" TEXT NOT NULL,
    "itemLevel"     INTEGER,
    "quality"       TEXT,
    "instanceName"  TEXT NOT NULL,
    "encounterName" TEXT NOT NULL
);

CREATE UNIQUE INDEX "LootItem_gameMode_itemId_encounterName_key"
    ON "LootItem"("gameMode", "itemId", "encounterName");
CREATE INDEX "LootItem_gameMode_inventoryType_idx"
    ON "LootItem"("gameMode", "inventoryType");

-- Fortschritt des Index-Durchlaufs
CREATE TABLE "LootIndexRun" (
    "id"               TEXT NOT NULL PRIMARY KEY,
    "gameMode"         TEXT NOT NULL,
    "status"           TEXT NOT NULL DEFAULT 'PENDING',
    "totalInstances"   INTEGER NOT NULL DEFAULT 0,
    "indexedInstances" INTEGER NOT NULL DEFAULT 0,
    "itemCount"        INTEGER NOT NULL DEFAULT 0,
    "pendingInstanceIds"  TEXT NOT NULL DEFAULT '[]',
    "error"            TEXT,
    "startedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        DATETIME NOT NULL
);

CREATE UNIQUE INDEX "LootIndexRun_gameMode_key" ON "LootIndexRun"("gameMode");
