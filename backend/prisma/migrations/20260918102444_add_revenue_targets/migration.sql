-- CreateTable
CREATE TABLE "revenue_targets" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "targetLakhs" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revenue_targets_year_month_idx" ON "revenue_targets"("year", "month");

-- CreateIndex
CREATE INDEX "revenue_targets_unitId_idx" ON "revenue_targets"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_targets_unitId_year_month_key" ON "revenue_targets"("unitId", "year", "month");

-- AddForeignKey
ALTER TABLE "revenue_targets" ADD CONSTRAINT "revenue_targets_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
