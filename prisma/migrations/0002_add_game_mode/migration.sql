-- Favorite: gameMode ergänzen, Unique-Index erweitern
-- SQLite kann Constraints nicht ändern -> Tabelle neu aufbauen
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "realmSlug" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT 'retail',
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

INSERT INTO "new_Favorite" ("id", "userId", "characterName", "realmSlug", "gameMode")
SELECT "id", "userId", "characterName", "realmSlug", 'retail' FROM "Favorite";

DROP TABLE "Favorite";
ALTER TABLE "new_Favorite" RENAME TO "Favorite";

CREATE UNIQUE INDEX "Favorite_userId_characterName_realmSlug_gameMode_key"
    ON "Favorite"("userId", "characterName", "realmSlug", "gameMode");

-- UserPreference: mainMode ergänzen
ALTER TABLE "UserPreference" ADD COLUMN "mainMode" TEXT;

PRAGMA foreign_keys=ON;
