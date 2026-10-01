-- CreateTable
CREATE TABLE "password_reset_otps" (
    "id" SERIAL NOT NULL,
    "requestId" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_otps_requestId_key" ON "password_reset_otps"("requestId");

-- CreateIndex
CREATE INDEX "password_reset_otps_userId_idx" ON "password_reset_otps"("userId");

-- CreateIndex
CREATE INDEX "password_reset_otps_expiresAt_idx" ON "password_reset_otps"("expiresAt");

-- CreateIndex
CREATE INDEX "password_reset_otps_userId_usedAt_expiresAt_idx" ON "password_reset_otps"("userId", "usedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "password_reset_otps" ADD CONSTRAINT "password_reset_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
