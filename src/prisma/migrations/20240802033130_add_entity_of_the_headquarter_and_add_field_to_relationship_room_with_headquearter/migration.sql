/*
  Warnings:

  - A unique constraint covering the columns `[name,cameraId]` on the table `MovementsPTZ` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `headquarterId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "MovementsPTZ_cameraId_name_key";

-- CreateTable
CREATE TABLE "Headquarter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "headquarterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Room_headquarterId_fkey" FOREIGN KEY ("headquarterId") REFERENCES "Headquarter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("active", "createdAt", "id", "name", "updatedAt") SELECT "active", "createdAt", "id", "name", "updatedAt" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Headquarter_name_key" ON "Headquarter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MovementsPTZ_name_cameraId_key" ON "MovementsPTZ"("name", "cameraId");
