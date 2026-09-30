import {
  getReportDates,
  type ReportType,
} from "../../utils/reportDates.ts";

import {
  parseRevenueCsv,
} from "./revenue.parser.ts";


// ======================================================
// SAVE REVENUE REPORT
//
// Arguments:
//
// 1. tx
// 2. unit
// 3. reportType
// 4. file
// 5. selectedBusinessDate
//
// Same Unit + Report Type + Business Date
// Re-upload = Update
//
// Supported:
// FTD / MTD / LMTD / LM
// ======================================================

export async function saveRevenueReport(
  tx: any,
  unit: any,
  reportType: ReportType,
  file: Express.Multer.File,
  selectedBusinessDate: Date
) {

  // ====================================================
  // REPORT DATES
  //
  // Example selected date: 25-09-2026
  //
  // FTD  = 25-09 -> 25-09
  // MTD  = 01-09 -> 25-09
  // LMTD = 01-08 -> 25-08
  // LM   = 01-08 -> 31-08
  // ====================================================

  const {
    businessDate,
    fromDate,
    toDate,
  } =
    getReportDates(
      reportType,
      selectedBusinessDate
    );


  // ====================================================
  // PARSE CSV
  // ====================================================

  const parsed =
    parseRevenueCsv(
      file.buffer
    );


  // ====================================================
  // IMPORT MASTER
  // ====================================================

  const revenueImport =
    await tx.revenueImport.upsert({

      where: {

        unitId_reportType_businessDate: {

          unitId:
            unit.id,

          reportType,

          businessDate,

        },

      },


      // ==================================================
      // UPDATE EXISTING
      // ==================================================

      update: {

        fromDate,

        toDate,

        fileName:
          file.originalname,

        totalNetAmount:
          parsed.totalNetAmount,

        totalNetAmountLakhs:
          parsed.totalNetAmountLakhs,

        status:
          "PROCESSING",

        errorMessage:
          null,

      },


      // ==================================================
      // CREATE NEW
      // ==================================================

      create: {

        unitId:
          unit.id,

        reportType,

        businessDate,

        fromDate,

        toDate,

        fileName:
          file.originalname,

        totalNetAmount:
          parsed.totalNetAmount,

        totalNetAmountLakhs:
          parsed.totalNetAmountLakhs,

        status:
          "PROCESSING",

      },

    });


  // ====================================================
  // DELETE OLD DEPARTMENT DETAILS
  //
  // Re-upload = old department data is replaced.
  // ====================================================

  await tx
    .revenueDepartment
    .deleteMany({

      where: {

        importId:
          revenueImport.id,

      },

    });


  // ====================================================
  // DELETE OLD SUMMARY
  // ====================================================

  await tx
    .revenueSummary
    .deleteMany({

      where: {

        importId:
          revenueImport.id,

      },

    });


  // ====================================================
  // INSERT DEPARTMENTS
  // ====================================================

  if (
    parsed.departments.length >
    0
  ) {

    await tx
      .revenueDepartment
      .createMany({

        data:
          parsed.departments.map(
            (department) => ({

              importId:
                revenueImport.id,

              revenueOn:
                department.revenueOn,

              totalNetAmount:
                department.totalNetAmount,

            })
          ),

      });

  }


  // ====================================================
  // SUMMARY
  // ====================================================

  const summary =
    parsed.summary;


  await tx
    .revenueSummary
    .create({

      data: {

        importId:
          revenueImport.id,


        // =================================================
        // BILL COUNT
        // =================================================

        opBillCount:
          summary?.opBillCount ??
          0,

        ipBillCount:
          summary?.ipBillCount ??
          0,

        erBillCount:
          summary?.erBillCount ??
          0,

        dcBillCount:
          summary?.dcBillCount ??
          0,

        pharmacyBillCount:
          summary?.pharmacyBillCount ??
          0,

        opticalBillCount:
          summary?.opticalBillCount ??
          0,


        // =================================================
        // BILL AMOUNT
        // =================================================

        opBillAmount:
          summary?.opBillAmount ??
          0,

        ipBillAmount:
          summary?.ipBillAmount ??
          0,

        erBillAmount:
          summary?.erBillAmount ??
          0,

        dcBillAmount:
          summary?.dcBillAmount ??
          0,

        pharmacyBillAmount:
          summary?.pharmacyBillAmount ??
          0,

        opticalBillAmount:
          summary?.opticalBillAmount ??
          0,


        // =================================================
        // DISCOUNT
        // =================================================

        opDiscountAmount:
          summary?.opDiscountAmount ??
          0,

        ipDiscountAmount:
          summary?.ipDiscountAmount ??
          0,

        erDiscountAmount:
          summary?.erDiscountAmount ??
          0,

        dcDiscountAmount:
          summary?.dcDiscountAmount ??
          0,

        pharmacyDiscountAmount:
          summary?.pharmacyDiscountAmount ??
          0,

        opticalDiscountAmount:
          summary?.opticalDiscountAmount ??
          0,


        // =================================================
        // REFUND
        // =================================================

        opRefundAmount:
          summary?.opRefundAmount ??
          0,

        ipRefundAmount:
          summary?.ipRefundAmount ??
          0,

        erRefundAmount:
          summary?.erRefundAmount ??
          0,

        dcRefundAmount:
          summary?.dcRefundAmount ??
          0,

        pharmacyRefundAmount:
          summary?.pharmacyRefundAmount ??
          0,

        opticalRefundAmount:
          summary?.opticalRefundAmount ??
          0,


        // =================================================
        // CANCEL CREDIT
        // =================================================

        opCancelCreditAmount:
          summary?.opCancelCreditAmount ??
          0,

        ipCancelCreditAmount:
          summary?.ipCancelCreditAmount ??
          0,

        erCancelCreditAmount:
          summary?.erCancelCreditAmount ??
          0,

        dcCancelCreditAmount:
          summary?.dcCancelCreditAmount ??
          0,

        pharmacyCancelCreditAmount:
          summary?.pharmacyCancelCreditAmount ??
          0,

        opticalCancelCreditAmount:
          summary?.opticalCancelCreditAmount ??
          0,


        // =================================================
        // NET AFTER REFUND
        // =================================================

        opNetAfterRefund:
          summary?.opNetAfterRefund ??
          0,

        ipNetAfterRefund:
          summary?.ipNetAfterRefund ??
          0,

        erNetAfterRefund:
          summary?.erNetAfterRefund ??
          0,

        dcNetAfterRefund:
          summary?.dcNetAfterRefund ??
          0,

        pharmacyNetAfterRefund:
          summary?.pharmacyNetAfterRefund ??
          0,

        opticalNetAfterRefund:
          summary?.opticalNetAfterRefund ??
          0,


        // =================================================
        // GRAND TOTAL
        // =================================================

        grandTotalBillCount:
          summary?.grandTotalBillCount ??
          0,

        grandTotalBillAmount:
          summary?.grandTotalBillAmount ??
          0,

        grandTotalDiscountAmount:
          summary?.grandTotalDiscountAmount ??
          0,

        grandTotalRefundAmount:
          summary?.grandTotalRefundAmount ??
          0,

        grandTotalNetAfterRefund:
          summary?.grandTotalNetAfterRefund ??
          0,

        grandTotalCancelCreditAmount:
          summary?.grandTotalCancelCreditAmount ??
          0,

        finalNetAmount:
          summary?.finalNetAmount ??
          0,


        // =================================================
        // RAW SUMMARY
        // =================================================

        rawSummary:
          parsed.rawSummary as any,

      },

    });


  // ====================================================
  // MARK COMPLETED
  // ====================================================

  const completedImport =
    await tx
      .revenueImport
      .update({

        where: {

          id:
            revenueImport.id,

        },

        data: {

          status:
            "COMPLETED",

          errorMessage:
            null,

        },

      });


  // ====================================================
  // RESPONSE
  // ====================================================

  return {

    importId:
      completedImport.id,

    unitId:
      unit.id,

    unitCode:
      unit.code,

    unitName:
      unit.name,

    reportType,

    fileName:
      file.originalname,

    businessDate:
      completedImport.businessDate,

    fromDate:
      completedImport.fromDate,

    toDate:
      completedImport.toDate,

    departmentCount:
      parsed.departments.length,

    totalNetAmount:
      Number(
        completedImport
          .totalNetAmount
      ),

    totalNetAmountLakhs:
      Number(
        completedImport
          .totalNetAmountLakhs
      ),

    status:
      completedImport.status,

  };
}
