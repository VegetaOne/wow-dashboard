-- Zwischenspeicher für Profil-API-Antworten, ein Stand pro Tag.
-- Der Tag im Unique-Key erzeugt die Historie ohne Aufräum-Job.
CREATE TABLE "CharacterSnapshot" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "gameMode"  TEXT NOT NULL,
    "realmSlug" TEXT NOT NULL,
    "charName"  TEXT NOT NULL,
    "dataset"   TEXT NOT NULL,
    "day"       TEXT NOT NULL,
    "payload"   TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "CharacterSnapshot_unique_day"
    ON "CharacterSnapshot"("gameMode", "realmSlug", "charName", "dataset", "day");
CREATE INDEX "CharacterSnapshot_lookup_idx"
    ON "CharacterSnapshot"("gameMode", "realmSlug", "charName", "dataset");
CREATE INDEX "CharacterSnapshot_dataset_day_idx"
    ON "CharacterSnapshot"("dataset", "day");
