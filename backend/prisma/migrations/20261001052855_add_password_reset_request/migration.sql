/*
  Warnings:

  - You are about to drop the `password_reset_otps` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "password_reset_otps" DROP CONSTRAINT "password_reset_otps_userId_fkey";

-- DropTable
DROP TABLE "password_reset_otps";

-- CreateTable
CREATE TABLE "password_reset_requests" (
    "id" SERIAL NOT NULL,
    "requestId" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "initiatedByUserId" INTEGER NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_requests_requestId_key" ON "password_reset_requests"("requestId");

-- CreateIndex
CREATE INDEX "password_reset_requests_userId_idx" ON "password_reset_requests"("userId");

-- CreateIndex
CREATE INDEX "password_reset_requests_initiatedByUserId_idx" ON "password_reset_requests"("initiatedByUserId");

-- CreateIndex
CREATE INDEX "password_reset_requests_expiresAt_idx" ON "password_reset_requests"("expiresAt");

-- CreateIndex
CREATE INDEX "password_reset_requests_userId_usedAt_expiresAt_idx" ON "password_reset_requests"("userId", "usedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "password_reset_requests" ADD CONSTRAINT "password_reset_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_requests" ADD CONSTRAINT "password_reset_requests_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
