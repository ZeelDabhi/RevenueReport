import {
  prisma,
} from "../../config/database.ts";


// ======================================================
// MONTH NAMES
// ======================================================

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


// ======================================================
// UNIT ORDER
// ======================================================

export const UNIT_ORDER = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
];


// ======================================================
// OPTIONAL UNIT SCOPE
//
// Full-access roles call service functions without unitId.
// INCHARGE_DIRECTOR passes its assigned unitId.
//
// This helper keeps every dashboard query restricted to
// the logged-in Incharge Director's own unit.
// ======================================================

function buildActiveUnitWhere(
  unitId?: number
) {

  return unitId
    ? {
        id: unitId,
        isActive: true,
      }
    : {
        isActive: true,
      };
}


// ======================================================
// ROUND 2 DECIMALS
// ======================================================

function round2(
  value: number
): number {

  return Number(
    value.toFixed(2)
  );
}


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
// NEXT DAY
//
// Revenue Dashboard rule:
//
// Dashboard Business Date = D
// Current Bed Occupancy    = D + 1
//
// Example:
// Dashboard 2026-09-22 uses Occupancy 2026-09-23.
// ======================================================

function getNextDay(
  date: Date
): Date {

  const nextDay =
    new Date(
      date.getTime()
    );


  nextDay.setUTCDate(
    nextDay.getUTCDate() +
      1
  );


  return nextDay;
}


// ======================================================
// PREVIOUS DAY
//
// Used when mapping an actual Occupancy date back to the
// Revenue Dashboard business date it belongs to.
// ======================================================

function getPreviousDay(
  date: Date
): Date {

  const previousDay =
    new Date(
      date.getTime()
    );


  previousDay.setUTCDate(
    previousDay.getUTCDate() -
      1
  );


  return previousDay;
}


// ======================================================
// MONTH START
// ======================================================

function getMonthStart(
  year: number,
  month: number
): Date {

  return new Date(
    Date.UTC(
      year,
      month - 1,
      1
    )
  );
}


// ======================================================
// NEXT MONTH START
// ======================================================

function getNextMonthStart(
  year: number,
  month: number
): Date {

  return new Date(
    Date.UTC(
      year,
      month,
      1
    )
  );
}


// ======================================================
// YEAR START
// ======================================================

function getYearStart(
  year: number
): Date {

  return new Date(
    Date.UTC(
      year,
      0,
      1
    )
  );
}


// ======================================================
// NEXT YEAR START
// ======================================================

function getNextYearStart(
  year: number
): Date {

  return new Date(
    Date.UTC(
      year + 1,
      0,
      1
    )
  );
}


// ======================================================
// SORT UNITS
// ======================================================

function sortUnits(
  units: any[]
) {

  return [
    ...units,
  ].sort(
    (a, b) =>

      UNIT_ORDER.indexOf(
        a.code
      ) -

      UNIT_ORDER.indexOf(
        b.code
      )
  );
}


// ======================================================
// BUILD DASHBOARD SNAPSHOT
//
// Used by:
//
// 1. Exact Date Dashboard
// 2. Date Range Dashboard
// 3. Monthly Final Summary
// 4. Yearly Summary
//
// OCCUPANCY RULE:
//
// Dashboard Business Date = D
// Current Occupancy        = D + 1
//
// FORMULAS:
//
// PROJ = MTD ÷ Selected Day × Month Days
//
// GAP = PROJ - Unit TGT
//
// GRAND GAP = Grand PROJ - Group TGT
// ======================================================

function buildDashboardSnapshot(
  selectedDate: Date,
  unitsInput: any[],
  reports: any[],
  unitTargets: any[],
  groupTarget: any,
  occupancyRecords: any[],
  unitId?: number
) {

  const year =
    selectedDate
      .getUTCFullYear();


  const month =
    selectedDate
      .getUTCMonth() + 1;


  const selectedDay =
    selectedDate
      .getUTCDate();


  const totalDaysInMonth =
    new Date(
      Date.UTC(
        year,
        month,
        0
      )
    )
      .getUTCDate();


  const units =
    sortUnits(
      unitsInput
    );


  // ====================================================
  // REVENUE MAP
  //
  // unitId-reportType
  // ====================================================

  const revenueMap =
    new Map<
      string,
      any
    >();


  for (
    const report
    of reports
  ) {

    revenueMap.set(
      `${report.unitId}-${report.reportType}`,
      report
    );

  }


  // ====================================================
  // TARGET MAP
  // ====================================================

  const targetMap =
    new Map<
      number,
      any
    >();


  for (
    const target
    of unitTargets
  ) {

    targetMap.set(
      target.unitId,
      target
    );

  }


  // ====================================================
  // OCCUPANCY MAP
  // ====================================================

  const occupancyMap =
    new Map<
      number,
      any
    >();


  for (
    const occupancy
    of occupancyRecords
  ) {

    occupancyMap.set(
      occupancy.unitId,
      occupancy
    );

  }


  // ====================================================
  // UNIT TABLE
  // ====================================================

  const unitDashboard =
    units.map(
      (unit) => {

        const FTD =
          revenueMap.get(
            `${unit.id}-FTD`
          );


        const MTD =
          revenueMap.get(
            `${unit.id}-MTD`
          );


        const LMTD =
          revenueMap.get(
            `${unit.id}-LMTD`
          );


        const target =
          targetMap.get(
            unit.id
          );


        const occupancy =
          occupancyMap.get(
            unit.id
          );


        // ===============================================
        // VALUES
        // ===============================================

        const ftdLakhs =
          FTD
            ? Number(
                FTD.totalNetAmountLakhs
              )
            : 0;


        const mtdLakhs =
          MTD
            ? Number(
                MTD.totalNetAmountLakhs
              )
            : 0;


        const lmtdLakhs =
          LMTD
            ? Number(
                LMTD.totalNetAmountLakhs
              )
            : 0;


        const targetLakhs =
          target
            ? Number(
                target.targetLakhs
              )
            : 0;


        const currentOccupancy =
          occupancy
            ? Number(
                occupancy.occupancyCount
              )
            : 0;


        // ===============================================
        // PROJECTION
        // ===============================================

        const projectionLakhs =
          (
            mtdLakhs /
            selectedDay
          ) *
          totalDaysInMonth;


        // ===============================================
        // GAP
        // ===============================================

        const gapLakhs =
          projectionLakhs -
          targetLakhs;


        return {

          unitId:
            unit.id,

          unitCode:
            unit.code,

          unitName:
            unit.name,


          // =============================================
          // FTD
          // =============================================

          FTD:
            FTD
              ? {

                  importId:
                    FTD.id,

                  businessDate:
                    FTD.businessDate,

                  fromDate:
                    FTD.fromDate,

                  toDate:
                    FTD.toDate,

                  fileName:
                    FTD.fileName,

                  totalNetAmount:
                    Number(
                      FTD.totalNetAmount
                    ),

                  valueLakhs:
                    round2(
                      ftdLakhs
                    ),

                  available:
                    true,

                }
              : null,


          // =============================================
          // MTD
          // =============================================

          MTD:
            MTD
              ? {

                  importId:
                    MTD.id,

                  businessDate:
                    MTD.businessDate,

                  fromDate:
                    MTD.fromDate,

                  toDate:
                    MTD.toDate,

                  fileName:
                    MTD.fileName,

                  totalNetAmount:
                    Number(
                      MTD.totalNetAmount
                    ),

                  valueLakhs:
                    round2(
                      mtdLakhs
                    ),

                  available:
                    true,

                }
              : null,


          // =============================================
          // LMTD
          // =============================================

          LMTD:
            LMTD
              ? {

                  importId:
                    LMTD.id,

                  businessDate:
                    LMTD.businessDate,

                  fromDate:
                    LMTD.fromDate,

                  toDate:
                    LMTD.toDate,

                  fileName:
                    LMTD.fileName,

                  totalNetAmount:
                    Number(
                      LMTD.totalNetAmount
                    ),

                  valueLakhs:
                    round2(
                      lmtdLakhs
                    ),

                  available:
                    true,

                }
              : null,


          // =============================================
          // TARGET
          // =============================================

          TGT: {

            valueLakhs:
              round2(
                targetLakhs
              ),

            available:
              Boolean(
                target
              ),

          },


          // =============================================
          // PROJECTION
          // =============================================

          PROJ: {

            valueLakhs:
              round2(
                projectionLakhs
              ),

            selectedDay,

            totalDaysInMonth,

            formula:
              "MTD / Selected Day * Total Days In Month",

          },


          // =============================================
          // CURRENT OCCUPANCY
          // =============================================

          CURR_OCC: {

            value:
              currentOccupancy,

            occupancyDate:
              occupancy
                ? occupancy.occupancyDate
                : null,

            available:
              Boolean(
                occupancy
              ),

            sourceFileName:
              occupancy
                ? occupancy.sourceFileName
                : null,

          },


          // =============================================
          // GAP
          // =============================================

          GAP: {

            valueLakhs:
              round2(
                gapLakhs
              ),

            formula:
              "PROJ - TGT",

          },

        };

      }
    );


  // ====================================================
  // GRAND TOTALS
  // ====================================================

  const grandFTD =
    unitDashboard.reduce(
      (
        total,
        unit
      ) =>
        total +
        (
          unit.FTD?.valueLakhs ??
          0
        ),
      0
    );


  const grandMTD =
    unitDashboard.reduce(
      (
        total,
        unit
      ) =>
        total +
        (
          unit.MTD?.valueLakhs ??
          0
        ),
      0
    );


  const grandLMTD =
    unitDashboard.reduce(
      (
        total,
        unit
      ) =>
        total +
        (
          unit.LMTD?.valueLakhs ??
          0
        ),
      0
    );


  const grandPROJ =
    unitDashboard.reduce(
      (
        total,
        unit
      ) =>
        total +
        unit.PROJ.valueLakhs,
      0
    );


  const grandCurrentOccupancy =
    unitDashboard.reduce(
      (
        total,
        unit
      ) =>
        total +
        unit.CURR_OCC.value,
      0
    );


  const unitTargetSum =
    unitDashboard.reduce(
      (
        total,
        unit
      ) =>
        total +
        unit.TGT.valueLakhs,
      0
    );


  // ====================================================
  // MANUAL GROUP TARGET
  // ====================================================

  const grandTarget =
    unitId
      ? unitTargetSum
      : groupTarget
        ? Number(
            groupTarget.groupTargetLakhs
          )
        : 0;


  // ====================================================
  // GRAND GAP
  // ====================================================

  const grandGAP =
    grandPROJ -
    grandTarget;


  // ====================================================
  // DATA STATUS
  // ====================================================

  const revenueCompleteUnits =
    unitDashboard.filter(
      (unit) =>
        Boolean(
          unit.FTD &&
          unit.MTD &&
          unit.LMTD
        )
    )
      .length;


  const occupancyCompleteUnits =
    unitDashboard.filter(
      (unit) =>
        unit.CURR_OCC.available
    )
      .length;


  return {

    filters: {

      date:
        formatDate(
          selectedDate
        ),

      year,

      month,

      monthName:
        MONTH_NAMES[
          month - 1
        ],

      day:
        selectedDay,

    },


    projectionInfo: {

      selectedDay,

      totalDaysInMonth,

      formula:
        "MTD / Selected Day * Total Days In Month",

    },


    gapInfo: {

      formula:
        "PROJ - TGT",

      grandFormula:
        unitId
          ? "PROJ - Unit TGT"
          : "Grand PROJ - Group TGT",

    },


    dataStatus: {

      totalUnits:
        units.length,

      revenueCompleteUnits,

      occupancyCompleteUnits,

      revenueComplete:
        revenueCompleteUnits ===
        units.length,

      occupancyComplete:
        occupancyCompleteUnits ===
        units.length,

    },


    grandTotal: {

      FTD:
        round2(
          grandFTD
        ),

      MTD:
        round2(
          grandMTD
        ),

      LMTD:
        round2(
          grandLMTD
        ),

      TGT:
        round2(
          grandTarget
        ),

      PROJ:
        round2(
          grandPROJ
        ),

      CURR_OCC:
        grandCurrentOccupancy,

      unitTargetSum:
        round2(
          unitTargetSum
        ),

      groupTargetAvailable:
        unitId
          ? unitDashboard.some(
              (unit) =>
                unit.TGT.available
            )
          : Boolean(
              groupTarget
            ),

      GAP:
        round2(
          grandGAP
        ),

    },


    units:
      unitDashboard,

  };
}


// ======================================================
// AVAILABLE YEARS
//
// Optimized:
// Revenue / Occupancy only distinct dates.
// ======================================================

export async function getAvailableYears(
  unitId?: number
) {

  const [
    revenueDates,
    targetYears,
    groupTargetYears,
    occupancyDates,
  ] =
    await Promise.all([

      prisma.revenueImport.findMany({

        where: {

          unit: buildActiveUnitWhere(unitId),

        },

        select: {
          businessDate:
            true,
        },

        distinct: [
          "businessDate",
        ],

      }),


      prisma.revenueTarget.findMany({

        where: {

          unit: buildActiveUnitWhere(unitId),

        },

        select: {
          year:
            true,
        },

        distinct: [
          "year",
        ],

      }),


      unitId
        ? Promise.resolve([])
        : prisma.groupRevenueTarget.findMany({

            select: {
              year:
                true,
            },

            distinct: [
              "year",
            ],

          }),


      prisma.dailyOccupancy.findMany({

        where: {

          unit: buildActiveUnitWhere(unitId),

        },

        select: {
          occupancyDate:
            true,
        },

        distinct: [
          "occupancyDate",
        ],

      }),

    ]);


  const years =
    new Set<number>();


  for (
    const record
    of revenueDates
  ) {

    years.add(
      record.businessDate
        .getUTCFullYear()
    );

  }


  for (
    const record
    of targetYears
  ) {

    years.add(
      record.year
    );

  }


  for (
    const record
    of groupTargetYears
  ) {

    years.add(
      record.year
    );

  }


  for (
    const record
    of occupancyDates
  ) {

    const dashboardDate =
      getPreviousDay(
        record.occupancyDate
      );


    years.add(
      dashboardDate
        .getUTCFullYear()
    );

  }


  return Array
    .from(
      years
    )
    .sort(
      (a, b) =>
        b - a
    );
}


// ======================================================
// EXACT DATE DASHBOARD
//
// GET:
// dashboard?date=2026-09-18
//
// 5 independent queries run parallel.
// ======================================================

export async function getRevenueDashboard(
  selectedDate: Date,
  unitId?: number
) {

  const year =
    selectedDate
      .getUTCFullYear();


  const month =
    selectedDate
      .getUTCMonth() + 1;


  // ====================================================
  // OCCUPANCY DATE MAPPING
  //
  // Dashboard 22/09 -> Occupancy 23/09
  // ====================================================

  const occupancyDate =
    getNextDay(
      selectedDate
    );


  const [
    units,
    reports,
    unitTargets,
    groupTarget,
    occupancyRecords,
  ] =
    await Promise.all([


      prisma.unit.findMany({

        where: buildActiveUnitWhere(unitId),

        select: {

          id:
            true,

          code:
            true,

          name:
            true,

        },

      }),


      prisma.revenueImport.findMany({

        where: {

          businessDate:
            selectedDate,

          status:
            "COMPLETED",

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          id:
            true,

          unitId:
            true,

          reportType:
            true,

          businessDate:
            true,

          fromDate:
            true,

          toDate:
            true,

          fileName:
            true,

          totalNetAmount:
            true,

          totalNetAmountLakhs:
            true,

        },

      }),


      prisma.revenueTarget.findMany({

        where: {

          year,

          month,

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          unitId:
            true,

          targetLakhs:
            true,

        },

      }),


      unitId
        ? Promise.resolve(null)
        : prisma.groupRevenueTarget.findUnique({

            where: {

              year_month: {
                year,
                month,
              },

            },

            select: {

              groupTargetLakhs:
                true,

            },

          }),


      prisma.dailyOccupancy.findMany({

        where: {

          occupancyDate,

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          id:
            true,

          unitId:
            true,

          occupancyDate:
            true,

          occupancyCount:
            true,

          sourceFileName:
            true,

        },

      }),

    ]);


  return buildDashboardSnapshot(
    selectedDate,
    units,
    reports,
    unitTargets,
    groupTarget,
    occupancyRecords,
    unitId
  );
}


// ======================================================
// DASHBOARD DATE RANGE
//
// GET:
// dashboard-range?fromDate=2026-09-01&toDate=2026-09-21
//
// Purpose:
//
// 1. One optimized API call for Daily Range download.
// 2. Month download can use month start/end.
// 3. Year download can use Jan 1 / Dec 31.
// 4. Avoids calling exact-date dashboard API hundreds of times.
//
// Only dates having Revenue and/or mapped next-day
// Occupancy data are returned. Targets are attached
// month-wise.
//
// Maximum supported range = 366 calendar days.
// ======================================================

export async function getDashboardRange(
  startDate: Date,
  endDate: Date,
  unitId?: number
) {

  if (
    startDate.getTime() >
    endDate.getTime()
  ) {

    throw new Error(
      "fromDate cannot be after toDate"
    );

  }


  const millisecondsPerDay =
    24 *
    60 *
    60 *
    1000;


  const totalCalendarDays =
    Math.floor(
      (
        endDate.getTime() -
        startDate.getTime()
      ) /
      millisecondsPerDay
    ) + 1;


  if (
    totalCalendarDays >
    366
  ) {

    throw new Error(
      "Maximum dashboard range is 366 days"
    );

  }


  const endExclusive =
    new Date(
      endDate.getTime()
    );


  endExclusive.setUTCDate(
    endExclusive.getUTCDate() +
      1
  );


  // ====================================================
  // OCCUPANCY RANGE MAPPING
  //
  // Dashboard range D1..D2 must read Occupancy
  // (D1 + 1)..(D2 + 1).
  // ====================================================

  const occupancyStartDate =
    getNextDay(
      startDate
    );


  const occupancyEndExclusive =
    getNextDay(
      endExclusive
    );


  // ====================================================
  // YEARS REQUIRED FOR TARGET LOOKUP
  // ====================================================

  const years =
    new Set<number>();


  for (
    let year =
      startDate.getUTCFullYear();
    year <=
      endDate.getUTCFullYear();
    year++
  ) {

    years.add(
      year
    );

  }


  const yearList =
    Array.from(
      years
    );


  // ====================================================
  // OPTIMIZED RANGE QUERIES
  //
  // All independent queries run in parallel.
  // ====================================================

  const [
    units,
    reports,
    occupancyRecords,
    unitTargets,
    groupTargets,
  ] =
    await Promise.all([


      prisma.unit.findMany({

        where: buildActiveUnitWhere(unitId),

        select: {

          id:
            true,

          code:
            true,

          name:
            true,

        },

      }),


      prisma.revenueImport.findMany({

        where: {

          businessDate: {

            gte:
              startDate,

            lt:
              endExclusive,

          },

          status:
            "COMPLETED",

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          id:
            true,

          unitId:
            true,

          reportType:
            true,

          businessDate:
            true,

          fromDate:
            true,

          toDate:
            true,

          fileName:
            true,

          totalNetAmount:
            true,

          totalNetAmountLakhs:
            true,

        },

        orderBy: [
          {
            businessDate:
              "asc",
          },
          {
            unitId:
              "asc",
          },
          {
            reportType:
              "asc",
          },
        ],

      }),


      prisma.dailyOccupancy.findMany({

        where: {

          occupancyDate: {

            gte:
              occupancyStartDate,

            lt:
              occupancyEndExclusive,

          },

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          id:
            true,

          unitId:
            true,

          occupancyDate:
            true,

          occupancyCount:
            true,

          sourceFileName:
            true,

        },

        orderBy: [
          {
            occupancyDate:
              "asc",
          },
          {
            unitId:
              "asc",
          },
        ],

      }),


      prisma.revenueTarget.findMany({

        where: {

          year: {
            in:
              yearList,
          },

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          unitId:
            true,

          year:
            true,

          month:
            true,

          targetLakhs:
            true,

        },

      }),


      unitId
        ? Promise.resolve([])
        : prisma.groupRevenueTarget.findMany({

            where: {

              year: {
                in:
                  yearList,
              },

            },

            select: {

              year:
                true,

              month:
                true,

              groupTargetLakhs:
                true,

            },

          }),

    ]);


  // ====================================================
  // GROUP REPORTS BY DATE
  // ====================================================

  const reportsByDate =
    new Map<
      string,
      any[]
    >();


  const availableDates =
    new Set<string>();


  for (
    const report
    of reports
  ) {

    const dateKey =
      formatDate(
        report.businessDate
      );


    availableDates.add(
      dateKey
    );


    if (
      !reportsByDate.has(
        dateKey
      )
    ) {

      reportsByDate.set(
        dateKey,
        []
      );

    }


    reportsByDate
      .get(
        dateKey
      )!
      .push(
        report
      );

  }


  // ====================================================
  // GROUP OCCUPANCY BY DATE
  // ====================================================

  const occupancyByDate =
    new Map<
      string,
      any[]
    >();


  for (
    const occupancy
    of occupancyRecords
  ) {

    const dashboardDate =
      getPreviousDay(
        occupancy.occupancyDate
      );


    const dateKey =
      formatDate(
        dashboardDate
      );


    availableDates.add(
      dateKey
    );


    if (
      !occupancyByDate.has(
        dateKey
      )
    ) {

      occupancyByDate.set(
        dateKey,
        []
      );

    }


    occupancyByDate
      .get(
        dateKey
      )!
      .push(
        occupancy
      );

  }


  // ====================================================
  // GROUP UNIT TARGETS BY YEAR-MONTH
  // ====================================================

  const targetsByMonth =
    new Map<
      string,
      any[]
    >();


  for (
    const target
    of unitTargets
  ) {

    const monthKey =
      `${target.year}-${target.month}`;


    if (
      !targetsByMonth.has(
        monthKey
      )
    ) {

      targetsByMonth.set(
        monthKey,
        []
      );

    }


    targetsByMonth
      .get(
        monthKey
      )!
      .push(
        target
      );

  }


  // ====================================================
  // GROUP TARGET MAP
  // ====================================================

  const groupTargetByMonth =
    new Map<
      string,
      any
    >();


  for (
    const target
    of groupTargets
  ) {

    groupTargetByMonth.set(
      `${target.year}-${target.month}`,
      target
    );

  }


  // ====================================================
  // BUILD SNAPSHOT FOR EVERY AVAILABLE DATE
  // ====================================================

  const sortedAvailableDates =
    Array
      .from(
        availableDates
      )
      .sort();


  const days =
    sortedAvailableDates.map(
      (
        dateKey
      ) => {

        const [
          yearText,
          monthText,
          dayText,
        ] =
          dateKey.split(
            "-"
          );


        const date =
          new Date(
            Date.UTC(
              Number(
                yearText
              ),
              Number(
                monthText
              ) - 1,
              Number(
                dayText
              )
            )
          );


        const monthKey =
          `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;


        const snapshot =
          buildDashboardSnapshot(
            date,
            units,
            reportsByDate.get(
              dateKey
            ) ?? [],
            targetsByMonth.get(
              monthKey
            ) ?? [],
            groupTargetByMonth.get(
              monthKey
            ) ?? null,
            occupancyByDate.get(
              dateKey
            ) ?? [],
            unitId
          );


        return {

          date:
            dateKey,

          ...snapshot,

        };

      }
    );


  // ====================================================
  // RETURN RANGE DATA
  // ====================================================

  return {

    filters: {

      fromDate:
        formatDate(
          startDate
        ),

      toDate:
        formatDate(
          endDate
        ),

      totalCalendarDays,

      availableDatesCount:
        sortedAvailableDates.length,

    },


    availableDates:
      sortedAvailableDates,


    days,

  };
}


// ======================================================
// MONTHLY RAW HISTORY
//
// Existing API retained.
//
// GET:
// monthly?year=2026&month=9
// ======================================================

export async function getMonthlyReports(
  year: number,
  month: number,
  unitId?: number
) {

  const startDate =
    getMonthStart(
      year,
      month
    );


  const endDate =
    getNextMonthStart(
      year,
      month
    );


  const reports =
    await prisma.revenueImport.findMany({

      where: {

        businessDate: {

          gte:
            startDate,

          lt:
            endDate,

        },

        unit: buildActiveUnitWhere(unitId),

      },

      select: {

        id:
          true,

        unitId:
          true,

        reportType:
          true,

        businessDate:
          true,

        fromDate:
          true,

        toDate:
          true,

        fileName:
          true,

        totalNetAmount:
          true,

        totalNetAmountLakhs:
          true,

        status:
          true,

        unit: {

          select: {

            code:
              true,

            name:
              true,

          },

        },

      },

      orderBy: [

        {
          businessDate:
            "asc",
        },

        {
          unitId:
            "asc",
        },

        {
          reportType:
            "asc",
        },

      ],

    });


  const unitMap =
    new Map<
      string,
      {
        unitCode: string;
        unitName: string;
        reports: any[];
      }
    >();


  for (
    const report
    of reports
  ) {

    if (
      !unitMap.has(
        report.unit.code
      )
    ) {

      unitMap.set(
        report.unit.code,
        {

          unitCode:
            report.unit.code,

          unitName:
            report.unit.name,

          reports:
            [],

        }
      );

    }


    unitMap
      .get(
        report.unit.code
      )!
      .reports
      .push({

        importId:
          report.id,

        reportType:
          report.reportType,

        businessDate:
          report.businessDate,

        fromDate:
          report.fromDate,

        toDate:
          report.toDate,

        fileName:
          report.fileName,

        totalNetAmount:
          Number(
            report.totalNetAmount
          ),

        totalNetAmountLakhs:
          Number(
            report.totalNetAmountLakhs
          ),

        status:
          report.status,

      });

  }


  const availableDates =
    Array
      .from(
        new Set(
          reports.map(
            (report) =>
              formatDate(
                report.businessDate
              )
          )
        )
      )
      .sort();


  return {

    year,

    month,

    monthName:
      MONTH_NAMES[
        month - 1
      ],

    totalFiles:
      reports.length,

    availableDates,

    latestAvailableDate:
      availableDates.length > 0
        ? availableDates[
            availableDates.length - 1
          ]
        : null,

    units:
      Array
        .from(
          unitMap.values()
        )
        .sort(
          (a, b) =>

            UNIT_ORDER.indexOf(
              a.unitCode
            ) -

            UNIT_ORDER.indexOf(
              b.unitCode
            )
        ),

  };
}


// ======================================================
// YEARLY RAW HISTORY
//
// Existing API retained.
//
// GET:
// yearly?year=2026
// ======================================================

export async function getYearlyReports(
  year: number,
  unitId?: number
) {

  const startDate =
    getYearStart(
      year
    );


  const endDate =
    getNextYearStart(
      year
    );


  const reports =
    await prisma.revenueImport.findMany({

      where: {

        businessDate: {

          gte:
            startDate,

          lt:
            endDate,

        },

        unit: buildActiveUnitWhere(unitId),

      },

      select: {

        id:
          true,

        unitId:
          true,

        reportType:
          true,

        businessDate:
          true,

        fromDate:
          true,

        toDate:
          true,

        fileName:
          true,

        totalNetAmount:
          true,

        totalNetAmountLakhs:
          true,

        status:
          true,

        unit: {

          select: {

            code:
              true,

            name:
              true,

          },

        },

      },

      orderBy: {
        businessDate:
          "asc",
      },

    });


  const months =
    MONTH_NAMES.map(
      (
        monthName,
        index
      ) => ({

        month:
          index + 1,

        monthName,

        totalFiles:
          0,

        availableDates:
          [] as string[],

        latestAvailableDate:
          null as string | null,

        units:
          [] as any[],

      })
    );


  for (
    let monthIndex = 0;
    monthIndex < 12;
    monthIndex++
  ) {

    const monthReports =
      reports.filter(
        (report) =>

          report.businessDate
            .getUTCMonth() ===
          monthIndex
      );


    const availableDates =
      Array
        .from(
          new Set(
            monthReports.map(
              (report) =>
                formatDate(
                  report.businessDate
                )
            )
          )
        )
        .sort();


    const unitMap =
      new Map<
        string,
        {
          unitCode: string;
          unitName: string;
          reports: any[];
        }
      >();


    for (
      const report
      of monthReports
    ) {

      if (
        !unitMap.has(
          report.unit.code
        )
      ) {

        unitMap.set(
          report.unit.code,
          {

            unitCode:
              report.unit.code,

            unitName:
              report.unit.name,

            reports:
              [],

          }
        );

      }


      unitMap
        .get(
          report.unit.code
        )!
        .reports
        .push({

          importId:
            report.id,

          reportType:
            report.reportType,

          businessDate:
            report.businessDate,

          fromDate:
            report.fromDate,

          toDate:
            report.toDate,

          fileName:
            report.fileName,

          totalNetAmount:
            Number(
              report.totalNetAmount
            ),

          totalNetAmountLakhs:
            Number(
              report.totalNetAmountLakhs
            ),

          status:
            report.status,

        });

    }


    months[
      monthIndex
    ].totalFiles =
      monthReports.length;


    months[
      monthIndex
    ].availableDates =
      availableDates;


    months[
      monthIndex
    ].latestAvailableDate =
      availableDates.length > 0
        ? availableDates[
            availableDates.length - 1
          ]
        : null;


    months[
      monthIndex
    ].units =
      Array
        .from(
          unitMap.values()
        )
        .sort(
          (a, b) =>

            UNIT_ORDER.indexOf(
              a.unitCode
            ) -

            UNIT_ORDER.indexOf(
              b.unitCode
            )
        );

  }


  return {

    year,

    totalFiles:
      reports.length,

    months,

  };
}


// ======================================================
// MONTHLY FINAL SUMMARY
//
// Example:
// August 2026
//
// Finds latest stored Revenue Date.
//
// If latest date = 31-08-2026:
//
// Final dashboard is built for 31-08-2026.
//
// No manual date selection required.
// ======================================================

export async function getMonthlyFinalSummary(
  year: number,
  month: number,
  unitId?: number
) {

  const startDate =
    getMonthStart(
      year,
      month
    );


  const endDate =
    getNextMonthStart(
      year,
      month
    );


  // ====================================================
  // FIND LATEST AVAILABLE REVENUE DATE
  //
  // Uses indexed businessDate.
  // ====================================================

  const latestRevenue =
    await prisma.revenueImport.findFirst({

      where: {

        businessDate: {

          gte:
            startDate,

          lt:
            endDate,

        },

        status:
          "COMPLETED",

        unit: buildActiveUnitWhere(unitId),

      },

      orderBy: {

        businessDate:
          "desc",

      },

      select: {

        businessDate:
          true,

      },

    });


  // ====================================================
  // NO REVENUE DATA IN MONTH
  // ====================================================

  if (
    !latestRevenue
  ) {

    const [
      units,
      unitTargets,
      groupTarget,
    ] =
      await Promise.all([

        prisma.unit.findMany({

          where: buildActiveUnitWhere(unitId),

          select: {

            id:
              true,

            code:
              true,

            name:
              true,

          },

        }),


        prisma.revenueTarget.findMany({

          where: {

            year,

            month,

            unit: buildActiveUnitWhere(unitId),

          },

          select: {

            unitId:
              true,

            targetLakhs:
              true,

          },

        }),


        unitId
          ? Promise.resolve(null)
          : prisma.groupRevenueTarget.findUnique({

              where: {

                year_month: {
                  year,
                  month,
                },

              },

              select: {

                groupTargetLakhs:
                  true,

              },

            }),

      ]);


    const targetMap =
      new Map<
        number,
        any
      >();


    for (
      const target
      of unitTargets
    ) {

      targetMap.set(
        target.unitId,
        target
      );

    }


    const sortedUnits =
      sortUnits(
        units
      );


    const unitRows =
      sortedUnits.map(
        (unit) => {

          const target =
            targetMap.get(
              unit.id
            );


          const targetLakhs =
            target
              ? Number(
                  target.targetLakhs
                )
              : 0;


          return {

            unitId:
              unit.id,

            unitCode:
              unit.code,

            unitName:
              unit.name,

            FTD:
              null,

            MTD:
              null,

            LMTD:
              null,

            TGT: {

              valueLakhs:
                round2(
                  targetLakhs
                ),

              available:
                Boolean(
                  target
                ),

            },

            PROJ: {

              valueLakhs:
                0,

            },

            CURR_OCC: {

              value:
                0,

              available:
                false,

            },

            GAP: {

              valueLakhs:
                round2(
                  0 -
                  targetLakhs
                ),

            },

          };

        }
      );


    const unitTargetSum =
      unitRows.reduce(
        (
          total,
          unit
        ) =>
          total +
          unit.TGT.valueLakhs,
        0
      );


    const grandTarget =
      unitId
        ? unitTargetSum
        : groupTarget
          ? Number(
              groupTarget.groupTargetLakhs
            )
          : 0;


    return {

      summaryType:
        "MONTHLY_FINAL",

      hasData:
        false,

      year,

      month,

      monthName:
        MONTH_NAMES[
          month - 1
        ],

      asOfDate:
        null,

      grandTotal: {

        FTD:
          0,

        MTD:
          0,

        LMTD:
          0,

        TGT:
          round2(
            grandTarget
          ),

        PROJ:
          0,

        CURR_OCC:
          0,

        unitTargetSum:
          round2(
            unitTargetSum
          ),

        groupTargetAvailable:
          unitId
            ? unitRows.some(
                (unit) =>
                  unit.TGT.available
              )
            : Boolean(
                groupTarget
              ),

        GAP:
          round2(
            0 -
            grandTarget
          ),

      },

      units:
        unitRows,

    };

  }


  // ====================================================
  // BUILD FINAL DASHBOARD USING LATEST DATE
  // ====================================================

  const dashboard =
    await getRevenueDashboard(
      latestRevenue.businessDate,
      unitId
    );


  return {

    summaryType:
      "MONTHLY_FINAL",

    hasData:
      true,

    year,

    month,

    monthName:
      MONTH_NAMES[
        month - 1
      ],

    asOfDate:
      formatDate(
        latestRevenue.businessDate
      ),

    ...dashboard,

  };
}


// ======================================================
// YEARLY 12-MONTH FINAL SUMMARY
//
// Performance:
//
// Step 1:
// Load only distinct available dates.
//
// Step 2:
// Pick latest date of each month.
//
// Step 3:
// Load revenue only for those max 12 dates.
//
// This avoids loading full daily revenue rows.
// ======================================================

export async function getYearlyFinalSummary(
  year: number,
  unitId?: number
) {

  const startDate =
    getYearStart(
      year
    );


  const endDate =
    getNextYearStart(
      year
    );


  // ====================================================
  // INITIAL LIGHTWEIGHT QUERIES
  // ====================================================

  const [
    units,
    availableRevenueDates,
    yearTargets,
    yearGroupTargets,
  ] =
    await Promise.all([


      prisma.unit.findMany({

        where: buildActiveUnitWhere(unitId),

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
      // DISTINCT DAILY DATES ONLY
      // ===============================================

      prisma.revenueImport.findMany({

        where: {

          businessDate: {

            gte:
              startDate,

            lt:
              endDate,

          },

          status:
            "COMPLETED",

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          businessDate:
            true,

        },

        distinct: [
          "businessDate",
        ],

        orderBy: {

          businessDate:
            "asc",

        },

      }),


      // ===============================================
      // FULL YEAR UNIT TARGETS
      // ===============================================

      prisma.revenueTarget.findMany({

        where: {

          year,

          unit: buildActiveUnitWhere(unitId),

        },

        select: {

          unitId:
            true,

          month:
            true,

          targetLakhs:
            true,

        },

      }),


      // ===============================================
      // FULL YEAR GROUP TARGETS
      // ===============================================

      unitId
        ? Promise.resolve([])
        : prisma.groupRevenueTarget.findMany({

            where: {
              year,
            },

            select: {

              month:
                true,

              groupTargetLakhs:
                true,

            },

          }),

    ]);


  // ====================================================
  // FIND LATEST DATE FOR EACH MONTH
  // ====================================================

  const latestDateByMonth =
    new Map<
      number,
      Date
    >();


  for (
    const record
    of availableRevenueDates
  ) {

    const month =
      record.businessDate
        .getUTCMonth() + 1;


    latestDateByMonth.set(
      month,
      record.businessDate
    );

  }


  const selectedDates =
    Array
      .from(
        latestDateByMonth.values()
      );


  const selectedOccupancyDates =
    selectedDates.map(
      (
        date
      ) =>
        getNextDay(
          date
        )
    );


  // ====================================================
  // LOAD ONLY FINAL DATES
  //
  // Maximum:
  // 12 dates × 7 units × 3 reports
  // ====================================================

  const [
    finalRevenueReports,
    finalOccupancyRecords,
  ] =
    selectedDates.length > 0

      ? await Promise.all([


          prisma.revenueImport.findMany({

            where: {

              businessDate: {

                in:
                  selectedDates,

              },

              status:
                "COMPLETED",

              unit: buildActiveUnitWhere(unitId),

            },

            select: {

              id:
                true,

              unitId:
                true,

              reportType:
                true,

              businessDate:
                true,

              fromDate:
                true,

              toDate:
                true,

              fileName:
                true,

              totalNetAmount:
                true,

              totalNetAmountLakhs:
                true,

            },

          }),


          prisma.dailyOccupancy.findMany({

            where: {

              occupancyDate: {

                in:
                  selectedOccupancyDates,

              },

              unit: buildActiveUnitWhere(unitId),

            },

            select: {

              id:
                true,

              unitId:
                true,

              occupancyDate:
                true,

              occupancyCount:
                true,

              sourceFileName:
                true,

            },

          }),

        ])

      : [
          [],
          [],
        ];


  // ====================================================
  // GROUP REVENUE BY DATE
  // ====================================================

  const revenueByDate =
    new Map<
      string,
      any[]
    >();


  for (
    const report
    of finalRevenueReports
  ) {

    const key =
      formatDate(
        report.businessDate
      );


    if (
      !revenueByDate.has(
        key
      )
    ) {

      revenueByDate.set(
        key,
        []
      );

    }


    revenueByDate
      .get(
        key
      )!
      .push(
        report
      );

  }


  // ====================================================
  // GROUP OCCUPANCY BY DATE
  // ====================================================

  const occupancyByDate =
    new Map<
      string,
      any[]
    >();


  for (
    const occupancy
    of finalOccupancyRecords
  ) {

    const dashboardDate =
      getPreviousDay(
        occupancy.occupancyDate
      );


    const key =
      formatDate(
        dashboardDate
      );


    if (
      !occupancyByDate.has(
        key
      )
    ) {

      occupancyByDate.set(
        key,
        []
      );

    }


    occupancyByDate
      .get(
        key
      )!
      .push(
        occupancy
      );

  }


  // ====================================================
  // BUILD ALL 12 MONTHS
  // ====================================================

  const months =
    [];


  for (
    let month = 1;
    month <= 12;
    month++
  ) {

    const latestDate =
      latestDateByMonth.get(
        month
      );


    const monthTargets =
      yearTargets.filter(
        (target) =>
          target.month ===
          month
      );


    const groupTarget =
      yearGroupTargets.find(
        (target) =>
          target.month ===
          month
      );


    // ==================================================
    // NO REVENUE DATA
    // ==================================================

    if (
      !latestDate
    ) {

      const targetMap =
        new Map<
          number,
          any
        >();


      for (
        const target
        of monthTargets
      ) {

        targetMap.set(
          target.unitId,
          target
        );

      }


      const compactUnits =
        sortUnits(
          units
        )
          .map(
            (unit) => {

              const target =
                targetMap.get(
                  unit.id
                );


              const targetLakhs =
                target
                  ? Number(
                      target.targetLakhs
                    )
                  : 0;


              return {

                unitId:
                  unit.id,

                unitCode:
                  unit.code,

                unitName:
                  unit.name,

                FTD:
                  0,

                MTD:
                  0,

                LMTD:
                  0,

                TGT:
                  round2(
                    targetLakhs
                  ),

                PROJ:
                  0,

                CURR_OCC:
                  0,

                GAP:
                  round2(
                    0 -
                    targetLakhs
                  ),

              };

            }
          );


      const unitTargetSum =
        compactUnits.reduce(
          (
            total,
            unit
          ) =>
            total +
            unit.TGT,
          0
        );


      const grandTarget =
        unitId
          ? unitTargetSum
          : groupTarget
            ? Number(
                groupTarget.groupTargetLakhs
              )
            : 0;


      months.push({

        month,

        monthName:
          MONTH_NAMES[
            month - 1
          ],

        hasData:
          false,

        asOfDate:
          null,

        grandTotal: {

          FTD:
            0,

          MTD:
            0,

          LMTD:
            0,

          TGT:
            round2(
              grandTarget
            ),

          PROJ:
            0,

          CURR_OCC:
            0,

          unitTargetSum:
            round2(
              unitTargetSum
            ),

          GAP:
            round2(
              0 -
              grandTarget
            ),

        },

        units:
          compactUnits,

      });


      continue;

    }


    // ==================================================
    // MONTH HAS DATA
    // ==================================================

    const dateKey =
      formatDate(
        latestDate
      );


    const reports =
      revenueByDate.get(
        dateKey
      ) ??
      [];


    const occupancy =
      occupancyByDate.get(
        dateKey
      ) ??
      [];


    const snapshot =
      buildDashboardSnapshot(
        latestDate,
        units,
        reports,
        monthTargets,
        groupTarget,
        occupancy,
        unitId
      );


    // ==================================================
    // YEARLY RESPONSE STAYS COMPACT
    // ==================================================

    const compactUnits =
      snapshot.units.map(
        (unit) => ({

          unitId:
            unit.unitId,

          unitCode:
            unit.unitCode,

          unitName:
            unit.unitName,

          FTD:
            unit.FTD
              ?.valueLakhs ??
            0,

          MTD:
            unit.MTD
              ?.valueLakhs ??
            0,

          LMTD:
            unit.LMTD
              ?.valueLakhs ??
            0,

          TGT:
            unit.TGT
              .valueLakhs,

          PROJ:
            unit.PROJ
              .valueLakhs,

          CURR_OCC:
            unit.CURR_OCC
              .value,

          GAP:
            unit.GAP
              .valueLakhs,

        })
      );


    months.push({

      month,

      monthName:
        MONTH_NAMES[
          month - 1
        ],

      hasData:
        true,

      asOfDate:
        dateKey,

      grandTotal:
        snapshot.grandTotal,

      units:
        compactUnits,

    });

  }


  // ====================================================
  // FINAL YEAR RESPONSE
  // ====================================================

  return {

    year,

    totalMonths:
      12,

    monthsWithData:
      months.filter(
        (month) =>
          month.hasData
      )
        .length,

    monthsWithoutData:
      months.filter(
        (month) =>
          !month.hasData
      )
        .length,

    months,

  };
}