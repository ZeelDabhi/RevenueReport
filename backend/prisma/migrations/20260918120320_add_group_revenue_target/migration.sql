-- CreateTable
CREATE TABLE "group_revenue_targets" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "groupTargetLakhs" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_revenue_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_revenue_targets_year_month_idx" ON "group_revenue_targets"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "group_revenue_targets_year_month_key" ON "group_revenue_targets"("year", "month");
