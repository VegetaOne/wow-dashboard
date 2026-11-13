-- Notizen je Charakter (2026-11-13): kurze, abhakbare Merkzettel in der
-- Heldenakte. Nur eine neue Tabelle – nichts Bestehendes wird angefasst.
-- (`prisma migrate diff` schlägt zusätzlich vor, `UserPreference` und einen
-- Index an `User` neu anzulegen. Das ist alte Abweichung zwischen Schema und
-- Migrationen, unabhängig von dieser Änderung, und bleibt bewusst draussen.)

CREATE TABLE "CharacterNote" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "region"    TEXT NOT NULL,
    "charSlug"  TEXT NOT NULL,
    "text"      TEXT NOT NULL,
    "done"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CharacterNote_userId_region_charSlug_idx"
    ON "CharacterNote"("userId", "region", "charSlug");
