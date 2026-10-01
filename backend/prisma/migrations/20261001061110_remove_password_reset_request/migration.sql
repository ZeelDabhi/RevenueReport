/*
  Warnings:

  - You are about to drop the `password_reset_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "password_reset_requests" DROP CONSTRAINT "password_reset_requests_initiatedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_requests" DROP CONSTRAINT "password_reset_requests_userId_fkey";

-- DropTable
DROP TABLE "password_reset_requests";
