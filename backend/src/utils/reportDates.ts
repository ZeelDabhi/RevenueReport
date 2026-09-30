// ======================================================
// REPORT TYPES
// ======================================================

export type ReportType =
  | "FTD"
  | "MTD"
  | "LMTD"
  | "LM";


// ======================================================
// NORMALIZE DATE TO UTC
// ======================================================

function normalizeUtcDate(
  input: Date
): Date {

  return new Date(
    Date.UTC(
      input.getUTCFullYear(),
      input.getUTCMonth(),
      input.getUTCDate()
    )
  );

}


// ======================================================
// FORMAT BUSINESS DATE
//
// Output:
// YYYY-MM-DD
// ======================================================

export function formatBusinessDate(
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
// RESOLVE BUSINESS DATE
//
// Input:
// 2026-09-25
//
// Blank:
// Yesterday
// ======================================================

export function resolveBusinessDate(
  value: unknown
): Date {

  if (
    value === undefined ||
    value === null ||
    String(
      value
    ).trim() ===
      ""
  ) {

    const now =
      new Date();

    const yesterday =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      );


    return new Date(
      Date.UTC(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      )
    );

  }


  if (
    value instanceof Date
  ) {

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {

      throw new Error(
        "Invalid business date"
      );

    }


    return normalizeUtcDate(
      value
    );

  }


  const rawValue =
    String(
      value
    ).trim();


  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        rawValue
      );


  if (
    !match
  ) {

    throw new Error(
      "Business date must be in YYYY-MM-DD format"
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


  const businessDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  if (
    businessDate.getUTCFullYear() !==
      year ||
    businessDate.getUTCMonth() !==
      month - 1 ||
    businessDate.getUTCDate() !==
      day
  ) {

    throw new Error(
      "Invalid business date"
    );

  }


  return businessDate;

}


// ======================================================
// DAYS IN MONTH
// ======================================================

function getDaysInMonth(
  year: number,
  monthIndex: number
): number {

  return new Date(
    Date.UTC(
      year,
      monthIndex + 1,
      0
    )
  ).getUTCDate();

}


// ======================================================
// REPORT DATES
//
// DAILY UPLOAD EXAMPLE:
// Selected Business Date = 25-09-2026
//
// FTD:
// 25-09-2026 -> 25-09-2026
//
// MTD:
// 01-09-2026 -> 25-09-2026
//
// LMTD:
// 01-08-2026 -> 25-08-2026
//
// LM UPLOAD EXAMPLE:
// Selected LM Month = August 2026
// LM page sends businessDate = 31-08-2026
//
// LM:
// 01-08-2026 -> 31-08-2026
// ======================================================

export function getReportDates(
  reportType: ReportType,
  selectedBusinessDate: Date
) {

  const businessDate =
    normalizeUtcDate(
      selectedBusinessDate
    );


  const year =
    businessDate
      .getUTCFullYear();

  const monthIndex =
    businessDate
      .getUTCMonth();

  const selectedDay =
    businessDate
      .getUTCDate();


  // ====================================================
  // FTD
  // ====================================================

  if (
    reportType ===
    "FTD"
  ) {

    return {

      businessDate,

      fromDate:
        businessDate,

      toDate:
        businessDate,

    };

  }


  // ====================================================
  // MTD
  // ====================================================

  if (
    reportType ===
    "MTD"
  ) {

    const fromDate =
      new Date(
        Date.UTC(
          year,
          monthIndex,
          1
        )
      );


    return {

      businessDate,

      fromDate,

      toDate:
        businessDate,

    };

  }


  // ====================================================
  // LMTD
  //
  // Previous month, same selected day.
  //
  // 25 Sep -> 01 Aug to 25 Aug
  // ====================================================

  if (
    reportType ===
    "LMTD"
  ) {

    const previousMonthYear =
      monthIndex === 0
        ? year - 1
        : year;

    const previousMonthIndex =
      monthIndex === 0
        ? 11
        : monthIndex - 1;

    const previousMonthDays =
      getDaysInMonth(
        previousMonthYear,
        previousMonthIndex
      );

    const lmtdDay =
      Math.min(
        selectedDay,
        previousMonthDays
      );

    const fromDate =
      new Date(
        Date.UTC(
          previousMonthYear,
          previousMonthIndex,
          1
        )
      );

    const toDate =
      new Date(
        Date.UTC(
          previousMonthYear,
          previousMonthIndex,
          lmtdDay
        )
      );


    return {

      businessDate,

      fromDate,

      toDate,

    };

  }


  // ====================================================
  // LM
  //
  // LM is uploaded only once per month.
  //
  // LM page must send the MONTH-END date as businessDate.
  //
  // Example:
  // August 2026 selected
  // businessDate = 31-08-2026
  //
  // Stored:
  // businessDate = 31-08-2026
  // fromDate     = 01-08-2026
  // toDate       = 31-08-2026
  // ====================================================

  if (
    reportType ===
    "LM"
  ) {

    const daysInSelectedMonth =
      getDaysInMonth(
        year,
        monthIndex
      );

    const monthEndDate =
      new Date(
        Date.UTC(
          year,
          monthIndex,
          daysInSelectedMonth
        )
      );


    if (
      businessDate.getTime() !==
      monthEndDate.getTime()
    ) {

      throw new Error(
        `LM businessDate must be the month-end date (${formatBusinessDate(monthEndDate)})`
      );

    }


    const fromDate =
      new Date(
        Date.UTC(
          year,
          monthIndex,
          1
        )
      );


    return {

      businessDate:
        monthEndDate,

      fromDate,

      toDate:
        monthEndDate,

    };

  }


  throw new Error(
    `Unsupported report type: ${String(
      reportType
    )}`
  );

}
