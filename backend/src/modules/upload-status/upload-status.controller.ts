import type {
  Request,
  Response,
} from "express";

import {
  getUploadStatusDate,
} from "./upload-status.validation.ts";

import {
  getDailyUploadStatus,
} from "./upload-status.service.ts";


// ======================================================
// GET DAILY UPLOAD STATUS
//
// Default:
// Yesterday
//
// Example:
//
// GET /upload-status
//
// Specific Date:
//
// GET /upload-status?date=2026-09-18
// ======================================================

export async function getUploadStatus(
  req: Request,
  res: Response
) {

  try {

    // ==================================================
    // STATUS DATE
    // ==================================================

    const statusDate =
      getUploadStatusDate(
        req.query.date
      );


    // ==================================================
    // GET STATUS
    // ==================================================

    const result =
      await getDailyUploadStatus(
        statusDate
      );


    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res
      .status(200)
      .json({

        success:
          true,

        data:
          result,

      });

  } catch (error) {

    // ==================================================
    // ERROR RESPONSE
    // ==================================================

    return res
      .status(400)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to get upload status",

      });

  }
}