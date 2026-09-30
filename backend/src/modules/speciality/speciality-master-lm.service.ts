import * as XLSX
  from "xlsx";

import {
  prisma,
} from "../../config/database.ts";


// ======================================================
// SUPPORTED MASTER LM TARGET
//
// Requirement:
// - Master Excel is used ONLY for September 2026.
// - September LM source date = 31/08/2026.
// - October onward continues with the normal LM CSV flow.
// ======================================================

const MASTER_LM_TARGET_MONTH =
  "2026-09";


const MASTER_UNIT_CODES = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
] as const;


type MasterUnitCode =
  (
    typeof MASTER_UNIT_CODES
  )[number];


type MasterLmRow = {

  revenueOn:
    string;

  totalNetAmount:
    number;

};


type ParsedUnitSheet = {

  unitCode:
    MasterUnitCode;

  rows:
    MasterLmRow[];

  totalNetAmount:
    number;

};


// ======================================================
// NORMALIZE TEXT
// ======================================================

function normalizeText(
  value:
    unknown
): string {

  return String(
    value ??
    ""
  )
    .replace(
      /\uFEFF/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


// ======================================================
// NORMALIZE HEADER
// ======================================================

function normalizeHeader(
  value:
    unknown
): string {

  return normalizeText(
    value
  )
    .toUpperCase();

}


// ======================================================
// MONEY
// ======================================================

function parseMoney(
  value:
    unknown
): number {

  if (
    typeof value ===
      "number"
  ) {

    if (
      Number.isFinite(
        value
      )
    ) {

      return value;

    }

    return 0;

  }


  let text =
    normalizeText(
      value
    );


  if (
    !text
  ) {

    return 0;

  }


  let negative =
    false;


  if (
    text.startsWith(
      "("
    ) &&
    text.endsWith(
      ")"
    )
  ) {

    negative =
      true;

    text =
      text.slice(
        1,
        -1
      );

  }


  text =
    text
      .replace(
        /₹/g,
        ""
      )
      .replace(
        /,/g,
        ""
      )
      .replace(
        /\s+/g,
        ""
      );


  const amount =
    Number(
      text
    );


  if (
    !Number.isFinite(
      amount
    )
  ) {

    throw new Error(
      `Invalid LM amount: ${String(
        value
      )}`
    );

  }


  return negative
    ? -amount
    : amount;

}


// ======================================================
// ROUND 2
// ======================================================

function round2(
  value:
    number
): number {

  return Math.round(
    (
      value +
      Number.EPSILON
    ) *
    100
  ) /
  100;

}


// ======================================================
// TARGET MONTH
// ======================================================

function validateTargetMonth(
  targetMonth:
    string
) {

  if (
    targetMonth !==
      MASTER_LM_TARGET_MONTH
  ) {

    throw new Error(
      "Master LM Excel upload is allowed only for September 2026."
    );

  }

}


// ======================================================
// SOURCE PERIOD
//
// Target: September 2026
// Source: August 2026
// ======================================================

function getSourcePeriod(
  targetMonth:
    string
) {

  const match =
    /^(\d{4})-(\d{2})$/
      .exec(
        targetMonth
      );


  if (
    !match
  ) {

    throw new Error(
      "targetMonth must be in YYYY-MM format"
    );

  }


  const targetYear =
    Number(
      match[1]
    );


  const targetMonthNumber =
    Number(
      match[2]
    );


  const sourceMonthDate =
    new Date(
      Date.UTC(
        targetYear,
        targetMonthNumber -
          2,
        1
      )
    );


  const sourceYear =
    sourceMonthDate
      .getUTCFullYear();


  const sourceMonthNumber =
    sourceMonthDate
      .getUTCMonth() +
    1;


  const sourceFromDate =
    new Date(
      Date.UTC(
        sourceYear,
        sourceMonthNumber -
          1,
        1
      )
    );


  const sourceToDate =
    new Date(
      Date.UTC(
        sourceYear,
        sourceMonthNumber,
        0
      )
    );


  return {

    sourceYear,

    sourceMonth:
      sourceMonthNumber,

    sourceFromDate,

    sourceToDate,

    businessDate:
      sourceToDate,

  };

}


// ======================================================
// FIND WORKSHEET
// ======================================================

function findWorksheet(
  workbook:
    XLSX.WorkBook,
  unitCode:
    MasterUnitCode
): XLSX.WorkSheet {

  const sheetName =
    workbook.SheetNames.find(
      (
        name
      ) =>
        normalizeHeader(
          name
        ) ===
        unitCode
    );


  if (
    !sheetName
  ) {

    throw new Error(
      `Sheet ${unitCode} is missing from Master LM Excel.`
    );

  }


  const worksheet =
    workbook.Sheets[
      sheetName
    ];


  if (
    !worksheet
  ) {

    throw new Error(
      `Sheet ${unitCode} could not be read.`
    );

  }


  return worksheet;

}


// ======================================================
// PARSE ONE UNIT SHEET
//
// Expected Master layout:
// Row 1 may contain Date / Unit.
// Header row contains:
// Department (or DEPARTMENT NAME) + LM.
//
// Only Department + LM are used.
// FTD / MTD / LMTD / Projected / Variation are ignored.
// ======================================================

function parseUnitSheet(
  workbook:
    XLSX.WorkBook,
  unitCode:
    MasterUnitCode
): ParsedUnitSheet {

  const worksheet =
    findWorksheet(
      workbook,
      unitCode
    );


  const matrix =
    XLSX.utils
      .sheet_to_json<unknown[]>(
        worksheet,
        {

          header:
            1,

          raw:
            true,

          defval:
            null,

          blankrows:
            false,

        }
      );


  if (
    matrix.length ===
      0
  ) {

    throw new Error(
      `Sheet ${unitCode} is empty.`
    );

  }


  let headerRowIndex =
    -1;


  let departmentIndex =
    -1;


  let lmIndex =
    -1;


  for (
    let rowIndex = 0;
    rowIndex <
      matrix.length;
    rowIndex +=
      1
  ) {

    const row =
      matrix[
        rowIndex
      ];


    const headers =
      row.map(
        (
          value
        ) =>
          normalizeHeader(
            value
          )
      );


    const possibleDepartmentIndex =
      headers.findIndex(
        (
          header
        ) =>
          header ===
            "DEPARTMENT" ||
          header ===
            "DEPARTMENT NAME" ||
          header ===
            "SPECIALITY" ||
          header ===
            "SPECIALTY"
      );


    const possibleLmIndex =
      headers.findIndex(
        (
          header
        ) =>
          header ===
            "LM"
      );


    if (
      possibleDepartmentIndex >=
        0 &&
      possibleLmIndex >=
        0
    ) {

      headerRowIndex =
        rowIndex;

      departmentIndex =
        possibleDepartmentIndex;

      lmIndex =
        possibleLmIndex;

      break;

    }

  }


  if (
    headerRowIndex <
      0 ||
    departmentIndex <
      0 ||
    lmIndex <
      0
  ) {

    throw new Error(
      `Sheet ${unitCode} must contain Department and LM columns.`
    );

  }


  const amountByDepartment =
    new Map<
      string,
      number
    >();


  for (
    let rowIndex =
      headerRowIndex +
      1;
    rowIndex <
      matrix.length;
    rowIndex +=
      1
  ) {

    const row =
      matrix[
        rowIndex
      ];


    const department =
      normalizeText(
        row[
          departmentIndex
        ]
      );


    if (
      !department
    ) {

      continue;

    }


    const normalizedDepartment =
      normalizeHeader(
        department
      );


    if (
      normalizedDepartment ===
        "TOTAL" ||
      normalizedDepartment ===
        "GRAND TOTAL"
    ) {

      continue;

    }


    const amount =
      round2(
        parseMoney(
          row[
            lmIndex
          ]
        )
      );


    amountByDepartment.set(
      department,
      round2(
        (
          amountByDepartment.get(
            department
          ) ??
          0
        ) +
        amount
      )
    );

  }


  const rows:
    MasterLmRow[] =
      Array
        .from(
          amountByDepartment
            .entries()
        )
        .map(
          (
            [
              revenueOn,
              totalNetAmount,
            ]
          ) => ({

            revenueOn,

            totalNetAmount:
              round2(
                totalNetAmount
              ),

          })
        );


  if (
    rows.length ===
      0
  ) {

    throw new Error(
      `Sheet ${unitCode} has no Department + LM data.`
    );

  }


  const totalNetAmount =
    round2(
      rows.reduce(
        (
          total,
          row
        ) =>
          total +
          row.totalNetAmount,
        0
      )
    );


  return {

    unitCode,

    rows,

    totalNetAmount,

  };

}


// ======================================================
// SAVE MASTER LM EXCEL
//
// IMPORTANT:
// Revenue Report dashboard is not changed.
// This creates/replaces reportType = LM only.
//
// Current Revenue Report uses FTD / MTD / LMTD.
// Speciality Revenue reads LM from previous month-end.
// ======================================================

export async function saveSpecialityMasterLmExcel(
  file:
    Express.Multer.File,
  targetMonth:
    string
) {

  validateTargetMonth(
    targetMonth
  );


  if (
    !file?.buffer ||
    file.buffer.length ===
      0
  ) {

    throw new Error(
      "Master LM Excel file is required."
    );

  }


  const workbook =
    XLSX.read(
      file.buffer,
      {

        type:
          "buffer",

      }
    );


  const parsedSheets =
    MASTER_UNIT_CODES.map(
      (
        unitCode
      ) =>
        parseUnitSheet(
          workbook,
          unitCode
        )
    );


  const sourcePeriod =
    getSourcePeriod(
      targetMonth
    );


  const units =
    await prisma.unit.findMany({

      where: {

        code: {
          in:
            [
              ...MASTER_UNIT_CODES,
            ],
        },

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

    });


  const unitByCode =
    new Map(
      units.map(
        (
          unit
        ) => [

          unit.code,

          unit,

        ]
      )
    );


  for (
    const unitCode of
    MASTER_UNIT_CODES
  ) {

    if (
      !unitByCode.has(
        unitCode
      )
    ) {

      throw new Error(
        `Active unit ${unitCode} was not found in database.`
      );

    }

  }


  const results =
    await prisma.$transaction(
      async (
        tx
      ) => {

        const savedUnits:
          Array<{

            unitCode:
              string;

            unitName:
              string;

            departmentCount:
              number;

            totalLM:
              number;

            importId:
              number;

          }> = [];


        for (
          const parsed of
          parsedSheets
        ) {

          const unit =
            unitByCode.get(
              parsed.unitCode
            )!;


          const revenueImport =
            await tx.revenueImport.upsert({

              where: {

                unitId_reportType_businessDate: {

                  unitId:
                    unit.id,

                  reportType:
                    "LM",

                  businessDate:
                    sourcePeriod.businessDate,

                },

              },


              update: {

                fromDate:
                  sourcePeriod.sourceFromDate,

                toDate:
                  sourcePeriod.sourceToDate,

                fileName:
                  file.originalname,

                totalNetAmount:
                  parsed
                    .totalNetAmount
                    .toFixed(
                      2
                    ),

                totalNetAmountLakhs:
                  (
                    parsed.totalNetAmount /
                    100000
                  )
                    .toFixed(
                      6
                    ),

                status:
                  "COMPLETED",

                errorMessage:
                  null,

                rawData: {

                  source:
                    "MASTER_DATE_FORMULA",

                  targetMonth,

                  sourceUnitSheet:
                    parsed.unitCode,

                  rowCount:
                    parsed.rows.length,

                },

              },


              create: {

                unitId:
                  unit.id,

                reportType:
                  "LM",

                businessDate:
                  sourcePeriod.businessDate,

                fromDate:
                  sourcePeriod.sourceFromDate,

                toDate:
                  sourcePeriod.sourceToDate,

                fileName:
                  file.originalname,

                totalNetAmount:
                  parsed
                    .totalNetAmount
                    .toFixed(
                      2
                    ),

                totalNetAmountLakhs:
                  (
                    parsed.totalNetAmount /
                    100000
                  )
                    .toFixed(
                      6
                    ),

                status:
                  "COMPLETED",

                errorMessage:
                  null,

                rawData: {

                  source:
                    "MASTER_DATE_FORMULA",

                  targetMonth,

                  sourceUnitSheet:
                    parsed.unitCode,

                  rowCount:
                    parsed.rows.length,

                },

              },

            });


          await tx
            .revenueDepartment
            .deleteMany({

              where: {

                importId:
                  revenueImport.id,

              },

            });


          await tx
            .revenueSummary
            .deleteMany({

              where: {

                importId:
                  revenueImport.id,

              },

            });


          await tx
            .revenueDepartment
            .createMany({

              data:
                parsed.rows.map(
                  (
                    row
                  ) => ({

                    importId:
                      revenueImport.id,

                    revenueOn:
                      row.revenueOn,

                    totalNetAmount:
                      row.totalNetAmount
                        .toFixed(
                          2
                        ),

                  })
                ),

            });


          savedUnits.push({

            unitCode:
              unit.code,

            unitName:
              unit.name,

            departmentCount:
              parsed.rows.length,

            totalLM:
              parsed.totalNetAmount,

            importId:
              revenueImport.id,

          });

        }


        return savedUnits;

      }
    );


  return {

    targetMonth,

    sourceMonth:
      `${sourcePeriod.sourceYear}-${String(
        sourcePeriod.sourceMonth
      ).padStart(
        2,
        "0"
      )}`,

    businessDate:
      sourcePeriod.businessDate
        .toISOString()
        .slice(
          0,
          10
        ),

    fileName:
      file.originalname,

    totalUnits:
      results.length,

    units:
      results,

  };

}
