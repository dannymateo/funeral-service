/*
  Warnings:

  - You are about to drop the column `current` on the `CameraOnline` table. All the data in the column will be lost.
  - You are about to drop the column `folderWorkUrl` on the `CameraOnline` table. All the data in the column will be lost.
  - Added the required column `endPointStreaming` to the `CameraOnline` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CameraOnline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cameraId" TEXT NOT NULL,
    "endPointStreaming" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "descriptionStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "CameraOnline_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CameraOnline" ("cameraId", "createdAt", "descriptionStatus", "id", "password", "status", "updatedAt") SELECT "cameraId", "createdAt", "descriptionStatus", "id", "password", "status", "updatedAt" FROM "CameraOnline";
DROP TABLE "CameraOnline";
ALTER TABLE "new_CameraOnline" RENAME TO "CameraOnline";
CREATE INDEX "CameraOnline_cameraId_idx" ON "CameraOnline"("cameraId");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "hasStreaming" BOOLEAN NOT NULL DEFAULT false,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "startAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Service_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("createdAt", "current", "endAt", "hasStreaming", "id", "roomId", "startAt", "updatedAt") SELECT "createdAt", "current", "endAt", "hasStreaming", "id", "roomId", "startAt", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
