-- CreateTable
CREATE TABLE "daily_occupancies" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "occupancyDate" DATE NOT NULL,
    "occupancyCount" INTEGER NOT NULL DEFAULT 0,
    "sourceFileName" VARCHAR(255),
    "rawRowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_occupancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_occupancies_occupancyDate_idx" ON "daily_occupancies"("occupancyDate");

-- CreateIndex
CREATE INDEX "daily_occupancies_unitId_idx" ON "daily_occupancies"("unitId");

-- CreateIndex
CREATE INDEX "daily_occupancies_unitId_occupancyDate_idx" ON "daily_occupancies"("unitId", "occupancyDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_occupancies_unitId_occupancyDate_key" ON "daily_occupancies"("unitId", "occupancyDate");

-- AddForeignKey
ALTER TABLE "daily_occupancies" ADD CONSTRAINT "daily_occupancies_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
