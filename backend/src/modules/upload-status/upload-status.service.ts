import {
  prisma,
} from "../../config/database.ts";


// ======================================================
// ACTIVE UNIT ORDER
// ======================================================

const UNIT_ORDER = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
];


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
  date: Date
): string {

  const year =
    date.getUTCFullYear();


  const month =
    String(
      date.getUTCMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getUTCDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ======================================================
// DAILY UPLOAD STATUS
//
// 7 Active Units
//
// Each unit requires:
//
// FTD
// MTD
// LMTD
// CURR_OCC
//
// Total Required Items:
// 7 × 4 = 28
//
// No N+1 queries.
// ======================================================

export async function getDailyUploadStatus(
  statusDate: Date
) {

  // ====================================================
  // PARALLEL DATABASE QUERIES
  // ====================================================

  const [
    units,
    revenueFiles,
    occupancyFiles,
  ] =
    await Promise.all([


      // ===============================================
      // ACTIVE UNIT MASTER
      // ===============================================

      prisma.unit.findMany({

        where: {

          isActive:
            true,

        },

        select: {

          id:
            true,

          code:
            true,

          name:
            true,

        },

      }),


      // ===============================================
      // ACTIVE UNIT REVENUE FILES
      //
      // FTD / MTD / LMTD
      // ===============================================

      prisma.revenueImport.findMany({

        where: {

          businessDate:
            statusDate,

          status:
            "COMPLETED",

          unit: {

            isActive:
              true,

          },

        },

        select: {

          id:
            true,

          unitId:
            true,

          reportType:
            true,

          fileName:
            true,

          businessDate:
            true,

          fromDate:
            true,

          toDate:
            true,

          updatedAt:
            true,

        },

      }),


      // ===============================================
      // ACTIVE UNIT OCCUPANCY FILES
      // ===============================================

      prisma.dailyOccupancy.findMany({

        where: {

          occupancyDate:
            statusDate,

          unit: {

            isActive:
              true,

          },

        },

        select: {

          id:
            true,

          unitId:
            true,

          occupancyCount:
            true,

          sourceFileName:
            true,

          occupancyDate:
            true,

          updatedAt:
            true,

        },

      }),

    ]);


  // ====================================================
  // UNIT SORTING
  // ====================================================

  units.sort(
    (
      a,
      b
    ) =>

      UNIT_ORDER.indexOf(
        a.code
      ) -

      UNIT_ORDER.indexOf(
        b.code
      )
  );


  // ====================================================
  // REVENUE MAP
  //
  // Example:
  //
  // 1-FTD
  // 1-MTD
  // 1-LMTD
  // ====================================================

  const revenueMap =
    new Map<
      string,
      (typeof revenueFiles)[number]
    >();


  for (
    const report
    of revenueFiles
  ) {

    const key =
      `${report.unitId}-${report.reportType}`;


    revenueMap.set(
      key,
      report
    );

  }


  // ====================================================
  // OCCUPANCY MAP
  //
  // unitId -> Occupancy Record
  // ====================================================

  const occupancyMap =
    new Map<
      number,
      (typeof occupancyFiles)[number]
    >();


  for (
    const occupancy
    of occupancyFiles
  ) {

    occupancyMap.set(
      occupancy.unitId,
      occupancy
    );

  }


  // ====================================================
  // UNIT-WISE STATUS
  // ====================================================

  const unitStatus =
    units.map(
      (
        unit
      ) => {

        const ftd =
          revenueMap.get(
            `${unit.id}-FTD`
          );


        const mtd =
          revenueMap.get(
            `${unit.id}-MTD`
          );


        const lmtd =
          revenueMap.get(
            `${unit.id}-LMTD`
          );


        const occupancy =
          occupancyMap.get(
            unit.id
          );


        // =============================================
        // SIMPLE BOOLEAN STATUS
        // =============================================

        const FTD =
          Boolean(
            ftd
          );


        const MTD =
          Boolean(
            mtd
          );


        const LMTD =
          Boolean(
            lmtd
          );


        const CURR_OCC =
          Boolean(
            occupancy
          );


        const complete =
          FTD &&
          MTD &&
          LMTD &&
          CURR_OCC;


        // =============================================
        // MISSING ITEMS
        // =============================================

        const missing:
          string[] =
          [];


        if (
          !FTD
        ) {

          missing.push(
            "FTD"
          );

        }


        if (
          !MTD
        ) {

          missing.push(
            "MTD"
          );

        }


        if (
          !LMTD
        ) {

          missing.push(
            "LMTD"
          );

        }


        if (
          !CURR_OCC
        ) {

          missing.push(
            "CURR_OCC"
          );

        }


        // =============================================
        // FINAL UNIT STATUS
        // =============================================

        return {

          unitId:
            unit.id,

          unitCode:
            unit.code,

          unitName:
            unit.name,


          FTD,

          MTD,

          LMTD,

          CURR_OCC,

          complete,

          missing,


          // ===========================================
          // FILE DETAILS
          // ===========================================

          files: {

            FTD:
              ftd
                ? {

                    importId:
                      ftd.id,

                    fileName:
                      ftd.fileName,

                    businessDate:
                      ftd.businessDate,

                    fromDate:
                      ftd.fromDate,

                    toDate:
                      ftd.toDate,

                    updatedAt:
                      ftd.updatedAt,

                  }
                : null,


            MTD:
              mtd
                ? {

                    importId:
                      mtd.id,

                    fileName:
                      mtd.fileName,

                    businessDate:
                      mtd.businessDate,

                    fromDate:
                      mtd.fromDate,

                    toDate:
                      mtd.toDate,

                    updatedAt:
                      mtd.updatedAt,

                  }
                : null,


            LMTD:
              lmtd
                ? {

                    importId:
                      lmtd.id,

                    fileName:
                      lmtd.fileName,

                    businessDate:
                      lmtd.businessDate,

                    fromDate:
                      lmtd.fromDate,

                    toDate:
                      lmtd.toDate,

                    updatedAt:
                      lmtd.updatedAt,

                  }
                : null,


            CURR_OCC:
              occupancy
                ? {

                    occupancyId:
                      occupancy.id,

                    fileName:
                      occupancy
                        .sourceFileName,

                    occupancyDate:
                      occupancy
                        .occupancyDate,

                    occupancyCount:
                      occupancy
                        .occupancyCount,

                    updatedAt:
                      occupancy
                        .updatedAt,

                  }
                : null,

          },

        };

      }
    );


  // ====================================================
  // COMPLETE / PENDING UNIT COUNT
  // ====================================================

  const completeUnits =
    unitStatus.filter(
      (
        unit
      ) =>
        unit.complete
    ).length;


  const pendingUnits =
    unitStatus.length -
    completeUnits;


  // ====================================================
  // ITEM COUNTS
  // ====================================================

  const ftdUploaded =
    unitStatus.filter(
      (
        unit
      ) =>
        unit.FTD
    ).length;


  const mtdUploaded =
    unitStatus.filter(
      (
        unit
      ) =>
        unit.MTD
    ).length;


  const lmtdUploaded =
    unitStatus.filter(
      (
        unit
      ) =>
        unit.LMTD
    ).length;


  const occupancyUploaded =
    unitStatus.filter(
      (
        unit
      ) =>
        unit.CURR_OCC
    ).length;


  // ====================================================
  // TOTAL REQUIRED ITEMS
  //
  // 7 Units × 4 Items = 28
  // ====================================================

  const totalRequiredItems =
    unitStatus.length *
    4;


  const totalUploadedItems =
    ftdUploaded +
    mtdUploaded +
    lmtdUploaded +
    occupancyUploaded;


  const totalPendingItems =
    totalRequiredItems -
    totalUploadedItems;


  // ====================================================
  // COMPLETION %
  // ====================================================

  const completionPercentage =
    totalRequiredItems > 0
      ? Number(
          (
            (
              totalUploadedItems /
              totalRequiredItems
            ) *
            100
          ).toFixed(
            2
          )
        )
      : 0;


  // ====================================================
  // FINAL RESPONSE
  // ====================================================

  return {

    date:
      formatDate(
        statusDate
      ),


    summary: {

      totalUnits:
        unitStatus.length,

      completeUnits,

      pendingUnits,


      // ===============================================
      // TOTAL ITEM STATUS
      // ===============================================

      totalRequiredItems,

      totalUploadedItems,

      totalPendingItems,

      completionPercentage,


      // ===============================================
      // FTD
      // ===============================================

      FTD: {

        uploaded:
          ftdUploaded,

        pending:
          unitStatus.length -
          ftdUploaded,

        complete:
          ftdUploaded ===
          unitStatus.length,

      },


      // ===============================================
      // MTD
      // ===============================================

      MTD: {

        uploaded:
          mtdUploaded,

        pending:
          unitStatus.length -
          mtdUploaded,

        complete:
          mtdUploaded ===
          unitStatus.length,

      },


      // ===============================================
      // LMTD
      // ===============================================

      LMTD: {

        uploaded:
          lmtdUploaded,

        pending:
          unitStatus.length -
          lmtdUploaded,

        complete:
          lmtdUploaded ===
          unitStatus.length,

      },


      // ===============================================
      // OCCUPANCY
      // ===============================================

      CURR_OCC: {

        uploaded:
          occupancyUploaded,

        pending:
          unitStatus.length -
          occupancyUploaded,

        complete:
          occupancyUploaded ===
          unitStatus.length,

      },


      // ===============================================
      // ALL COMPLETE
      // ===============================================

      allComplete:
        unitStatus.length > 0 &&
        completeUnits ===
          unitStatus.length,

    },


    // ==================================================
    // UNIT-WISE STATUS
    // ==================================================

    units:
      unitStatus,

  };

}