CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleTag" TEXT NOT NULL UNIQUE,
    "region" TEXT NOT NULL DEFAULT 'eu',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "realmSlug" TEXT NOT NULL,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    UNIQUE("userId", "characterName", "realmSlug")
);

CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "mainChar" TEXT,
    "mainRealm" TEXT,
    "region" TEXT NOT NULL DEFAULT 'eu',
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);
