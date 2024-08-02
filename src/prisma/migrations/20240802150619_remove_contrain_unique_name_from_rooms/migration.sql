/*
  Warnings:

  - A unique constraint covering the columns `[name,headquarterId]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Room_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_headquarterId_key" ON "Room"("name", "headquarterId");
