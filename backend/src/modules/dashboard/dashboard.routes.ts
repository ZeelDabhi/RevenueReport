import {
  Router,
} from "express";

import {
  requireRoles,
} from "../auth/auth.middleware.ts";

import {
  getDashboard,
  getDashboardRangeReport,
  getDashboardYears,
  getMonthly,
  getMonthlySummary,
  getYearly,
  getYearlySummary,
} from "./dashboard.controller.ts";


const router =
  Router();


// ======================================================
// DASHBOARD ACCESS
//
// FULL ACCESS:
// - SUPER_ADMIN
// - MASTER_ADMIN
// - ADMIN
// - DIRECTOR
// - HO_USER (legacy)
//
// RESTRICTED ACCESS:
// - INCHARGE_DIRECTOR
//
// INCHARGE_DIRECTOR is allowed to call dashboard/report
// APIs, but controller + service restrict every query to
// the logged-in user's assigned unitId.
// ======================================================

const dashboardRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
  "HO_USER",
] as const;


// ======================================================
// AVAILABLE YEARS
// ======================================================

router.get(
  "/dashboard/years",
  requireRoles(
    ...dashboardRoles
  ),
  getDashboardYears
);


// ======================================================
// DATE RANGE DASHBOARD
// ======================================================

router.get(
  "/dashboard-range",
  requireRoles(
    ...dashboardRoles
  ),
  getDashboardRangeReport
);


// ======================================================
// EXACT DATE DASHBOARD
// ======================================================

router.get(
  "/dashboard",
  requireRoles(
    ...dashboardRoles
  ),
  getDashboard
);


// ======================================================
// MONTHLY RAW HISTORY
// ======================================================

router.get(
  "/monthly",
  requireRoles(
    ...dashboardRoles
  ),
  getMonthly
);


// ======================================================
// YEARLY RAW HISTORY
// ======================================================

router.get(
  "/yearly",
  requireRoles(
    ...dashboardRoles
  ),
  getYearly
);


// ======================================================
// MONTHLY FINAL SUMMARY
// ======================================================

router.get(
  "/monthly-summary",
  requireRoles(
    ...dashboardRoles
  ),
  getMonthlySummary
);


// ======================================================
// YEARLY 12-MONTH FINAL SUMMARY
// ======================================================

router.get(
  "/yearly-summary",
  requireRoles(
    ...dashboardRoles
  ),
  getYearlySummary
);


export default router;
