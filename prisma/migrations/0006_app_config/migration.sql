-- Konfiguration der Instanz, eine einzige Zeile.
-- Ersetzt die Werte, die bisher in der .env standen.
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "language" TEXT NOT NULL DEFAULT 'en',
    "region" TEXT NOT NULL DEFAULT 'eu',
    "bnetClientId" TEXT,
    "bnetClientSecret" TEXT,
    "authSecret" TEXT,
    "gameModes" TEXT NOT NULL DEFAULT '["retail","classic","classic-era"]',
    "defaultMode" TEXT NOT NULL DEFAULT 'retail',
    "pollSeconds" INTEGER NOT NULL DEFAULT 60,
    "warcraftLogsClientId" TEXT,
    "warcraftLogsSecret" TEXT,
    "ownerBattleTag" TEXT,
    "setupCompletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
