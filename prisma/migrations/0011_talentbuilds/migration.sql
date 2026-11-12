-- Talentplaner (2026-11-12): gespeicherte Builds je Klasse und, je
-- Charakter und Talentverteilung (Dualspec), der Build, der gerade das Ziel
-- ist. Nur neue Tabellen – nichts Bestehendes wird angefasst.

CREATE TABLE "TalentBuild" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "userId"    TEXT NOT NULL,
    "region"    TEXT NOT NULL,
    "classId"   INTEGER NOT NULL,
    "name"      TEXT NOT NULL,
    "ranks"     TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TalentBuild_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "TalentBuild_userId_region_classId_idx"
    ON "TalentBuild"("userId", "region", "classId");

CREATE TABLE "TalentTarget" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    "region"      TEXT NOT NULL,
    "charSlug"    TEXT NOT NULL,
    "talentGroup" INTEGER NOT NULL,
    "buildId"     TEXT NOT NULL,
    CONSTRAINT "TalentTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TalentTarget_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "TalentBuild" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TalentTarget_userId_region_charSlug_talentGroup_key"
    ON "TalentTarget"("userId", "region", "charSlug", "talentGroup");
