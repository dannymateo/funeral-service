/*
  Warnings:

  - You are about to drop the column `imagePreviewUrl` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `rtspUrl` on the `Camera` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Camera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "authCameraId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hasPTZ" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Camera_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Camera_authCameraId_fkey" FOREIGN KEY ("authCameraId") REFERENCES "AuthCamera" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Camera" ("active", "authCameraId", "createdAt", "hasPTZ", "id", "name", "roomId", "updatedAt") SELECT "active", "authCameraId", "createdAt", "hasPTZ", "id", "name", "roomId", "updatedAt" FROM "Camera";
DROP TABLE "Camera";
ALTER TABLE "new_Camera" RENAME TO "Camera";
CREATE UNIQUE INDEX "Camera_name_key" ON "Camera"("name");
CREATE INDEX "Camera_roomId_idx" ON "Camera"("roomId");
CREATE INDEX "Camera_authCameraId_idx" ON "Camera"("authCameraId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
