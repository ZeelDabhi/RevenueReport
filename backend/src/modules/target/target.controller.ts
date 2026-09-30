import type {
  Request,
  Response,
} from "express";

import {
  validateTargetYear,
  validateTargetMonth,
  validateTargets,
} from "./target.validation.ts";

import {
  saveTargets,
  getTargets,
} from "./target.service.ts";


// ======================================================
// SAVE / UPDATE TARGETS
//
// POST:
// /api/v1/revenue/targets
//
// BODY:
// {
//   "year": 2026,
//   "month": 9,
//   "targets": [
//     { "unitCode": "MB", "targetLakhs": 1200 },
//     ...
//   ]
// }
// ======================================================

export async function saveRevenueTargets(
  req: Request,
  res: Response
) {
  try {

    const year =
      validateTargetYear(
        req.body?.year
      );


    const month =
      validateTargetMonth(
        req.body?.month
      );


    const targets =
      validateTargets(
        req.body?.targets
      );


    const result =
      await saveTargets(
        year,
        month,
        targets
      );


    return res.json({
      success: true,

      message:
        "Revenue targets saved successfully",

      data:
        result,
    });


  } catch (error) {

    console.error(
      "Save Revenue Target Error:",
      error
    );


    return res
      .status(400)
      .json({

        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to save revenue targets",

      });

  }
}


// ======================================================
// GET TARGETS
//
// GET:
// /api/v1/revenue/targets?year=2026&month=9
// ======================================================

export async function getRevenueTargets(
  req: Request,
  res: Response
) {
  try {

    const year =
      validateTargetYear(
        req.query.year
      );


    const month =
      validateTargetMonth(
        req.query.month
      );


    const result =
      await getTargets(
        year,
        month
      );


    return res.json({
      success: true,

      data:
        result,
    });


  } catch (error) {

    console.error(
      "Get Revenue Target Error:",
      error
    );


    return res
      .status(400)
      .json({

        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch revenue targets",

      });

  }
}