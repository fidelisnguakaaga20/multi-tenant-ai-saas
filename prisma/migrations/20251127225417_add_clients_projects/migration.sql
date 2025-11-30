/*
  Warnings:

  - You are about to alter the column `estimatedValue` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `estimatedValue` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "estimatedValue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "estimatedValue" SET DATA TYPE INTEGER,
ALTER COLUMN "lastActivityAt" DROP NOT NULL,
ALTER COLUMN "lastActivityAt" DROP DEFAULT;
