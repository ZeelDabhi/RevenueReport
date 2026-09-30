-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('FTD', 'MTD', 'LMTD');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "units" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_imports" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "businessDate" DATE NOT NULL,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "fileName" VARCHAR(255),
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_departments" (
    "id" SERIAL NOT NULL,
    "importId" INTEGER NOT NULL,
    "revenueOn" VARCHAR(200),
    "totalNetAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "revenue_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_summaries" (
    "id" SERIAL NOT NULL,
    "importId" INTEGER NOT NULL,
    "opBillCount" INTEGER NOT NULL DEFAULT 0,
    "ipBillCount" INTEGER NOT NULL DEFAULT 0,
    "erBillCount" INTEGER NOT NULL DEFAULT 0,
    "dcBillCount" INTEGER NOT NULL DEFAULT 0,
    "pharmacyBillCount" INTEGER NOT NULL DEFAULT 0,
    "opticalBillCount" INTEGER NOT NULL DEFAULT 0,
    "opBillAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ipBillAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "erBillAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dcBillAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pharmacyBillAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opticalBillAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ipDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "erDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dcDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pharmacyDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opticalDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opRefundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ipRefundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "erRefundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dcRefundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pharmacyRefundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opticalRefundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opCancelCreditAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ipCancelCreditAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "erCancelCreditAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dcCancelCreditAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pharmacyCancelCreditAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opticalCancelCreditAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opNetAfterRefund" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ipNetAfterRefund" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "erNetAfterRefund" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dcNetAfterRefund" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pharmacyNetAfterRefund" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "opticalNetAfterRefund" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grandTotalBillCount" INTEGER NOT NULL DEFAULT 0,
    "grandTotalBillAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grandTotalDiscountAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grandTotalRefundAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grandTotalNetAfterRefund" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "grandTotalCancelCreditAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "finalNetAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "rawSummary" JSONB,

    CONSTRAINT "revenue_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE INDEX "revenue_imports_unitId_idx" ON "revenue_imports"("unitId");

-- CreateIndex
CREATE INDEX "revenue_imports_businessDate_idx" ON "revenue_imports"("businessDate");

-- CreateIndex
CREATE INDEX "revenue_imports_reportType_idx" ON "revenue_imports"("reportType");

-- CreateIndex
CREATE INDEX "revenue_imports_unitId_businessDate_idx" ON "revenue_imports"("unitId", "businessDate");

-- CreateIndex
CREATE INDEX "revenue_imports_reportType_businessDate_idx" ON "revenue_imports"("reportType", "businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_imports_unitId_reportType_businessDate_key" ON "revenue_imports"("unitId", "reportType", "businessDate");

-- CreateIndex
CREATE INDEX "revenue_departments_importId_idx" ON "revenue_departments"("importId");

-- CreateIndex
CREATE INDEX "revenue_departments_revenueOn_idx" ON "revenue_departments"("revenueOn");

-- CreateIndex
CREATE INDEX "revenue_departments_importId_revenueOn_idx" ON "revenue_departments"("importId", "revenueOn");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_summaries_importId_key" ON "revenue_summaries"("importId");

-- AddForeignKey
ALTER TABLE "revenue_imports" ADD CONSTRAINT "revenue_imports_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_departments" ADD CONSTRAINT "revenue_departments_importId_fkey" FOREIGN KEY ("importId") REFERENCES "revenue_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_summaries" ADD CONSTRAINT "revenue_summaries_importId_fkey" FOREIGN KEY ("importId") REFERENCES "revenue_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
