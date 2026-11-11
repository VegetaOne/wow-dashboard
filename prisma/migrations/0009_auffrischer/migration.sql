-- Hintergrund-Auffrischung: Stand des letzten Laufs je Aufgabe.
CREATE TABLE "RefreshRun" (
    "job" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL,
    "finishedAt" DATETIME,
    "total" INTEGER NOT NULL DEFAULT 0,
    "refreshed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT
);
