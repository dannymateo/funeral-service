/*
  Warnings:

  - Added the required column `endPointRtsp` to the `AuthCamera` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthCamera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "rtspPort" TEXT NOT NULL,
    "endPointRtsp" TEXT NOT NULL,
    "httpPort" TEXT NOT NULL,
    "endPointImagePreview" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);
INSERT INTO "new_AuthCamera" ("createdAt", "httpPort", "id", "ipAddress", "password", "rtspPort", "updatedAt", "userName") SELECT "createdAt", "httpPort", "id", "ipAddress", "password", "rtspPort", "updatedAt", "userName" FROM "AuthCamera";
DROP TABLE "AuthCamera";
ALTER TABLE "new_AuthCamera" RENAME TO "AuthCamera";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
