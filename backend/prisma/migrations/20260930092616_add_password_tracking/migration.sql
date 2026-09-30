-- CreateEnum
CREATE TYPE "PasswordChangedBy" AS ENUM ('SELF', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "passwordChangedBy" "PasswordChangedBy";
