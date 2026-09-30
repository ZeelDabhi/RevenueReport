import {
  prisma,
} from "../../config/database.ts";


// ======================================================
// TYPES
// ======================================================

export type SpecialityTrendOptions = {
  fromDate:
    Date | string;

  toDate:
    Date | string;

  unitId?:
    number | null;

  unitCode?:
    string | null;
};


type DepartmentRecord = {
  revenueOn:
    string | null;

  totalNetAmount:
    unknown;
};


type TrendAmountRow = {
  speciality:
    string;

  amount:
    bigint;
};


// ======================================================
// SUPPORTED UNITS
// ======================================================

const SUPPORTED_UNIT_CODES = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
] as const;


// ======================================================
// MASTER SPECIALITIES
//
// Keep this aligned with speciality.service.ts.
// Existing dashboard logic is NOT changed.
// ======================================================

const MASTER_SPECIALITIES_BY_UNIT:
  Record<
    string,
    readonly string[]
  > = {

  MB: [
    "Orthopaedics",
    "Uro Surgery",
    "Cardiology",
    "Paediatrics",
    "Medicine",
    "General Surgery",
    "Gynecology",
    "Neuro Surgery",
  ],

  OS: [
    "General Surgery",
    "Paediatrics",
    "Neuro Surgery",
    "Cardiology",
    "Medicine",
    "Obstetrics & Gynaecology",
    "Orthopaedics",
    "Urology",
  ],

  SV: [
    "Neuro Surgery",
    "ENT",
    "Paediatrics",
    "Urology",
    "General Surgery",
    "Orthopaedics",
    "Obstetrics & Gynaecology",
    "Medicine",
  ],

  MS: [
    "Urology",
    "Medicine",
    "ENT",
    "Neuro Surgery",
    "Obstetrics & Gynaecology",
    "Paediatrics",
    "General Surgery",
    "Orthopaedics",
  ],

  BJ: [
    "Urology",
    "Cardiology",
    "Paediatrics",
    "Neuro Surgery",
    "General Surgery",
    "Orthopaedics",
    "Pulmonology",
    "ENT",
    "Medicine",
    "Obstetrics & Gynaecology",
  ],

  JN: [
    "Orthopaedics",
    "Neuro Surgery",
    "General Surgery",
    "Paediatrics",
    "ENT",
    "Urology",
    "Obstetrics & Gynaecology",
    "Medicine",
    "Cardiology",
  ],

  SM: [
    "Surgical Oncology",
    "Radiation Oncology",
    "Medical Oncology",
  ],

};


// ======================================================
// CONFIRMED ALIASES
// ======================================================

const GYNECOLOGY_ALIASES = [
  "Gynecology",
  "Gynaecology",
  "Obstetrics & Gynecology",
  "Obstetrics & Gynaecology",
  "Obstetrics and Gynecology",
  "Obstetrics and Gynaecology",
  "OBG",
  "OBGY",
  "OBGYN",
  "OB-GYN",
  "Gynae",
  "Gynec",
];


const UROLOGY_ALIASES = [
  "Uro Surgery",
  "Urology",
  "Urosurgery",
  "Uro-Surgery",
  "Urology Surgery",
  "Urological Surgery",
];


// ======================================================
// CLEAN DISPLAY NAME
// ======================================================

function cleanDisplayName(
  value:
    string
): string {

  return value
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
// NORMALIZE LOOKUP KEY
// ======================================================

function normalizeLookupKey(
  value:
    string
): string {

  return cleanDisplayName(
    value
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      ""
    );

}


// ======================================================
// ALIAS KEYS
// ======================================================

const GYNECOLOGY_ALIAS_KEYS =
  new Set(
    GYNECOLOGY_ALIASES.map(
      normalizeLookupKey
    )
  );


const UROLOGY_ALIAS_KEYS =
  new Set(
    UROLOGY_ALIASES.map(
      normalizeLookupKey
    )
  );


// ======================================================
// RESOLVE SPECIALITY KEY
// ======================================================

function resolveSpecialityKey(
  value:
    string
): string {

  const normalized =
    normalizeLookupKey(
      value
    );


  if (
    GYNECOLOGY_ALIAS_KEYS.has(
      normalized
    )
  ) {

    return "ALIAS:GYNECOLOGY";

  }


  if (
    UROLOGY_ALIAS_KEYS.has(
      normalized
    )
  ) {

    return "ALIAS:UROLOGY";

  }


  return `RAW:${normalized}`;

}


// ======================================================
// NORMALIZE DATE
// ======================================================

function normalizeDate(
  value:
    Date | string
): Date {

  if (
    value instanceof Date
  ) {

    const result =
      new Date(
        Date.UTC(
          value.getUTCFullYear(),
          value.getUTCMonth(),
          value.getUTCDate()
        )
      );


    if (
      Number.isNaN(
        result.getTime()
      )
    ) {

      throw new Error(
        "Invalid date"
      );

    }


    return result;

  }


  const text =
    String(
      value
    )
      .trim();


  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        text
      );


  if (
    !match
  ) {

    throw new Error(
      "Date must be in YYYY-MM-DD format"
    );

  }


  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );


  const result =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  if (
    result.getUTCFullYear() !==
      year ||
    result.getUTCMonth() !==
      month - 1 ||
    result.getUTCDate() !==
      day
  ) {

    throw new Error(
      "Invalid date"
    );

  }


  return result;

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
  date:
    Date
): string {

  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() +
      1
    )
      .padStart(
        2,
        "0"
      );

  const day =
    String(
      date.getUTCDate()
    )
      .padStart(
        2,
        "0"
      );


  return `${year}-${month}-${day}`;

}


// ======================================================
// MONEY -> PAISE
// ======================================================

function moneyToPaise(
  value:
    unknown
): bigint {

  let text =
    String(
      value ??
      "0"
    )
      .replace(
        /,/g,
        ""
      )
      .trim();


  if (
    !text
  ) {

    return 0n;

  }


  let negative =
    false;


  if (
    text.startsWith(
      "-"
    )
  ) {

    negative =
      true;

    text =
      text.slice(
        1
      );

  }


  if (
    !/^\d+(\.\d+)?$/.test(
      text
    )
  ) {

    return 0n;

  }


  const [
    wholePart,
    decimalPart = "",
  ] =
    text.split(
      "."
    );


  const whole =
    BigInt(
      wholePart ||
      "0"
    );


  const paiseText =
    decimalPart
      .padEnd(
        2,
        "0"
      )
      .slice(
        0,
        2
      );


  let paise =
    whole *
    100n;


  paise +=
    BigInt(
      paiseText ||
      "0"
    );


  return negative
    ? -paise
    : paise;

}


// ======================================================
// PAISE -> NUMBER
// ======================================================

function paiseToNumber(
  value:
    bigint
): number {

  return Number(
    value
  ) /
  100;

}


// ======================================================
// DATE SEQUENCE
// ======================================================

function getDateSequence(
  fromDate:
    Date,
  toDate:
    Date
): Date[] {

  const result:
    Date[] = [];


  const current =
    new Date(
      fromDate
    );


  while (
    current.getTime() <=
    toDate.getTime()
  ) {

    result.push(
      new Date(
        current
      )
    );


    current.setUTCDate(
      current.getUTCDate() +
      1
    );

  }


  return result;

}


// ======================================================
// GET SELECTED UNIT
// ======================================================

async function getSelectedUnit(
  unitId?:
    number | null,
  unitCode?:
    string | null
) {

  if (
    unitId
  ) {

    const unit =
      await prisma.unit.findFirst({

        where: {
          id:
            unitId,

          isActive:
            true,

          code: {
            in: [
              ...SUPPORTED_UNIT_CODES,
            ],
          },
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


    if (
      !unit
    ) {

      throw new Error(
        "Assigned unit is not available"
      );

    }


    return unit;

  }


  if (
    !unitCode
  ) {

    throw new Error(
      "unit is required"
    );

  }


  const normalizedCode =
    unitCode
      .trim()
      .toUpperCase();


  if (
    !SUPPORTED_UNIT_CODES.includes(
      normalizedCode as
        typeof SUPPORTED_UNIT_CODES[number]
    )
  ) {

    throw new Error(
      `Invalid unit code: ${normalizedCode}`
    );

  }


  const unit =
    await prisma.unit.findFirst({

      where: {
        code:
          normalizedCode,

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


  if (
    !unit
  ) {

    throw new Error(
      `Unit not found: ${normalizedCode}`
    );

  }


  return unit;

}


// ======================================================
// CREATE EMPTY SPECIALITY ROWS
// ======================================================

function createRows(
  unitCode:
    string
): {

  rows:
    TrendAmountRow[];

  rowByKey:
    Map<
      string,
      TrendAmountRow
    >;

} {

  const masterSpecialities =
    MASTER_SPECIALITIES_BY_UNIT[
      unitCode
    ] ??
    [];


  const rows:
    TrendAmountRow[] =
      masterSpecialities.map(
        (
          speciality
        ) => ({

          speciality,

          amount:
            0n,

        })
      );


  const rowByKey =
    new Map<
      string,
      TrendAmountRow
    >();


  for (
    const row
    of rows
  ) {

    rowByKey.set(
      resolveSpecialityKey(
        row.speciality
      ),
      row
    );

  }


  return {
    rows,
    rowByKey,
  };

}


// ======================================================
// ADD DEPARTMENT
// ======================================================

function addDepartment(
  rowByKey:
    Map<
      string,
      TrendAmountRow
    >,
  department:
    DepartmentRecord
) {

  const rawSpeciality =
    cleanDisplayName(
      String(
        department.revenueOn ??
        ""
      )
    );


  if (
    !rawSpeciality
  ) {

    return;

  }


  const row =
    rowByKey.get(
      resolveSpecialityKey(
        rawSpeciality
      )
    );


  if (
    !row
  ) {

    return;

  }


  row.amount +=
    moneyToPaise(
      department.totalNetAmount
    );

}


// ======================================================
// SPECIALITY TREND
//
// One DB query for all FTD imports in the selected range.
// Existing speciality dashboard is not modified.
// ======================================================

export async function getSpecialityTrend(
  options:
    SpecialityTrendOptions
) {

  const fromDate =
    normalizeDate(
      options.fromDate
    );


  const toDate =
    normalizeDate(
      options.toDate
    );


  if (
    fromDate.getTime() >
    toDate.getTime()
  ) {

    throw new Error(
      "fromDate cannot be after toDate"
    );

  }


  const rangeDays =
    Math.floor(
      (
        toDate.getTime() -
        fromDate.getTime()
      ) /
      86400000
    ) +
    1;


  if (
    rangeDays >
    62
  ) {

    throw new Error(
      "Trend range cannot exceed 62 days"
    );

  }


  const unit =
    await getSelectedUnit(
      options.unitId,
      options.unitCode
    );


  const imports =
    await prisma.revenueImport.findMany({

      where: {

        unitId:
          unit.id,

        reportType:
          "FTD",

        status:
          "COMPLETED",

        businessDate: {

          gte:
            fromDate,

          lte:
            toDate,

        },

      },

      select: {

        id:
          true,

        businessDate:
          true,

        departments: {

          select: {

            revenueOn:
              true,

            totalNetAmount:
              true,

          },

        },

      },

      orderBy: {

        businessDate:
          "asc",

      },

    });


  const importByDate =
    new Map<
      string,
      typeof imports[number]
    >();


  for (
    const importRecord
    of imports
  ) {

    importByDate.set(
      formatDate(
        importRecord.businessDate
      ),
      importRecord
    );

  }


  const dateSequence =
    getDateSequence(
      fromDate,
      toDate
    );


  const days =
    dateSequence.map(
      (
        date
      ) => {

        const dateText =
          formatDate(
            date
          );


        const importRecord =
          importByDate.get(
            dateText
          );


        const {
          rows,
          rowByKey,
        } =
          createRows(
            unit.code
          );


        if (
          importRecord
        ) {

          for (
            const department
            of importRecord.departments
          ) {

            addDepartment(
              rowByKey,
              department
            );

          }

        }


        let totalFTDPaise =
          0n;


        const specialities =
          rows.map(
            (
              row,
              index
            ) => {

              totalFTDPaise +=
                row.amount;


              return {

                serialNo:
                  index +
                  1,

                speciality:
                  row.speciality,

                FTD:
                  paiseToNumber(
                    row.amount
                  ),

              };

            }
          );


        return {

          date:
            dateText,

          available:
            Boolean(
              importRecord
            ),

          importId:
            importRecord?.id ??
            null,

          totalFTD:
            paiseToNumber(
              totalFTDPaise
            ),

          specialities,

        };

      }
    );


  return {

    mode:
      "SPECIALITY_TREND" as const,

    fromDate:
      formatDate(
        fromDate
      ),

    toDate:
      formatDate(
        toDate
      ),

    rangeDays,

    amountUnit:
      "RUPEES",

    source:
      "FTD",

    masterOnly:
      true,

    aliasMapping:
      true,

    unit: {

      unitId:
        unit.id,

      unitCode:
        unit.code,

      unitName:
        unit.name,

    },

    specialities:
      MASTER_SPECIALITIES_BY_UNIT[
        unit.code
      ] ??
      [],

    daysWithData:
      days.filter(
        (
          day
        ) =>
          day.available
      ).length,

    days,

  };

}
