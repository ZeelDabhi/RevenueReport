-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordChangedByUserId" INTEGER;

-- CreateIndex
CREATE INDEX "users_passwordChangedByUserId_idx" ON "users"("passwordChangedByUserId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_passwordChangedByUserId_fkey" FOREIGN KEY ("passwordChangedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
