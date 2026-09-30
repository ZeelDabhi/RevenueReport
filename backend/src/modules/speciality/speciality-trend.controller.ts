import type {
  Response,
} from "express";

import type {
  AppUserRole,
  AuthenticatedRequest,
} from "../auth/auth.types.ts";

import {
  getSpecialityTrend,
} from "./speciality-trend.service.ts";


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
// PARSE DATE
// ======================================================

function parseDate(
  value:
    unknown,
  fieldName:
    string
): string {

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


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {

    throw new Error(
      `${fieldName} is invalid`
    );

  }


  return rawDate;

}


// ======================================================
// UNIT
// ======================================================

function normalizeUnitCode(
  value:
    unknown
): string {

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

    throw new Error(
      "unit is required"
    );

  }


  if (
    !VALID_UNIT_CODES.includes(
      unitCode as
        typeof VALID_UNIT_CODES[number]
    )
  ) {

    throw new Error(
      `Invalid unit code: ${unitCode}`
    );

  }


  return unitCode;

}


// ======================================================
// SPECIALITY TREND
//
// GET
// /api/v1/speciality/trend
// ?fromDate=2026-09-22
// &toDate=2026-09-28
// &unit=MB
//
// INCHARGE_DIRECTOR:
// Own unit only; query unit is ignored.
// ======================================================

export async function getSpecialityTrendDashboard(
  req:
    AuthenticatedRequest,
  res:
    Response
) {

  try {

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
            "You do not have permission to view speciality trend",

        });

    }


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


    const report =
      await getSpecialityTrend({

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
  catch (
    error
  ) {

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load speciality trend";


    const isBadRequest =
      message.includes(
        "required"
      ) ||
      message.includes(
        "YYYY-MM-DD"
      ) ||
      message.includes(
        "invalid"
      ) ||
      message.includes(
        "Invalid unit code:"
      ) ||
      message.includes(
        "cannot be after"
      ) ||
      message.includes(
        "cannot exceed"
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
