import type {
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../auth/auth.types.ts";

import {
  formatBusinessDate,
  resolveBusinessDate,
} from "../../utils/reportDates.ts";

import {
  getAvailableYears,
  getDashboardRange,
  getMonthlyFinalSummary,
  getMonthlyReports,
  getRevenueDashboard,
  getYearlyFinalSummary,
  getYearlyReports,
} from "./dashboard.service.ts";

function getDashboardUnitScope(
  req: AuthenticatedRequest
): number | undefined {

  const user =
    req.authUser;


  if (
    !user
  ) {

    throw new Error(
      "Authentication required"
    );

  }


  if (
    user.role !==
    "INCHARGE_DIRECTOR"
  ) {

    return undefined;

  }


  if (
    !user.unitId
  ) {

    throw new Error(
      "No unit is assigned to this Incharge Director"
    );

  }


  return user.unitId;
}

function getYear(
  value: unknown
): number {

  const year =
    Number(value);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {

    throw new Error(
      "Valid year is required"
    );

  }

  return year;
}

function getMonth(
  value: unknown
): number {

  const month =
    Number(value);

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {

    throw new Error(
      "Month must be between 1 and 12"
    );

  }

  return month;
}

function getRequiredDate(
  value: unknown,
  fieldName: string
): Date {

  const input =
    String(
      value ?? ""
    ).trim();


  if (
    !input
  ) {

    throw new Error(
      `${fieldName} is required`
    );

  }


  return resolveBusinessDate(
    input
  );
}

export async function getDashboardYears(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const unitId =
      getDashboardUnitScope(
        req
      );


    const years =
      await getAvailableYears(
        unitId
      );

    return res
      .status(200)
      .json({
        success: true,
        data: {
          years,
        },
      });

  }
  catch (
    error
  ) {

    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load years",
      });

  }
}

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const unitId =
      getDashboardUnitScope(
        req
      );


    const selectedDate =
      resolveBusinessDate(
        req.query.date
      );

    const data =
      await getRevenueDashboard(
        selectedDate,
        unitId
      );

    return res
      .status(200)
      .json({
        success: true,
        selectedDate:
          formatBusinessDate(
            selectedDate
          ),
        data,
      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load dashboard",
      });

  }
}

export async function getDashboardRangeReport(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const unitId =
      getDashboardUnitScope(
        req
      );


    const fromDate =
      getRequiredDate(
        req.query.fromDate,
        "fromDate"
      );


    const toDate =
      getRequiredDate(
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


    const data =
      await getDashboardRange(
        fromDate,
        toDate,
        unitId
      );


    return res
      .status(200)
      .json({
        success: true,
        fromDate:
          formatBusinessDate(
            fromDate
          ),
        toDate:
          formatBusinessDate(
            toDate
          ),
        data,
      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load dashboard range",
      });

  }
}

export async function getMonthly(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const unitId =
      getDashboardUnitScope(
        req
      );


    const year =
      getYear(
        req.query.year
      );

    const month =
      getMonth(
        req.query.month
      );

    const data =
      await getMonthlyReports(
        year,
        month,
        unitId
      );

    return res
      .status(200)
      .json({
        success: true,
        data,
      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load monthly report",
      });

  }
}

export async function getYearly(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const unitId =
      getDashboardUnitScope(
        req
      );


    const year =
      getYear(
        req.query.year
      );

    const data =
      await getYearlyReports(
        year,
        unitId
      );

    return res
      .status(200)
      .json({
        success: true,
        data,
      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load yearly report",
      });

  }
}

export async function getMonthlySummary(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const unitId =
      getDashboardUnitScope(
        req
      );


    const year =
      getYear(
        req.query.year
      );

    const month =
      getMonth(
        req.query.month
      );

    const data =
      await getMonthlyFinalSummary(
        year,
        month,
        unitId
      );

    return res
      .status(200)
      .json({
        success: true,
        data,
      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load monthly summary",
      });

  }
}

export async function getYearlySummary(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const unitId =
      getDashboardUnitScope(
        req
      );


    const year =
      getYear(
        req.query.year
      );

    const data =
      await getYearlyFinalSummary(
        year,
        unitId
      );

    return res
      .status(200)
      .json({
        success: true,
        data,
      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load yearly summary",
      });

  }
}
