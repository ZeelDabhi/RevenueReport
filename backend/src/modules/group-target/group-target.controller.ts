import type {
  Request,
  Response,
} from "express";

import {
  validateGroupTargetYear,
  validateGroupTargetMonth,
  validateGroupTargetLakhs,
} from "./group-target.validation.ts";

import {
  saveGroupTarget,
  getGroupTarget,
} from "./group-target.service.ts";

export async function saveGroupRevenueTarget(
  req: Request,
  res: Response
) {
  try {

    const year =
      validateGroupTargetYear(
        req.body?.year
      );

    const month =
      validateGroupTargetMonth(
        req.body?.month
      );

    const groupTargetLakhs =
      validateGroupTargetLakhs(
        req.body?.groupTargetLakhs
      );

    const result =
      await saveGroupTarget(
        year,
        month,
        groupTargetLakhs
      );

    return res.json({
      success: true,
      message:
        "Group revenue target saved successfully",
      data:
        result,
    });

  } catch (error) {
    console.error(
      "Save Group Revenue Target Error:",
      error
    );

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to save group revenue target",
      });
  }
}

export async function getGroupRevenueTarget(
  req: Request,
  res: Response
) {
  try {

    const year =
      validateGroupTargetYear(
        req.query.year
      );

    const month =
      validateGroupTargetMonth(
        req.query.month
      );

    const result =
      await getGroupTarget(
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
      "Get Group Revenue Target Error:",
      error
    );

    return res
      .status(400)
      .json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch group revenue target",
      });
  }
}