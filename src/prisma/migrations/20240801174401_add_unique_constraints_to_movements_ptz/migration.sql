/*
  Warnings:

  - A unique constraint covering the columns `[cameraId,name]` on the table `MovementsPTZ` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cameraId,order]` on the table `MovementsPTZ` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MovementsPTZ_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "MovementsPTZ_cameraId_name_key" ON "MovementsPTZ"("cameraId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MovementsPTZ_cameraId_order_key" ON "MovementsPTZ"("cameraId", "order");
