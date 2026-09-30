import type {
  Response,
} from "express";

import type {
  AppUserRole,
  AuthenticatedRequest,
} from "../auth/auth.types.ts";

import {
  getSpecialityRevenueReport,
} from "./speciality.service.ts";

import type {
  SpecialityReportMode,
} from "./speciality.service.ts";


// ======================================================
// FULL ACCESS ROLES
// ======================================================

const FULL_ACCESS_ROLES:
  AppUserRole[] = [

  "SUPER_ADMIN",

  "MASTER_ADMIN",

  "ADMIN",

  "DIRECTOR",

];


// ======================================================
// VALID UNITS
// ======================================================

const VALID_UNIT_CODES = [
  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",
] as const;


// ======================================================
// DATE REGEX
// ======================================================

const DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}$/;


// ======================================================
// FULL ACCESS CHECK
// ======================================================

function hasFullAccess(
  role:
    AppUserRole
): boolean {

  return FULL_ACCESS_ROLES.includes(
    role
  );

}


// ======================================================
// PARSE MODE
// ======================================================

function parseMode(
  value:
    unknown
): SpecialityReportMode {

  const rawMode =
    String(
      value ??
      "DAILY"
    )
      .trim()
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        "_"
      );


  if (
    rawMode ===
    "DAILY"
  ) {

    return "DAILY";

  }


  if (
    rawMode ===
      "DATE_RANGE" ||
    rawMode ===
      "DATERANGE" ||
    rawMode ===
      "RANGE"
  ) {

    return "DATE_RANGE";

  }


  if (
    rawMode ===
    "MONTH"
  ) {

    return "MONTH";

  }


  if (
    rawMode ===
    "YEAR"
  ) {

    return "YEAR";

  }


  throw new Error(
    "mode must be DAILY, DATE_RANGE, MONTH or YEAR"
  );

}


// ======================================================
// PARSE DATE
// ======================================================

function parseDate(
  value:
    unknown,
  fieldName:
    string
): Date {

  const rawDate =
    String(
      value ??
      ""
    )
      .trim();


  if (
    !rawDate
  ) {

    throw new Error(
      `${fieldName} is required`
    );

  }


  if (
    !DATE_REGEX.test(
      rawDate
    )
  ) {

    throw new Error(
      `${fieldName} must be in YYYY-MM-DD format`
    );

  }


  const [
    yearText,
    monthText,
    dayText,
  ] =
    rawDate.split(
      "-"
    );


  const year =
    Number(
      yearText
    );


  const month =
    Number(
      monthText
    );


  const day =
    Number(
      dayText
    );


  const parsedDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  if (
    parsedDate.getUTCFullYear() !==
      year ||
    parsedDate.getUTCMonth() !==
      month - 1 ||
    parsedDate.getUTCDate() !==
      day
  ) {

    throw new Error(
      `${fieldName} is invalid`
    );

  }


  return parsedDate;

}


// ======================================================
// PARSE YEAR
// ======================================================

function parseYear(
  value:
    unknown
): number {

  const text =
    String(
      value ??
      ""
    )
      .trim();


  if (
    !/^\d{4}$/.test(
      text
    )
  ) {

    throw new Error(
      "year must be a 4-digit year"
    );

  }


  const year =
    Number(
      text
    );


  if (
    year < 1900 ||
    year > 2200
  ) {

    throw new Error(
      "year is invalid"
    );

  }


  return year;

}


// ======================================================
// PARSE MONTH
// ======================================================

function parseMonth(
  value:
    unknown
): number {

  const text =
    String(
      value ??
      ""
    )
      .trim();


  if (
    !/^\d{1,2}$/.test(
      text
    )
  ) {

    throw new Error(
      "month must be between 1 and 12"
    );

  }


  const month =
    Number(
      text
    );


  if (
    month < 1 ||
    month > 12
  ) {

    throw new Error(
      "month must be between 1 and 12"
    );

  }


  return month;

}


// ======================================================
// UNIT
// ======================================================

function normalizeUnitCode(
  value:
    unknown
): string | null {

  const unitCode =
    String(
      value ??
      ""
    )
      .trim()
      .toUpperCase();


  if (
    !unitCode
  ) {

    return null;

  }


  if (
    !VALID_UNIT_CODES.includes(
      unitCode as
        (
          typeof VALID_UNIT_CODES
        )[number]
    )
  ) {

    throw new Error(
      `Invalid unit code: ${unitCode}`
    );

  }


  return unitCode;

}


// ======================================================
// SPECIALITY DASHBOARD
//
// DAILY
// ?mode=DAILY&date=2026-09-24&unit=MB
//
// DATE RANGE
// ?mode=DATE_RANGE
// &fromDate=2026-09-01
// &toDate=2026-09-24
// &unit=MB
//
// MONTH
// ?mode=MONTH
// &year=2026
// &month=9
// &unit=MB
//
// YEAR
// ?mode=YEAR
// &year=2026
// &unit=MB
//
// INCHARGE DIRECTOR
// Own unit only.
// ======================================================

export async function getSpecialityDashboard(
  req:
    AuthenticatedRequest,
  res:
    Response
) {

  try {

    // ==================================================
    // AUTH
    // ==================================================

    const actor =
      req.authUser;


    if (
      !actor
    ) {

      return res
        .status(
          401
        )
        .json({

          success:
            false,

          message:
            "Authentication required",

        });

    }


    // ==================================================
    // ACCESS
    // ==================================================

    const fullAccess =
      hasFullAccess(
        actor.role
      );


    const inchargeAccess =
      actor.role ===
      "INCHARGE_DIRECTOR";


    if (
      !fullAccess &&
      !inchargeAccess
    ) {

      return res
        .status(
          403
        )
        .json({

          success:
            false,

          message:
            "You do not have permission to view speciality revenue",

        });

    }


    // ==================================================
    // MODE
    // ==================================================

    const mode =
      parseMode(
        req.query.mode
      );


    // ==================================================
    // UNIT ACCESS
    // ==================================================

    let unitCode:
      string | null =
      null;


    let scopedUnitId:
      number | null =
      null;


    if (
      fullAccess
    ) {

      unitCode =
        normalizeUnitCode(
          req.query.unit
        );

    }


    if (
      inchargeAccess
    ) {

      if (
        !actor.unitId
      ) {

        return res
          .status(
            403
          )
          .json({

            success:
              false,

            message:
              "No unit is assigned to this Incharge Director",

          });

      }


      scopedUnitId =
        actor.unitId;


      unitCode =
        null;

    }


    // ==================================================
    // DAILY
    // ==================================================

    if (
      mode ===
      "DAILY"
    ) {

      const businessDate =
        parseDate(
          req.query.date,
          "date"
        );


      const report =
        await getSpecialityRevenueReport({

          mode:
            "DAILY",

          businessDate,

          unitId:
            scopedUnitId,

          unitCode,

        });


      return res
        .status(
          200
        )
        .json({

          success:
            true,

          data:
            report,

        });

    }


    // ==================================================
    // DATE RANGE
    // ==================================================

    if (
      mode ===
      "DATE_RANGE"
    ) {

      const fromDate =
        parseDate(
          req.query.fromDate,
          "fromDate"
        );


      const toDate =
        parseDate(
          req.query.toDate,
          "toDate"
        );


      if (
        fromDate.getTime() >
        toDate.getTime()
      ) {

        throw new Error(
          "fromDate cannot be after toDate"
        );

      }


      const totalDays =
        Math.floor(
          (
            toDate.getTime() -
            fromDate.getTime()
          ) /
          86400000
        ) +
        1;


      if (
        totalDays >
        366
      ) {

        throw new Error(
          "Date range cannot exceed 366 days"
        );

      }


      const report =
        await getSpecialityRevenueReport({

          mode:
            "DATE_RANGE",

          fromDate,

          toDate,

          unitId:
            scopedUnitId,

          unitCode,

        });


      return res
        .status(
          200
        )
        .json({

          success:
            true,

          data:
            report,

        });

    }


    // ==================================================
    // MONTH
    // ==================================================

    if (
      mode ===
      "MONTH"
    ) {

      const year =
        parseYear(
          req.query.year
        );


      const month =
        parseMonth(
          req.query.month
        );


      const report =
        await getSpecialityRevenueReport({

          mode:
            "MONTH",

          year,

          month,

          unitId:
            scopedUnitId,

          unitCode,

        });


      return res
        .status(
          200
        )
        .json({

          success:
            true,

          data:
            report,

        });

    }


    // ==================================================
    // YEAR
    // ==================================================

    const year =
      parseYear(
        req.query.year
      );


    const report =
      await getSpecialityRevenueReport({

        mode:
          "YEAR",

        year,

        unitId:
          scopedUnitId,

        unitCode,

      });


    return res
      .status(
        200
      )
      .json({

        success:
          true,

        data:
          report,

      });

  }
  catch (
    error
  ) {

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load speciality revenue";


    const isBadRequest =
      message.includes(
        "required"
      ) ||
      message.includes(
        "must be"
      ) ||
      message.includes(
        "invalid"
      ) ||
      message.includes(
        "Invalid"
      ) ||
      message.includes(
        "cannot"
      ) ||
      message.startsWith(
        "Unsupported speciality report mode"
      );


    return res
      .status(
        isBadRequest
          ? 400
          : 500
      )
      .json({

        success:
          false,

        message,

      });

  }

}