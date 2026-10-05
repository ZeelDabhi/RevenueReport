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

const dashboardRoles = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
  "HO_USER",
] as const;

router.get(
  "/dashboard/years",
  requireRoles(
    ...dashboardRoles
  ),
  getDashboardYears
);

router.get(
  "/dashboard-range",
  requireRoles(
    ...dashboardRoles
  ),
  getDashboardRangeReport
);

router.get(
  "/dashboard",
  requireRoles(
    ...dashboardRoles
  ),
  getDashboard
);

router.get(
  "/monthly",
  requireRoles(
    ...dashboardRoles
  ),
  getMonthly
);

router.get(
  "/yearly",
  requireRoles(
    ...dashboardRoles
  ),
  getYearly
);

router.get(
  "/monthly-summary",
  requireRoles(
    ...dashboardRoles
  ),
  getMonthlySummary
);

router.get(
  "/yearly-summary",
  requireRoles(
    ...dashboardRoles
  ),
  getYearlySummary
);

export default router;
