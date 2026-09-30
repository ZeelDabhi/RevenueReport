import {
  Router,
} from "express";

import multer
  from "multer";

import {
  requireRoles,
} from "../auth/auth.middleware.ts";

import {
  uploadSingleRevenue,
  uploadAllRevenue,
} from "./revenue.controller.ts";


const router =
  Router();


// ======================================================
// MULTER CONFIG
// ======================================================

const upload =
  multer({

    storage:
      multer.memoryStorage(),

    limits: {

      fileSize:
        20 *
        1024 *
        1024,

    },

  });


// ======================================================
// ALLOWED REVENUE ROLES
// ======================================================

const revenueRoles = [

  "SUPER_ADMIN",

  "MASTER_ADMIN",

  "ADMIN",

  "HO_USER",

] as const;


// ======================================================
// SINGLE FILE UPLOAD
//
// Used by LM Upload page.
//
// form-data:
// unitCode
// reportType = LM
// businessDate = month-end date
// file
// ======================================================

router.post(
  "/upload",

  requireRoles(
    ...revenueRoles
  ),

  upload.single(
    "file"
  ),

  uploadSingleRevenue
);


// ======================================================
// DAILY REVENUE UPLOAD
//
// FTD + MTD + LMTD only.
// LM is uploaded separately once per month.
// ======================================================

router.post(
  "/upload-all",

  requireRoles(
    ...revenueRoles
  ),

  upload.fields([

    {
      name:
        "ftdFile",

      maxCount:
        1,
    },

    {
      name:
        "mtdFile",

      maxCount:
        1,
    },

    {
      name:
        "lmtdFile",

      maxCount:
        1,
    },

  ]),

  uploadAllRevenue
);


export default router;
