import {
  Router,
} from "express";

import {
  getSpecialityDashboard,
} from "./speciality.controller.ts";

import {
  getSpecialityTrendDashboard,
} from "./speciality-trend.controller.ts";
const router =
  Router();


// ======================================================
// SPECIALITY REVENUE DASHBOARD
// ======================================================

router.get(
  "/dashboard",
  getSpecialityDashboard
);


// ======================================================
// UNIT SPECIALITY TREND
// ======================================================

router.get(
  "/trend",
  getSpecialityTrendDashboard
);


export default router;

