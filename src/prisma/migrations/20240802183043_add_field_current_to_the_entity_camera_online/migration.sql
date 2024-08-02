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
    "current" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "CameraOnline_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CameraOnline" ("cameraId", "createdAt", "descriptionStatus", "endPointStreaming", "id", "password", "status", "updatedAt") SELECT "cameraId", "createdAt", "descriptionStatus", "endPointStreaming", "id", "password", "status", "updatedAt" FROM "CameraOnline";
DROP TABLE "CameraOnline";
ALTER TABLE "new_CameraOnline" RENAME TO "CameraOnline";
CREATE INDEX "CameraOnline_cameraId_idx" ON "CameraOnline"("cameraId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
