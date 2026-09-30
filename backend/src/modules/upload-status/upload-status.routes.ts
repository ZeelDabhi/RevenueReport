import {
  Router,
} from "express";

import {
  requireRoles,
} from "../auth/auth.middleware.ts";

import {
  getUploadStatus,
} from "./upload-status.controller.ts";


const router =
  Router();


// ======================================================
// UPLOAD STATUS ACCESS
//
// All logged-in roles
// ======================================================

const uploadStatusRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "HO_USER",
] as const;


// ======================================================
// DAILY UPLOAD STATUS
//
// GET:
// /api/v1/revenue/upload-status
//
// OR:
//
// /api/v1/revenue/upload-status?date=2026-09-18
// ======================================================

router.get(
  "/upload-status",

  requireRoles(
    ...uploadStatusRoles
  ),

  getUploadStatus
);


export default router;