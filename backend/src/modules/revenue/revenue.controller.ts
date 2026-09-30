import type {
  Request,
  Response,
} from "express";

import {
  prisma,
} from "../../config/database.ts";

import {
  resolveBusinessDate,
  formatBusinessDate,
} from "../../utils/reportDates.ts";

import {
  getReportType,
  getUnitCode,
  validateRevenueFile,
} from "./revenue.validation.ts";

import {
  parseRevenueCsv,
} from "./revenue.parser.ts";

import {
  saveRevenueReport,
} from "./revenue.service.ts";

import {
  validateUnitFile,
} from "../unit/unit.validation.ts";


// ======================================================
// SINGLE REVENUE UPLOAD
//
// Used for LM monthly upload as well.
//
// POST:
// /api/v1/revenue/upload
//
// form-data:
//
// unitCode
// reportType = FTD / MTD / LMTD / LM
// businessDate
// file
// ======================================================

export async function uploadSingleRevenue(
  req: Request,
  res: Response
) {

  try {

    const unitCode =
      getUnitCode(
        req.body.unitCode
      );


    const reportType =
      getReportType(
        req.body.reportType
      );


    const businessDate =
      resolveBusinessDate(
        req.body.businessDate
      );


    const file =
      req.file;


    if (
      !file
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          message:
            "Revenue CSV file is required",

        });

    }


    validateRevenueFile(
      file
    );


    validateUnitFile(
      unitCode,
      file
    );


    parseRevenueCsv(
      file.buffer
    );


    const unit =
      await prisma.unit.findUnique({

        where: {
          code:
            unitCode,
        },

      });


    if (
      !unit
    ) {

      return res
        .status(404)
        .json({

          success:
            false,

          message:
            `Unit ${unitCode} not found`,

        });

    }


    if (
      !unit.isActive
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          message:
            `Unit ${unitCode} is inactive`,

        });

    }


    const result =
      await prisma.$transaction(
        async (
          tx
        ) => {

          return saveRevenueReport(
            tx,
            unit,
            reportType,
            file,
            businessDate
          );

        }
      );


    return res
      .status(200)
      .json({

        success:
          true,

        message:
          reportType === "LM"
            ? "LM full-month revenue uploaded successfully"
            : "Revenue report uploaded successfully",

        selectedBusinessDate:
          formatBusinessDate(
            businessDate
          ),

        data:
          result,

      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Revenue upload failed",

      });

  }

}


// ======================================================
// DAILY UPLOAD
//
// FTD + MTD + LMTD only.
//
// LM is NOT uploaded here.
// LM is uploaded once per month using /upload.
//
// POST:
// /api/v1/revenue/upload-all
// ======================================================

export async function uploadAllRevenue(
  req: Request,
  res: Response
) {

  try {

    const unitCode =
      getUnitCode(
        req.body.unitCode
      );


    const businessDate =
      resolveBusinessDate(
        req.body.businessDate
      );


    const files =
      req.files as
        | {
            [fieldname: string]:
              Express.Multer.File[];
          }
        | undefined;


    const ftdFile =
      files?.ftdFile?.[0];


    const mtdFile =
      files?.mtdFile?.[0];


    const lmtdFile =
      files?.lmtdFile?.[0];


    if (
      !ftdFile ||
      !mtdFile ||
      !lmtdFile
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          message:
            "ftdFile, mtdFile and lmtdFile are required",

        });

    }


    validateRevenueFile(
      ftdFile
    );

    validateRevenueFile(
      mtdFile
    );

    validateRevenueFile(
      lmtdFile
    );


    validateUnitFile(
      unitCode,
      ftdFile
    );

    validateUnitFile(
      unitCode,
      mtdFile
    );

    validateUnitFile(
      unitCode,
      lmtdFile
    );


    parseRevenueCsv(
      ftdFile.buffer
    );

    parseRevenueCsv(
      mtdFile.buffer
    );

    parseRevenueCsv(
      lmtdFile.buffer
    );


    const unit =
      await prisma.unit.findUnique({

        where: {
          code:
            unitCode,
        },

      });


    if (
      !unit
    ) {

      return res
        .status(404)
        .json({

          success:
            false,

          message:
            `Unit ${unitCode} not found`,

        });

    }


    if (
      !unit.isActive
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          message:
            `Unit ${unitCode} is inactive`,

        });

    }


    const results =
      await prisma.$transaction(
        async (
          tx
        ) => {

          const FTD =
            await saveRevenueReport(
              tx,
              unit,
              "FTD",
              ftdFile,
              businessDate
            );


          const MTD =
            await saveRevenueReport(
              tx,
              unit,
              "MTD",
              mtdFile,
              businessDate
            );


          const LMTD =
            await saveRevenueReport(
              tx,
              unit,
              "LMTD",
              lmtdFile,
              businessDate
            );


          return {

            FTD,

            MTD,

            LMTD,

          };

        }
      );


    return res
      .status(200)
      .json({

        success:
          true,

        message:
          "FTD, MTD and LMTD uploaded successfully",

        selectedBusinessDate:
          formatBusinessDate(
            businessDate
          ),

        data:
          results,

      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Revenue upload failed",

      });

  }

}
