import type {
  Request,
  Response,
} from "express";

import {
  saveSpecialityMasterLmExcel,
} from "./speciality-master-lm.service.ts";


// ======================================================
// MASTER LM EXCEL UPLOAD
//
// POST:
// /api/v1/speciality/master-lm-upload
//
// form-data:
// targetMonth = 2026-09
// file        = MASTER_DATE_FORMULA.xlsx
//
// Reads only:
// - Department / Department Name
// - LM
//
// All other Excel columns are ignored.
//
// IMPORTANT:
// This special Master Excel upload is allowed ONLY for
// September 2026. October onward continues with the
// normal monthly LM CSV upload flow.
// ======================================================

export async function uploadSpecialityMasterLm(
  req:
    Request,
  res:
    Response
) {

  try {

    const targetMonth =
      String(
        req.body.targetMonth ??
        ""
      )
        .trim();


    if (
      targetMonth !==
        "2026-09"
    ) {

      return res
        .status(
          400
        )
        .json({

          success:
            false,

          message:
            "Master LM Excel upload is allowed only for September 2026.",

        });

    }


    const file =
      req.file;


    if (
      !file
    ) {

      return res
        .status(
          400
        )
        .json({

          success:
            false,

          message:
            "MASTER_DATE_FORMULA Excel file is required.",

        });

    }


    const fileName =
      file.originalname
        .toLowerCase();


    if (
      !fileName.endsWith(
        ".xlsx"
      ) &&
      !fileName.endsWith(
        ".xls"
      )
    ) {

      return res
        .status(
          400
        )
        .json({

          success:
            false,

          message:
            "Please upload an Excel file (.xlsx or .xls).",

        });

    }


    const result =
      await saveSpecialityMasterLmExcel(
        file,
        targetMonth
      );


    return res
      .status(
        200
      )
      .json({

        success:
          true,

        message:
          "September 2026 Master LM uploaded successfully for all units.",

        data:
          result,

      });

  }
  catch (
    error
  ) {

    return res
      .status(
        400
      )
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Master LM Excel upload failed.",

      });

  }

}
