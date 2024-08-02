/*
  Warnings:

  - You are about to alter the column `httpPort` on the `AuthCamera` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `rtspPort` on the `AuthCamera` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthCamera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "rtspPort" INTEGER NOT NULL,
    "endPointRtsp" TEXT NOT NULL,
    "httpPort" INTEGER NOT NULL,
    "endPointImagePreview" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);
INSERT INTO "new_AuthCamera" ("createdAt", "endPointImagePreview", "endPointRtsp", "httpPort", "id", "ipAddress", "password", "rtspPort", "updatedAt", "userName") SELECT "createdAt", "endPointImagePreview", "endPointRtsp", "httpPort", "id", "ipAddress", "password", "rtspPort", "updatedAt", "userName" FROM "AuthCamera";
DROP TABLE "AuthCamera";
ALTER TABLE "new_AuthCamera" RENAME TO "AuthCamera";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
