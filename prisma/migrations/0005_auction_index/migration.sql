-- Verdichteter Preisstand je Auktionshaus.
-- Preise in Kupfer, damit sie ganze Zahlen bleiben.
CREATE TABLE "AuctionPrice" (
    "id"               TEXT NOT NULL PRIMARY KEY,
    "gameMode"         TEXT NOT NULL,
    "connectedRealmId" INTEGER NOT NULL,
    "houseId"          INTEGER NOT NULL,
    "itemId"           INTEGER NOT NULL,
    "minUnitPrice"     INTEGER NOT NULL,
    "quantity"         INTEGER NOT NULL,
    "listings"         INTEGER NOT NULL,
    "fetchedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "AuctionPrice_gameMode_connectedRealmId_houseId_itemId_key"
    ON "AuctionPrice"("gameMode", "connectedRealmId", "houseId", "itemId");
CREATE INDEX "AuctionPrice_gameMode_connectedRealmId_houseId_idx"
    ON "AuctionPrice"("gameMode", "connectedRealmId", "houseId");

-- Stand des letzten Durchlaufs je Haus
CREATE TABLE "AuctionRun" (
    "id"               TEXT NOT NULL PRIMARY KEY,
    "gameMode"         TEXT NOT NULL,
    "connectedRealmId" INTEGER NOT NULL,
    "houseId"          INTEGER NOT NULL,
    "houseName"        TEXT,
    "status"           TEXT NOT NULL DEFAULT 'PENDING',
    "auctionCount"     INTEGER NOT NULL DEFAULT 0,
    "itemCount"        INTEGER NOT NULL DEFAULT 0,
    "skippedCount"     INTEGER NOT NULL DEFAULT 0,
    "error"            TEXT,
    "startedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AuctionRun_gameMode_connectedRealmId_houseId_key"
    ON "AuctionRun"("gameMode", "connectedRealmId", "houseId");
