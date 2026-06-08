/*
  Warnings:

  - A unique constraint covering the columns `[qrCodeToken]` on the table `claims` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "status" ADD VALUE 'CLAIMED';

-- AlterTable
ALTER TABLE "claims" ADD COLUMN     "qrCodeToken" TEXT;

-- AlterTable
ALTER TABLE "foundItems" ADD COLUMN     "embedding" TEXT;

-- AlterTable
ALTER TABLE "lostItems" ADD COLUMN     "embedding" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "claims_qrCodeToken_key" ON "claims"("qrCodeToken");
