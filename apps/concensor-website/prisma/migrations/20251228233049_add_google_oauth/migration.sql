/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'email',
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
